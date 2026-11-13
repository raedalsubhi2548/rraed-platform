// Google Analytics 4 (G-CX5HXTP046). Loaded from a file, not an inline <script>, so the strict CSP stays on.
// Page views are sent on every route change (the store is a single-page app); admin pages are left out.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isDemo, api } from './api.js'

export const GA_ID = 'G-CX5HXTP046'
const on = typeof window !== 'undefined' && location.hostname === 'rraed.com'
const PAY_RETURN = typeof document !== 'undefined' && /(^|\.)(tap\.company|gotapnow\.com|tamara\.co|tabby\.(ai|sa)|moyasar\.com)$/.test((() => { try { return new URL(document.referrer).hostname } catch { return '' } })())

// The review link (/review/<order>?t=…) carries a private key: whoever has it can review that order. It is moved out of
// the address bar before GA, Google Ads, Snap or TikTok read the page address (security audit, 13 Nov 2026), and Review.jsx
// reads it back with reviewToken(). Runs at load (link from the email) and again from Review.jsx (link inside the site).
const REVIEW_T = 'raed:review-t:'
let reviewT = null
export function hideReviewToken() {
  if (typeof window === 'undefined') return
  const m = location.pathname.match(/^\/review\/([^/?#]+)/)
  if (!m) return
  const u = new URL(location.href)
  const t = u.searchParams.get('t')
  if (!t) return
  reviewT = { id: m[1], t }
  try { sessionStorage.setItem(REVIEW_T + m[1], t) } catch { /* kept in memory for this page */ }
  u.searchParams.delete('t')
  history.replaceState(history.state, '', u.pathname + u.search + u.hash)
}
export const reviewToken = (id) => {
  if (reviewT?.id === id) return reviewT.t
  try { return sessionStorage.getItem(REVIEW_T + id) || '' } catch { return '' }
}
hideReviewToken()
const noToken = (search) => { const q = new URLSearchParams(search); q.delete('t'); const s = q.toString(); return s ? '?' + s : '' }

if (on) {
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
  window.gtag('js', new Date())
  // coming back from a payment page (Tap, Tamara, Tabby, Moyasar) is the same visit, not a new source: without this,
  // GA credited paid orders to sa1.payments.tap.company instead of where the customer really came from (ChatGPT, ads…)
  window.gtag('config', GA_ID, { send_page_view: false, ...(PAY_RETURN && { ignore_referrer: 'true' }) })
  // gtag.js (~180 KB) waits until the page has shown and the browser is idle, so it never competes with the page's
  // own images; calls made before then wait in dataLayer and are sent once it loads, so no visit or event is lost
  const load = () => document.head.appendChild(Object.assign(document.createElement('script'), { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` }))
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 1500))
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

export const track = (name, params = {}) => { if (on) window.gtag('event', name, params) }

// ---- Google Ads conversions (account 853-507-2266) -----------------------------------------------------------------
// Same gtag.js as GA (one script, two destinations). Two conversion actions made in Google Ads on 7 Nov 2026:
// a purchase (value = order total) and a tap on any WhatsApp link (counted once per visit by Google Ads itself).
export const ADS_ID = 'AW-18561774390'
const ADS_PURCHASE = ADS_ID + '/jQ5ZCL-Z87MdELbm-JJF'
const ADS_WHATSAPP = ADS_ID + '/aMcaCLqa87MdELbm-JJF'
const adsOn = on && !location.pathname.startsWith('/admin')
if (adsOn) {
  window.gtag('config', ADS_ID, PAY_RETURN ? { ignore_referrer: 'true' } : {})
  // every wa.me / api.whatsapp.com link on the store, wherever it sits (header, service pages, footer, floating button)
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="wa.me/"], a[href*="api.whatsapp.com/"]')
    if (a && !location.pathname.startsWith('/admin')) window.gtag('event', 'conversion', { send_to: ADS_WHATSAPP, value: 1.0, currency: 'SAR' })
  }, true)
}

// ---- Snap Pixel (affec170-…) --------------------------------------------------------------------------------------
// Same rule as GA: a file loaded from sc-static.net (allowed in vercel.json's CSP), only on the real store, never on admin.
// Purchases are also sent server side (api/_snap.js, Conversions API) with the same id, so Snap counts each order once.
export const SNAP_PIXEL = 'affec170-fb55-4e08-a99f-405236853160'
const snapOn = on && !location.pathname.startsWith('/admin')
if (snapOn) {
  const q = (window.snaptr = function snaptr() { q.handleRequest ? q.handleRequest.apply(q, arguments) : q.queue.push(arguments) }) // eslint-disable-line prefer-rest-params
  q.queue = []
  document.head.appendChild(Object.assign(document.createElement('script'), { async: true, src: 'https://sc-static.net/scevent.min.js' }))
  window.snaptr('init', SNAP_PIXEL, {})
}
export const snap = (name, params = {}) => { if (snapOn) window.snaptr('track', name, params) }

// ---- TikTok Pixel (13 Nov 2026) ----------------------------------------------------------------------------------
// TikTok's own snippet, written as a file so the strict CSP stays on (analytics.tiktok.com is allowed in vercel.json).
// Only on the real store, never on admin. No identify(): no email or phone is sent, only the page and the event.
export const TIKTOK_PIXEL = 'DBRLJDRC77U32OQMOSI0'
const ttOn = on && !location.pathname.startsWith('/admin')
if (ttOn) {
  window.TiktokAnalyticsObject = 'ttq'
  const ttq = (window.ttq = window.ttq || [])
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']
  ttq.setAndDefer = (t, e) => { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } // eslint-disable-line prefer-rest-params
  ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m))
  ttq.instance = (t) => { const e = ttq._i[t] || []; ttq.methods.forEach((m) => ttq.setAndDefer(e, m)); return e }
  ttq.load = (id, opts) => {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = src
    ttq._t = ttq._t || {}; ttq._t[id] = +new Date()
    ttq._o = ttq._o || {}; ttq._o[id] = opts || {}
    document.head.appendChild(Object.assign(document.createElement('script'), { async: true, src: `${src}?sdkid=${id}&lib=ttq` }))
  }
  ttq.load(TIKTOK_PIXEL)
}
const ttPage = () => { if (ttOn) window.ttq.page() }
const tiktok = (name, params = {}, opts) => { if (ttOn) window.ttq.track(name, params, opts) }
const ttItem = (id, name, price, qty = 1) => ({ content_id: String(id), content_type: 'product', content_name: name, price: Number(price) || 0, quantity: qty })

// ---- Our own visitor count (لوحة التحكم ← التقارير) --------------------------------------------------------------
// Sent to /api/hit on the store's own domain, so ad blockers and missing cookie consent don't hide visitors.
// The owner's own visits are left out: «عرض المتجر» in the dashboard opens the store with ?notrack=1, which marks that browser.
const mine = typeof window !== 'undefined' && (location.hostname === 'rraed.com' || location.hostname === 'www.rraed.com')
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { return null } }
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)))
if (typeof window !== 'undefined') {
  const q = new URLSearchParams(location.search).get('notrack')
  if (q === '1') ls('raed:notrack', '1'); else if (q === '0') ls('raed:notrack', null)
  if (q) { const u = new URL(location.href); u.searchParams.delete('notrack'); history.replaceState(history.state, '', u.pathname + u.search + u.hash) }
}
const counting = () => typeof window !== 'undefined' && (mine || isDemo) && !/^admin\./.test(location.hostname) && ls('raed:notrack') !== '1' && (isDemo || !navigator.webdriver)
function ids() {
  let vid = ls('raed:vid')
  if (!vid) { vid = uid(); ls('raed:vid', vid) }
  // a visit (session) ends after 30 minutes with nothing happening
  let sid = null
  try { const x = JSON.parse(sessionStorage.getItem('raed:sid') || 'null'); if (x && Date.now() - x.at < 30 * 60e3) sid = x.id } catch { /* new one */ }
  sid ||= uid()
  try { sessionStorage.setItem('raed:sid', JSON.stringify({ id: sid, at: Date.now() })) } catch { /* ignore */ }
  return { vid, sid }
}
function send(body) {
  if (isDemo) { api.recordVisit?.({ ...body, at: new Date().toISOString(), ua: navigator.userAgent }).catch(() => {}); return }
  const data = JSON.stringify(body)
  if (!(navigator.sendBeacon && navigator.sendBeacon('/api/hit', new Blob([data], { type: 'application/json' }))))
    fetch('/api/hit', { method: 'POST', body: data, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
}
const utm = (() => { try { const p = new URLSearchParams(location.search); return { u: p.get('utm_source') || '', c: p.get('utm_campaign') || '' } } catch { return { u: '', c: '' } } })()
let current = null // the page on screen: its id and how long it has been visible
const shown = () => (current ? current.ms + (document.visibilityState === 'visible' && current.since ? Date.now() - current.since : 0) : 0)
function leave() {
  if (!current) return
  send({ t: 'leave', id: current.id, ...ids(), d: Math.round(shown() / 1000) })
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!current) return
    if (document.visibilityState === 'hidden') { current.ms = shown(); current.since = 0; leave() } else current.since = Date.now()
  })
}
let firstRef = typeof document !== 'undefined' && !PAY_RETURN ? document.referrer : '' // a payment page is not where a visitor came from
export function hit(kind, path) {
  if (!counting()) return
  const id = uid()
  if (kind === 'view') {
    leave()
    current = { id, ms: 0, since: Date.now() }
  }
  send({ t: kind, id, ...ids(), p: path || location.pathname, r: firstRef, u: utm.u, c: utm.c })
  firstRef = '' // only the landing page carries where the visitor came from
}

const item = (l) => ({ item_id: l.productId || l.product?.id, item_name: l.name || l.product?.name, price: Number(l.unit ?? l.price) || 0, quantity: l.qty || 1 })
export const trackAddToCart = (p, qty, unit) => {
  hit('cart')
  track('add_to_cart', { currency: 'SAR', value: unit * qty, items: [{ item_id: p.id, item_name: p.name, price: unit, quantity: qty }] })
  snap('ADD_CART', { item_ids: [p.id], item_category: p.categoryId, price: unit * qty, currency: 'SAR', number_items: qty })
  tiktok('AddToCart', { contents: [ttItem(p.id, p.name, unit, qty)], value: unit * qty, currency: 'SAR' })
}
export const trackBeginCheckout = (lines, value) => {
  hit('checkout')
  track('begin_checkout', { currency: 'SAR', value, items: lines.map(item) })
  snap('START_CHECKOUT', { item_ids: lines.map((l) => l.productId || l.product?.id), price: value, currency: 'SAR', number_items: lines.reduce((n, l) => n + (l.qty || 1), 0) })
  tiktok('InitiateCheckout', { contents: lines.map((l) => ttItem(l.productId || l.product?.id, l.name || l.product?.name, l.unit ?? l.price, l.qty || 1)), value, currency: 'SAR' })
}
export const trackViewProduct = (p, price) => {
  snap('VIEW_CONTENT', { item_ids: [p.id], item_category: p.categoryId, price, currency: 'SAR' })
  tiktok('ViewContent', { contents: [ttItem(p.id, p.name, price)], value: Number(price) || 0, currency: 'SAR' })
}
export const trackPurchase = (order) => {
  // once per order, even if the return page is reloaded
  const k = 'raed:ga-purchase:' + order.id
  try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1') } catch { /* ignore */ }
  track('purchase', { transaction_id: String(order.number), currency: 'SAR', value: Number(order.total) || 0, items: (order.items || []).map(item) })
  if (adsOn) window.gtag('event', 'conversion', { send_to: ADS_PURCHASE, value: Number(order.total) || 0, currency: 'SAR', transaction_id: String(order.number) })
  // client_dedup_id = the order id, the same event_id the server sends to the Conversions API
  snap('PURCHASE', { transaction_id: String(order.number), client_dedup_id: String(order.id), price: Number(order.total) || 0, currency: 'SAR', item_ids: (order.items || []).map((l) => l.productId), number_items: (order.items || []).reduce((n, l) => n + (l.qty || 1), 0) })
  tiktok('Purchase', { contents: (order.items || []).map((l) => ttItem(l.productId, l.name, l.unit ?? l.price, l.qty || 1)), value: Number(order.total) || 0, currency: 'SAR' }, { event_id: String(order.id) })
}

/** Sends a page_view for each page the visitor opens. */
export function usePageViews() {
  const loc = useLocation()
  useEffect(() => { if (!loc.pathname.startsWith('/admin')) hit('view', loc.pathname) }, [loc.pathname])
  useEffect(() => {
    if (!on || loc.pathname.startsWith('/admin')) return
    // let the page set its <title> first
    // never the review key (?t=), even if it is still in the router's address
    const t = setTimeout(() => { const s = noToken(loc.search); track('page_view', { page_location: location.origin + loc.pathname + s + location.hash, page_path: loc.pathname + s, page_title: document.title }); snap('PAGE_VIEW'); ttPage() }, 50)
    return () => clearTimeout(t)
  }, [loc.pathname, loc.search])
}
