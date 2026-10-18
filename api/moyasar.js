// Moyasar (مُيسّر), the payment form inside our own order page.
//   GET                          → { enabled, publishableKey, mode } for the signed-in visitor
//   POST { orderId, paymentId }  → checks the payment with Moyasar and marks the order paid
// Keys live in Vercel: MOYASAR_SECRET_KEY (server only) and MOYASAR_PUBLISHABLE_KEY (public by design).
// With test keys (sk_test_…) everything is limited to the owner's own orders: a test payment costs nothing,
// so it must never settle a customer's order, and it is kept out of Snap's purchase data.
import { admin, userFromRequest } from './_shared.js'

const SK = (process.env.MOYASAR_SECRET_KEY || '').trim()
const PK = (process.env.MOYASAR_PUBLISHABLE_KEY || '').trim()
const MODE = /^sk_live_/.test(SK) && /^pk_live_/.test(PK) ? 'live' : /^sk_test_/.test(SK) && /^pk_test_/.test(PK) ? 'test' : ''
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isOwner = async (user) => {
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'admin'
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  const user = await userFromRequest(req)
  if (!user) return res.status(401).json({ error: 'سجّل دخولك أولاً' })
  const owner = MODE === 'test' ? await isOwner(user) : false

  if (req.method === 'GET') {
    const enabled = MODE === 'live' || (MODE === 'test' && owner)
    return res.status(200).json(enabled ? { enabled, publishableKey: PK, mode: MODE } : { enabled: false })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!MODE) return res.status(503).json({ error: 'بوابة الدفع غير متاحة الحين' })

  const { orderId, paymentId } = req.body || {}
  if (!UUID.test(String(paymentId || '')) || !UUID.test(String(orderId || ''))) return res.status(400).json({ ok: false })
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
  if (!order || order.user_id !== user.id) return res.status(404).json({ ok: false, error: 'الطلب غير موجود' })
  if (MODE === 'test' && !owner) return res.status(403).json({ ok: false, error: 'الدفع التجريبي للمالك فقط' })

  // never trust the browser: ask Moyasar for the payment itself
  const r = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, { headers: { authorization: 'Basic ' + Buffer.from(SK + ':').toString('base64') } })
  if (!r.ok) return res.status(502).json({ ok: false, error: 'تعذّر التأكد من عملية الدفع' })
  const p = await r.json()
  if (p.metadata?.order_id !== order.id) return res.status(400).json({ ok: false, error: 'عملية الدفع لا تخص هذا الطلب' })
  const amountOk = p.currency === 'SAR' && Number(p.amount) === Math.round(Number(order.total) * 100)

  if (p.status !== 'paid') {
    // started but not finished yet (3-D Secure): remember it so the order can be checked later
    if (p.status === 'initiated' && !order.payment_ref && order.status === 'pending') await admin.from('orders').update({ payment_ref: 'moyasar:' + p.id }).eq('id', order.id).eq('status', 'pending')
    return res.status(200).json({ ok: false, status: p.status, message: p.source?.message || '' })
  }
  if (!amountOk) {
    console.error('moyasar amount mismatch', order.id, p.id, p.amount, p.currency)
    return res.status(400).json({ ok: false, error: 'مبلغ الدفع لا يطابق الطلب' })
  }
  if (order.status !== 'pending') return res.status(200).json({ ok: true, test: MODE === 'test' })

  const test = MODE === 'test'
  const { data: updated } = await admin.from('orders').update({
    status: 'paid', payment_ref: 'moyasar:' + p.id,
    history: [...(order.history || []), { status: 'paid', at: new Date().toISOString(), note: test ? 'دفعة تجريبية عبر مُيسّر (وضع الاختبار)' : 'تم الدفع عبر مُيسّر' }],
  }).eq('id', order.id).eq('status', 'pending').select('*')
  // only the call that marked it paid sends the receipt (the return page and on_completed may both arrive)
  if (updated?.[0]) {
    const { sendOrderEmail } = await import('./_mail.js')
    await sendOrderEmail(updated[0], 'paid').catch(() => {})
    if (!test) { const { snapPurchase, browserOf } = await import('./_snap.js'); await snapPurchase(updated[0], browserOf(req)) }
  }
  return res.status(200).json({ ok: true, test })
}
