// GET ?order=<id>&tap_id=<charge id>  — called when Tap redirects the customer back.
import { confirmCharge } from './_shared.js'
import { browserOf } from './_snap.js'

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ ok: false })
  const tapId = String(req.query.tap_id || '')
  const orderId = String(req.query.order || '')
  if (!/^chg_\w{6,80}$/.test(tapId) || !/^[0-9a-f-]{36}$/i.test(orderId)) return res.status(400).json({ ok: false })
  const out = await confirmCharge(tapId, browserOf(req)) // the customer's own browser: Snap can match it
  // answer only about the order the visitor is looking at
  if (out.orderId !== orderId) return res.status(200).json({ ok: false })
  return res.status(200).json({ ok: !!out.ok, status: out.status })
}
