// Snap Conversions API: tells Snap about a paid order from the server, so purchases still count when the
// browser blocks the pixel. The pixel sends the same order id as client_dedup_id, so Snap counts each order once.
// The access token lives only in Vercel (SNAP_CAPI_TOKEN); without it nothing is sent.
import { createHash } from 'node:crypto'
import { siteUrl } from './_shared.js'

const PIXEL = 'affec170-fb55-4e08-a99f-405236853160'
const sha = (v) => createHash('sha256').update(v).digest('hex')
// Snap matches on normalised values: trimmed lowercase email, phone as digits with the country code
const email = (v) => (typeof v === 'string' && v.includes('@') ? sha(v.trim().toLowerCase()) : null)
const phone = (v) => {
  let d = String(v || '').replace(/\D/g, '')
  if (d.startsWith('05')) d = '966' + d.slice(1)
  else if (d.startsWith('5') && d.length === 9) d = '966' + d
  return d.length >= 9 ? sha(d) : null
}

/** order: the paid order row. ctx: the customer's browser request, when the call came from it (ip, user agent). */
export async function snapPurchase(order, ctx = {}) {
  const token = (process.env.SNAP_CAPI_TOKEN || '').trim()
  if (!token || !order) return
  const c = order.customer || {}
  const user_data = Object.fromEntries(Object.entries({
    em: email(c.email) && [email(c.email)],
    ph: phone(c.phone) && [phone(c.phone)],
    client_ip_address: ctx.ip,
    client_user_agent: ctx.ua,
  }).filter(([, v]) => v))
  const body = {
    data: [{
      event_name: 'PURCHASE',
      action_source: 'WEBSITE',
      event_source_url: `${siteUrl()}/order/${order.id}`,
      event_time: Math.floor(Date.now() / 1000),
      event_id: String(order.id),
      user_data,
      custom_data: {
        currency: 'SAR',
        value: Number(order.total) || 0,
        order_id: String(order.number),
        content_ids: (order.items || []).map((l) => String(l.productId)),
        num_items: (order.items || []).reduce((n, l) => n + (Number(l.qty) || 1), 0),
      },
    }],
  }
  try {
    const r = await fetch(`https://tr.snapchat.com/v3/${PIXEL}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) console.error('snap capi', r.status, (await r.text()).slice(0, 300))
  } catch (e) { console.error('snap capi', e?.message) }
}

/** The customer's address and browser from a Vercel request (first hop of x-forwarded-for). */
export const browserOf = (req) => ({
  ip: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined,
  ua: String(req.headers['user-agent'] || '').slice(0, 400) || undefined,
})
