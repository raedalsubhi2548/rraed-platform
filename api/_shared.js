// Shared helpers for the Vercel serverless functions. Secrets live only here (server side).
import { createClient } from '@supabase/supabase-js'

export const admin = createClient((process.env.VITE_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''), process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
export const TAP = 'https://api.tap.company/v2'
export const tapHeaders = () => ({ authorization: `Bearer ${process.env.TAP_SECRET_KEY}`, 'content-type': 'application/json' })
// payment return/webhook addresses: from config, or the deployment's own production domain — never a request header
export const siteUrl = () => (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://rraed.com')).replace(/\/$/, '')

export async function userFromRequest(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data?.user || null
}

// How the session signed in (the JWT's amr claim; the token itself was just verified by getUser).
const signIns = (req) => {
  try { return JSON.parse(Buffer.from((req.headers.authorization || '').split('.')[1] || '', 'base64url').toString()).amr || [] } catch { return [] }
}
/** The signed-in owner, only when the session is the code of a two-step sign-in: never a password session, and the
 *  code must follow a correct password that api/login-start.js recorded within the 15 minutes before it
 *  (the same rule as public.is_admin() in supabase/login-2fa-2026-10.sql). */
export async function adminFromRequest(req) {
  const user = await userFromRequest(req)
  if (!user) return null
  const amr = signIns(req)
  if (!amr.length || amr.some((a) => a.method === 'password')) return null
  const at = Math.max(...amr.map((a) => Number(a.timestamp) || 0)) * 1000
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return null
  const { count } = await admin.from('login_checks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    .gte('at', new Date(at - 15 * 60_000).toISOString()).lte('at', new Date(at + 60_000).toISOString())
  return count ? user : null
}

// Asks Tap for the charge (never trusts the redirect) and marks the order paid if it matches.
export async function confirmCharge(chargeId, browser = {}) {
  const r = await fetch(`${TAP}/charges/${encodeURIComponent(chargeId)}`, { headers: tapHeaders() })
  if (!r.ok) return { ok: false, reason: 'charge-not-found' }
  const charge = await r.json()
  const orderId = charge.metadata?.order_id
  if (!orderId) return { ok: false, reason: 'no-order' }
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
  if (!order) return { ok: false, reason: 'order-not-found' }
  if (charge.status !== 'CAPTURED') return { ok: false, status: charge.status, orderId }
  if (Math.abs(Number(charge.amount) - Number(order.total)) > 0.01 || charge.currency !== 'SAR') return { ok: false, reason: 'amount-mismatch', orderId }
  if (order.status === 'pending') {
    const { data: updated } = await admin.from('orders').update({
      status: 'paid', payment_ref: charge.id,
      history: [...(order.history || []), { status: 'paid', at: new Date().toISOString(), note: 'تم الدفع عبر Tap' }],
    }).eq('id', orderId).eq('status', 'pending').select('*')
    // only the call that actually marked it paid sends the receipt + invoice (the redirect and the webhook may both arrive)
    if (updated?.[0]) {
      const { sendOrderEmail } = await import('./_mail.js')
      await sendOrderEmail(updated[0], 'paid').catch(() => {})
      const { snapPurchase } = await import('./_snap.js')
      await snapPurchase(updated[0], browser)
    }
  }
  else if (order.status === 'cancelled') {
    // money arrived for an order that was cancelled meanwhile (by the admin, or replaced by a newer checkout)
    console.error('captured charge on cancelled order', orderId, charge.id)
    const { sendAdminAlert } = await import('./_mail.js')
    await sendAdminAlert(`دفعة على طلب ملغي #${order.number}`, `وصلت دفعة مقبولة ${charge.id} بمبلغ ${charge.amount} ر.س للطلب #${order.number} وهو ملغي. راجعها في Tap: نفّذ الطلب أو استرجع المبلغ للعميل.`).catch(() => {})
  }
  else if (order.payment_ref && order.payment_ref !== charge.id) {
    // paid twice (two tabs): keep the first, flag the extra charge for a refund
    console.error('extra captured charge', orderId, charge.id)
    const { sendAdminAlert } = await import('./_mail.js')
    await sendAdminAlert(`دفعة مكررة للطلب #${order.number}`, `الطلب #${order.number} مدفوع مسبقاً (${order.payment_ref})، ووصلت دفعة ثانية مقبولة ${charge.id} بمبلغ ${charge.amount} ر.س. راجعها في Tap واسترجعها للعميل.`).catch(() => {})
  }
  return { ok: true, orderId }
}
