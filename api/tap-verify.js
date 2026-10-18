// Tap, both ways back (one function: the plan allows 12):
//   GET  ?order=<id>&tap_id=<charge id>  — the customer's browser after Tap's payment page
//   POST { id }                          — Tap's server notification (/api/tap-webhook is rewritten here)
// Either way we re-fetch the charge from Tap before trusting it, so a forged call can't mark anything paid.
import { confirmCharge } from './_shared.js'
import { browserOf } from './_snap.js'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const id = String(req.body?.id || '')
    if (/^chg_[\w]+$/.test(id)) await confirmCharge(id)
    return res.status(200).json({ received: true })
  }
  const tapId = String(req.query.tap_id || '')
  const orderId = String(req.query.order || '')
  if (!/^chg_[\w]+$/.test(tapId)) return res.status(400).json({ ok: false })
  const out = await confirmCharge(tapId, browserOf(req)) // the customer's own browser: Snap can match it
  // answer only about the order the visitor is looking at
  if (out.orderId && orderId && out.orderId !== orderId) return res.status(200).json({ ok: false })
  return res.status(200).json({ ok: !!out.ok, status: out.status })
}
