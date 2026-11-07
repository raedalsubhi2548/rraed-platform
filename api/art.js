// GET /api/art?f=<file on the old Salla CDN>
// The old product images show the real artwork on a laptop screen over a green background.
// This returns just that artwork (what was on the screen), as a square image, no laptop, no green.
// Cached at the edge for a year, so each image is processed once.
import sharp from 'sharp'

const CDN = 'https://cdn.salla.sa/zvxNvp/'
const SIZE = 600

const hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, c = mx - mn
  if (!c) return [0, 0, l]
  const h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4
  return [(h * 60 + 360) % 360, c / (1 - Math.abs(2 * l - 1) || 1), l]
}

// background = the green field, its darker shadow, the faint "W" pattern and the cream waves
const isBg = (r, g, b) => {
  const [h, s, l] = hsl(r, g, b)
  if (h >= 85 && h <= 215 && s > 0.1) return true
  if (l < 0.2 && g > r + 6 && g >= b) return true
  if (h >= 20 && h < 85 && s > 0.12 && l > 0.7) return true
  return false
}

const MAX_BYTES = 8e6
export default async function handler(req, res) {
  // only the known parameters, so random query strings can't bypass the edge cache and burn compute
  if (Object.keys(req.query).some((k) => !['f', 'id', 'v', 'w', 'o'].includes(k))) return res.status(400).end('bad query')
  // o=jpg: the same picture as a JPEG, for link previews (WhatsApp and others don't all show WebP)
  if (req.query.o !== undefined && req.query.o !== 'jpg') return res.status(400).end('bad format')
  if (req.query.v !== undefined && req.query.v !== '6') return res.status(400).end('bad version')
  if (req.query.id !== undefined && !/^[\w-]{1,80}$/.test(String(req.query.id))) return res.status(400).end('bad id')
  const w = req.query.w === undefined ? SIZE : Number(req.query.w)
  if (![300, SIZE].includes(w)) return res.status(400).end('bad width')
  const f = String(req.query.f || '')
  if (!/^[\w.-]{1,120}\.(jpe?g|png|webp)$/i.test(f) || f.includes('..')) return res.status(400).end('bad file')
  try {
    const r = await fetch(CDN + f, { signal: AbortSignal.timeout(8000), redirect: 'error' })
    if (!r.ok) return res.status(404).end('not found')
    if (Number(r.headers.get('content-length') || 0) > MAX_BYTES) return res.status(413).end('too large')
    const raw = Buffer.from(await r.arrayBuffer())
    if (raw.length > MAX_BYTES) return res.status(413).end('too large')
    // cap the working size so a huge image can't exhaust memory
    const src = await sharp(raw, { limitInputPixels: 2.5e7 }).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    return await render(src, res, w, req.query.o === 'jpg')
  } catch {
    return res.status(422).end('could not process')
  }
}

async function render(src, res, w = SIZE, jpg = false) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info

  // flood-fill the green background in from the edges to find the laptop's box
  const bg = new Uint8Array(W * H)
  const stack = []
  const seed = (x, y) => { const k = y * W + x; if (!bg[k]) { const i = k * C; if (isBg(data[i], data[i + 1], data[i + 2])) { bg[k] = 1; stack.push(k) } } }
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1) }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y) }
  while (stack.length) {
    const k = stack.pop(), x = k % W, y = (k - x) / W
    if (x > 0) seed(x - 1, y); if (x < W - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < H - 1) seed(x, y + 1)
  }
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (!bg[y * W + x]) {
    let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!bg[(y + dy) * W + x + dx]) n++
    if (n < 18) continue
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  if (x1 < 0) return res.status(422).end('no product found')

  // every mockup uses the same laptop, so the screen sits at a fixed place inside its box;
  // trim a hair more so no bezel shows
  const lw = x1 - x0, lh = y1 - y0
  const left = Math.round(x0 + lw * 0.115), right = Math.round(x0 + lw * 0.885)
  const top = Math.round(y0 + lh * 0.065), bottom = Math.round(y0 + lh * 0.795)
  const screen = sharp(src).extract({ left, top, width: right - left, height: bottom - top })

  // the artwork becomes a framed print resting on the store's own soft white-and-navy backdrop,
  // so every card reads as part of the same page
  const art = await screen.resize(492, 400, { fit: 'inside', kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }).png().toBuffer()
  const { width: aw, height: ah } = await sharp(art).metadata()
  const R = 16
  const rounded = await sharp(art)
    .composite([{ input: Buffer.from(`<svg width="${aw}" height="${ah}"><rect width="${aw}" height="${ah}" rx="${R}" fill="#fff"/></svg>`), blend: 'dest-in' }])
    .png().toBuffer()
  const ax = Math.round((SIZE - aw) / 2), ay = Math.round((SIZE - ah) / 2) - 14
  const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
<defs>
<linearGradient id="b" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient>
<radialGradient id="g" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#1b2b44" stop-opacity=".10"/><stop offset="1" stop-color="#1b2b44" stop-opacity="0"/></radialGradient>
<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
</defs>
<rect width="${SIZE}" height="${SIZE}" fill="url(#b)"/>
<rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
<path d="M-20 ${SIZE - 70} Q ${SIZE * 0.35} ${SIZE - 130} ${SIZE * 0.62} ${SIZE - 78} T ${SIZE + 20} ${SIZE - 96}" fill="none" stroke="#1b2b44" stroke-opacity=".10" stroke-width="2"/>
<rect x="${ax + 18}" y="${ay + 30}" width="${aw - 36}" height="${ah - 10}" rx="${R}" fill="#1b2b44" fill-opacity=".38" filter="url(#s)"/>
<rect x="${ax - 6}" y="${ay - 6}" width="${aw + 12}" height="${ah + 12}" rx="${R + 5}" fill="#ffffff"/>
<rect x="${ax - 6.5}" y="${ay - 6.5}" width="${aw + 13}" height="${ah + 13}" rx="${R + 5.5}" fill="none" stroke="#1b2b44" stroke-opacity=".08"/>
</svg>`
  const out = await sharp(Buffer.from(backdrop))
    .composite([{ input: rounded, left: ax, top: ay }])
    .png().toBuffer()
  const out2 = jpg
    ? await sharp(out).resize(w, w).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
    : await sharp(out).resize(w, w).webp({ quality: w < SIZE ? 82 : 88 }).toBuffer()

  res.setHeader('Content-Type', jpg ? 'image/jpeg' : 'image/webp')
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
  res.end(out2)
}
