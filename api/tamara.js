// Tamara (pay in instalments). One function, three jobs (?op=):
//   GET  config            → { enabled, publicKey } for the widget and the checkout option
//   POST start  { orderId }   → { url }  a Tamara checkout session for the signed-in customer's pending order
//   POST notify            ← Tamara's webhook (tamaraToken = JWT signed with TAMARA_NOTIFICATION_TOKEN)
//   GET  verify ?order=&tamara=     → { ok }   the customer is back from Tamara: confirm the order now
// An order is marked paid only after Tamara confirms it (authorise), and its amount matches ours. The Tamara order id
// is kept in orders.payment_ref as "tamara:<id>" (payment_method stays "card"; no database change needed).
// Env (Vercel): TAMARA_API_TOKEN, TAMARA_NOTIFICATION_TOKEN, TAMARA_PUBLIC_KEY, TAMARA_SANDBOX=1 while testing.
import crypto from 'node:crypto'
import { admin, siteUrl, userFromRequest } from './_shared.js'
import { browserOf } from './_snap.js'
import { tamaraRules, tamaraBlock, tamaraBlockText } from '../src/lib/payrules.js'

const BASE = () => (process.env.TAMARA_SANDBOX ? 'https://api-sandbox.tamara.co' : 'https://api.tamara.co')
const enabled = () => !!process.env.TAMARA_API_TOKEN
// sandbox keys, or TAMARA_TEAM_ONLY=1 (first live test): only the owner and the team see Tamara
const teamOnly = () => !!(process.env.TAMARA_SANDBOX || process.env.TAMARA_TEAM_ONLY)
// while testing (sandbox) only the owner and the team see and use Tamara: a test approval moves no real money
async function isTeam(user) {
  if (!user) return false
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (me?.role === 'admin') return true
  const { data: st } = await admin.from('staff').select('email').eq('email', String(user.email || '').toLowerCase()).maybeSingle()
  return !!st
}
const sar = (n) => ({ amount: Math.round(Number(n) * 100) / 100, currency: 'SAR' })

async function tamara(path, method = 'GET', body) {
  const r = await fetch(BASE() + path, {
    method,
    headers: { authorization: `Bearer ${String(process.env.TAMARA_API_TOKEN || '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '')}`, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  return { ok: r.ok, status: r.status, data }
}
const tamaraError = (d) => d?.errors?.[0]?.error_code || d?.message || d?.errors?.[0]?.message || ''

/** HS256 JWT check with the notification token (no library: header.payload.signature, base64url). */
function validToken(token) {
  const key = String(process.env.TAMARA_NOTIFICATION_TOKEN || '').trim()
  if (!key || typeof token !== 'string') return false
  const [h, p, s] = token.split('.')
  if (!h || !p || !s) return false
  try {
    if (JSON.parse(Buffer.from(h, 'base64url').toString()).alg !== 'HS256') return false
    const want = crypto.createHmac('sha256', key).update(`${h}.${p}`).digest()
    const got = Buffer.from(s, 'base64url')
    if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return false
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString())
    return !(claims.exp && claims.exp * 1000 < Date.now())
  } catch { return false }
}

/** Reads the Tamara order, and if it is approved for one of our pending orders with the same amount: authorise it,
 *  mark our order paid (once), send the receipt + Snap purchase, then capture it so the money is settled. */
async function confirm(tamaraId, browser = {}) {
  if (!/^[\w-]{8,64}$/.test(String(tamaraId || ''))) return { ok: false }
  const t = await tamara(`/merchants/orders/${encodeURIComponent(tamaraId)}`)
  if (!t.ok) return { ok: false }
  const tOrder = t.data
  const ourId = tOrder.order_reference_id
  const { data: order } = await admin.from('orders').select('*').eq('id', ourId).maybeSingle()
  if (!order) return { ok: false }
  const tStatus = String(tOrder.status || '').toLowerCase()
  const already = order.payment_ref === `tamara:${tamaraId}` && order.status !== 'pending'
  if (already) return { ok: true, orderId: order.id }
  if (!['approved', 'authorised', 'fully_captured', 'partially_captured'].includes(tStatus)) return { ok: false, orderId: order.id, status: tStatus }
  if (Math.abs(Number(tOrder.total_amount?.amount) - Number(order.total)) > 0.01 || (tOrder.total_amount?.currency || 'SAR') !== 'SAR') {
    console.error('tamara amount mismatch', order.id, tamaraId)
    return { ok: false, orderId: order.id, reason: 'amount-mismatch' }
  }
  if (order.status !== 'pending') {
    // paid some other way meanwhile (card): drop this Tamara order so the customer isn't charged twice
    if (tStatus === 'approved' || tStatus === 'authorised') {
      if (tStatus === 'approved') await tamara(`/orders/${encodeURIComponent(tamaraId)}/authorise`, 'POST')
      await tamara(`/orders/${encodeURIComponent(tamaraId)}/cancel`, 'POST', { total_amount: sar(order.total), shipping_amount: sar(0), tax_amount: sar(0), items: [] })
    }
    return { ok: order.payment_ref === `tamara:${tamaraId}`, orderId: order.id }
  }
  if (tStatus === 'approved') {
    const a = await tamara(`/orders/${encodeURIComponent(tamaraId)}/authorise`, 'POST')
    const st = String(a.data?.status || '').toLowerCase()
    if (!a.ok && !/already/i.test(tamaraError(a.data))) { console.error('tamara authorise failed', tamaraId, a.status, tamaraError(a.data)); return { ok: false, orderId: order.id } }
    if (a.ok && st && !['authorised', 'fully_captured'].includes(st)) return { ok: false, orderId: order.id, status: st }
  }
  const { data: updated } = await admin.from('orders').update({
    status: 'paid', payment_ref: `tamara:${tamaraId}`,
    history: [...(order.history || []), { status: 'paid', at: new Date().toISOString(), note: 'تم الدفع عبر تمارا (تقسيط)' }],
  }).eq('id', order.id).eq('status', 'pending').select('*')
  if (updated?.[0]) {
    const { sendOrderEmail } = await import('./_mail.js')
    await sendOrderEmail(updated[0], 'paid').catch(() => {})
    const { snapPurchase } = await import('./_snap.js')
    await snapPurchase(updated[0], browser)
    // services are delivered online: capture now so Tamara settles the money (it would auto-capture after 21 days anyway)
    if (!tStatus.includes('captured')) {
      const c = await tamara('/payments/capture', 'POST', {
        order_id: tamaraId, total_amount: sar(order.total),
        shipping_info: { shipped_at: new Date().toISOString(), shipping_company: 'خدمة إلكترونية' },
      })
      if (!c.ok) console.error('tamara capture failed', tamaraId, c.status, tamaraError(c.data))
    }
  }
  return { ok: true, orderId: order.id }
}

/** The instalment plans Tamara offers this store, with their limits: [{ instalments, min, max }] (cached 10 minutes). */
let plansCache = { at: 0, list: [] }
async function plans() {
  if (Date.now() - plansCache.at < 600_000) return plansCache.list
  const list = []
  for (const value of [1000, 300]) {
    const r = await tamara(`/checkout/payment-types?country=SA&currency=SAR&order_value=${value}`).catch(() => ({ ok: false }))
    const types = Array.isArray(r.data) ? r.data : r.data?.payment_types || []
    for (const t of types) {
      for (const p of t.supported_instalments?.length ? t.supported_instalments : [{ instalments: t.instalments || (t.name === 'PAY_BY_INSTALMENTS' ? 4 : 0), min_limit: t.min_limit, max_limit: t.max_limit }]) {
        const n = Number(p.instalments) || 0
        if (n > 1 && !list.some((x) => x.instalments === n)) list.push({ instalments: n, min: Number(p.min_limit?.amount ?? p.min_limit) || 0, max: Number(p.max_limit?.amount ?? p.max_limit) || 0 })
      }
    }
    if (list.length) break
  }
  list.sort((a, b) => a.instalments - b.instalments)
  plansCache = { at: Date.now(), list }
  return list
}

async function start(req, res) {
  const user = await userFromRequest(req)
  if (!user) return res.status(401).json({ error: 'سجّل دخولك أولاً' })
  // while testing (sandbox), only the owner's account can use it: a test approval moves no real money
  if (teamOnly() && !(await isTeam(user))) return res.status(403).json({ error: 'التقسيط مع تمارا غير متاح الحين' })
  const { orderId, city } = req.body || {}
  // Tamara needs an address; services are delivered online, so the city is the customer's if given, else the store's
  const town = String(city || '').replace(/[<>]/g, '').trim().slice(0, 60) || 'الرس'
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (!order || order.user_id !== user.id) return res.status(404).json({ error: 'الطلب غير موجود' })
  if (order.status !== 'pending') return res.status(409).json({ error: 'هذا الطلب مدفوع مسبقاً' })
  if (!(Number(order.total) > 0)) return res.status(400).json({ error: 'مبلغ الطلب غير صالح' })
  // the owner's rules from the store designer (min, max, coupons, excluded categories) — the same check as the pages
  const { data: set } = await admin.from('site_settings').select('data').eq('id', 'main').maybeSingle()
  const rules = tamaraRules(set?.data?.payments?.tamara)
  const ids = [...new Set((order.items || []).map((it) => it.productId).filter(Boolean))]
  const { data: prods } = ids.length ? await admin.from('products').select('id, category_id').in('id', ids) : { data: [] }
  const why = tamaraBlock(rules, { total: Number(order.total), coupon: order.coupon, categories: (prods || []).map((p) => p.category_id) })
  if (why) return res.status(400).json({ error: `التقسيط مع تمارا: ${tamaraBlockText(why, rules)}` })

  const phone = '966' + String(order.customer?.phone || '').replace(/\D/g, '').replace(/^(966|0)/, '')
  if (!/^9665\d{8}$/.test(phone)) return res.status(400).json({ error: 'رقم الجوال في الطلب غير صحيح' })
  const [first, ...rest] = String(order.customer?.name || '').trim().split(/\s+/)
  const firstName = first || 'عميل', lastName = rest.join(' ') || firstName
  const email = order.customer?.email || user.email
  const base = siteUrl()
  const back = (s) => `${base}/order/${order.id}?tamara=${s}`

  // a little honest history helps Tamara's decision (all from our own records)
  const { data: past } = await admin.from('orders').select('status, total, created_at').eq('user_id', user.id).neq('id', order.id)
  const paidPast = (past || []).filter((o) => !['pending', 'cancelled'].includes(o.status))
  const ddmmyyyy = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, '0')}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${x.getUTCFullYear()}` }

  const items = (order.items || []).map((it, i) => ({
    reference_id: `${order.number}-${i + 1}`, type: it.digital ? 'Digital' : 'Service', name: String(it.name || 'خدمة').slice(0, 255),
    sku: String(it.productId || `custom-${i + 1}`).slice(0, 128), quantity: Number(it.qty) || 1,
    unit_price: sar(it.price), discount_amount: sar(0), tax_amount: sar(0), total_amount: sar(Number(it.price) * (Number(it.qty) || 1)),
    ...(it.productId && { item_url: `${base}/${it.productId}` }),
  }))
  const r = await tamara('/checkout', 'POST', {
    order_reference_id: order.id,
    order_number: String(order.number),
    total_amount: sar(order.total),
    shipping_amount: sar(0),
    tax_amount: sar(0),
    ...(Number(order.discount) > 0 && { discount: { name: order.coupon || 'خصم', amount: sar(order.discount) } }),
    description: `طلب منصة رائد #${order.number}`.slice(0, 256),
    country_code: 'SA',
    payment_type: 'PAY_BY_INSTALMENTS',
    locale: 'ar_SA',
    platform: 'rraed.com',
    is_mobile: /Mobi|iPhone|Android/i.test(req.headers['user-agent'] || ''),
    items,
    consumer: { first_name: firstName, last_name: lastName, phone_number: phone, email },
    shipping_address: { first_name: firstName, last_name: lastName, line1: `خدمة إلكترونية، ${town}`, city: town, country_code: 'SA', phone_number: phone },
    billing_address: { first_name: firstName, last_name: lastName, line1: `خدمة إلكترونية، ${town}`, city: town, country_code: 'SA', phone_number: phone },
    merchant_url: { success: back('success'), failure: back('failure'), cancel: back('cancel'), notification: `${base}/api/tamara?op=notify` },
    risk_assessment: {
      account_creation_date: ddmmyyyy(user.created_at || order.created_at),
      platform_account_creation_date: ddmmyyyy(user.created_at || order.created_at),
      is_existing_customer: paidPast.length > 0,
      is_guest_user: false,
      total_order_count: paidPast.length,
      has_delivered_order: (past || []).some((o) => o.status === 'completed'),
      is_email_verified: true,
    },
  })
  if (!r.ok || !r.data?.checkout_url) {
    console.error('tamara checkout failed', order.id, r.status, JSON.stringify(r.data).slice(0, 800))
    const code = tamaraError(r.data)
    const msg = /limit|amount|total/i.test(code) ? 'مبلغ الطلب خارج حدود التقسيط في تمارا، جرّب الدفع بالبطاقة'
      : /phone/i.test(code) ? 'تمارا ما قبلت رقم الجوال، تأكد منه'
        : 'تعذّر فتح تمارا الحين، جرّب بعد شوي أو ادفع بالبطاقة'
    // while testing, the owner sees Tamara's own reason to fix it fast
    const detail = teamOnly() ? (process.env.TAMARA_SANDBOX ? ' [sandbox]' : ' [live]') + ` (${r.status}: ${JSON.stringify(r.data).slice(0, 300)})` : ''
    return res.status(502).json({ error: msg + detail, code: String(code).slice(0, 80) })
  }
  return res.status(200).json({ url: r.data.checkout_url })
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  const op = String(req.query?.op || '')
  if (op === 'config') {
    const sandbox = !!process.env.TAMARA_SANDBOX
    const on = enabled() && (!teamOnly() || (await isTeam(await userFromRequest(req))))
    return res.status(200).json({ enabled: on, publicKey: on ? process.env.TAMARA_PUBLIC_KEY || '' : '', sandbox, plans: on ? await plans() : [] })
  }
  if (!enabled()) return res.status(503).json({ error: 'التقسيط مع تمارا غير متاح الحين' })

  if (op === 'start' && req.method === 'POST') return start(req, res)

  if (op === 'notify' && req.method === 'POST') {
    const token = String(req.query?.tamaraToken || '') || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!validToken(token)) return res.status(401).json({ ok: false })
    const ev = req.body || {}
    const type = String(ev.event_type || ev.order_status || '').toLowerCase()
    if (/approved|authorised/.test(type) && ev.order_id) await confirm(ev.order_id)
    return res.status(200).json({ ok: true })
  }

  if (op === 'verify' && req.method === 'GET') {
    const orderId = String(req.query.order || '')
    const out = await confirm(String(req.query.tamara || ''), browserOf(req))
    // answer only about the order the visitor is looking at
    if (out.orderId && orderId && out.orderId !== orderId) return res.status(200).json({ ok: false })
    return res.status(200).json({ ok: !!out.ok })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
