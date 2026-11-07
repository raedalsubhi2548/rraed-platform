// IndexNow: tells Bing (and Yandex, Seznam…) the moment a page changes, instead of waiting for the next crawl.
// ChatGPT search leans on Bing's index, so prices and services there stay current.
// Run by .github/workflows/indexnow.yml after every production deploy and once a day (dashboard saves rebuild the
// site through a deploy hook). Reads the live https://rraed.com/indexnow.json written by scripts/prerender.mjs,
// compares it with the list from the previous run (kept by the workflow's cache) and sends only the pages that
// changed, appeared or disappeared. The key file public/<KEY>.txt proves the site is ours.
//   node scripts/indexnow.mjs <previous.json>      (the file is read if present, then replaced with the live list)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const KEY = '385593a193493bbf259eb5798d85af41'
const SITE = 'https://rraed.com'
const prevFile = process.argv[2] || '.indexnow-last.json'

const live = await (async () => {
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(`${SITE}/indexnow.json?t=${Date.now()}`, { cache: 'no-store' })
      if (r.ok) return await r.json()
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 15000))
  }
  throw new Error('indexnow.json not reachable on the live site')
})()

const prev = existsSync(prevFile) ? JSON.parse(readFileSync(prevFile, 'utf8')).pages || {} : null
const pages = live.pages || {}
const changed = prev
  ? [...new Set([...Object.keys(pages), ...Object.keys(prev)])].filter((p) => pages[p] !== prev[p])
  : Object.keys(pages) // first run: everything
const urls = changed.map((p) => SITE + (p === '/' ? '/' : p))
console.log(prev ? `${urls.length} changed page(s)` : `first run: ${urls.length} page(s)`)
urls.forEach((u) => console.log('  ' + u))

if (urls.length) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: live.host || new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
  })
  console.log(`IndexNow answered ${r.status}`)
  // 200 = received, 202 = received, key check pending; anything else: keep the old list so the next run retries
  if (r.status !== 200 && r.status !== 202) { console.log(await r.text().catch(() => '')); process.exit(1) }
}
writeFileSync(prevFile, JSON.stringify(live))
