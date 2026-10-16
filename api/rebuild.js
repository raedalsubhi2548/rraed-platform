// POST (owner, or staff with products / categories / design) → rebuilds the site through the Vercel deploy hook, so the pre-rendered pages, link previews and
// search engines pick up a new design from the store designer. The hook URL is a secret: VERCEL_DEPLOY_HOOK.
import { adminFromRequest } from './_shared.js'

let last = 0

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  if (!(await adminFromRequest(req, ['products', 'categories', 'design']))) return res.status(403).json({ ok: false })
  const hook = process.env.VERCEL_DEPLOY_HOOK
  if (!hook || !/^https:\/\/api\.vercel\.com\//.test(hook)) return res.status(200).json({ ok: false, reason: 'no-hook' })
  // several quick publishes need one rebuild, not five
  if (Date.now() - last < 60_000) return res.status(200).json({ ok: true, queued: true })
  last = Date.now()
  const r = await fetch(hook, { method: 'POST' }).catch(() => null)
  return res.status(200).json({ ok: !!r?.ok })
}
