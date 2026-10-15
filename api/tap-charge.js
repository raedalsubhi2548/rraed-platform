// POST { orderId }  →  { url }  — creates a Tap hosted-payment charge for the signed-in customer's order.
import { admin, TAP, tapHeaders, siteUrl, userFromRequest } from './_shared.js'
import { snapPurchase, browserOf } from './_snap.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.TAP_SECRET_KEY) return res.status(503).json({ error: 'بوابة الدفع غير متاحة الحين، حاول بعد شوي أو تواصل معنا.' })
  const user = await userFromRequest(req)
  if (!user) return res.status(401).json({ error: 'سجّل دخولك أولاً' })

  const { orderId } = req.body || {}
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
  if (!order || order.user_id !== user.id) return res.status(404).json({ error: 'الطلب غير موجود' })
  if (order.status !== 'pending') return res.status(409).json({ error: 'هذا الطلب مدفوع مسبقاً' })
  // fully covered by a coupon (the total is computed in the database by place_order): nothing to charge, the order is paid
  if (Number(order.total) === 0 && Number(order.subtotal) > 0 && order.coupon) {
    const { data: updated } = await admin.from('orders').update({
      status: 'paid', payment_ref: 'coupon:' + order.coupon,
      history: [...(order.history || []), { status: 'paid', at: new Date().toISOString(), note: `مدفوع بالكامل بكوبون ${order.coupon}` }],
    }).eq('id', order.id).eq('status', 'pending').select('*')
    if (updated?.[0]) {
      const { sendOrderEmail } = await import('./_mail.js')
      await sendOrderEmail(updated[0], 'paid').catch(() => {})
      await snapPurchase(updated[0], browserOf(req))
    }
    return res.status(200).json({ free: true })
  }
  if (!(Number(order.total) > 0)) return res.status(400).json({ error: 'مبلغ الطلب غير صالح' })

  // a retry (second tab, back button) reuses the open charge instead of creating a second one for the same order
  if (order.payment_ref) {
    const prev = await fetch(`${TAP}/charges/${encodeURIComponent(order.payment_ref)}`, { headers: tapHeaders() }).then((x) => (x.ok ? x.json() : null)).catch(() => null)
    if (prev?.status === 'CAPTURED') return res.status(409).json({ error: 'هذا الطلب مدفوع مسبقاً' })
    if (prev?.status === 'INITIATED' && prev.transaction?.url) return res.status(200).json({ url: prev.transaction.url })
  }

  const phone = String(order.customer?.phone || '').replace(/\D/g, '').replace(/^(966|0)/, '')
  const [first, ...rest] = String(order.customer?.name || 'عميل').split(' ')
  const base = siteUrl()
  const r = await fetch(`${TAP}/charges`, {
    method: 'POST',
    headers: tapHeaders(),
    body: JSON.stringify({
      amount: Number(order.total),
      currency: 'SAR',
      customer_initiated: true,
      threeDSecure: true,
      description: `طلب منصة رائد #${order.number}`,
      metadata: { order_id: order.id },
      reference: { order: String(order.number) },
      receipt: { email: true, sms: false },
      customer: { first_name: first, last_name: rest.join(' ') || '-', email: order.customer?.email, phone: { country_code: '966', number: phone } },
      source: { id: 'src_all' },
      post: { url: `${base}/api/tap-webhook` },
      redirect: { url: `${base}/order/${order.id}` },
    }),
  })
  const charge = await r.json()
  if (!r.ok || !charge.transaction?.url) return res.status(502).json({ error: charge.errors?.[0]?.description || 'تعذّر إنشاء عملية الدفع' })
  await admin.from('orders').update({ payment_ref: charge.id }).eq('id', order.id)
  return res.status(200).json({ url: charge.transaction.url })
}
