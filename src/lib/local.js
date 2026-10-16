// Demo backend: everything lives in this browser's localStorage.
// Same interface as supa.js so the UI never knows which one is running.
import { seedCategories, seedProducts } from '../data/seed.js'

const K = (k) => `raed:${k}`
const SEED_VERSION = '2026-10-05'

function read(key, fallback) {
  try {
    const v = localStorage.getItem(K(key))
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function write(key, value) {
  try { localStorage.setItem(K(key), JSON.stringify(value)) } catch { /* storage full or blocked */ }
}

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('raed::' + text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// demo-only login, compiled out of the production bundle
export const DEMO_ADMIN = import.meta.env.DEV ? { email: 'admin@rraed.com', password: 'raed2026' } : null
export const DEMO_CODE = '000000' // demo mode sends no email: the sign-in code is always this one

async function ensureSeed() {
  if (read('seed') === SEED_VERSION) return
  const now = new Date().toISOString()
  write('categories', seedCategories)
  write('products', seedProducts.map((p) => ({ active: true, createdAt: now, ...p })))
  write('orders', read('orders', []))
  write('coupons', read('coupons', []))
  const users = read('users', [])
  if (DEMO_ADMIN && !users.some((u) => u.email === DEMO_ADMIN.email)) {
    users.push({
      id: 'u_admin', name: 'رائد', email: DEMO_ADMIN.email, phone: '', role: 'admin',
      pass: await hash(DEMO_ADMIN.password), createdAt: now,
    })
  }
  write('users', users)
  write('seed', SEED_VERSION)
}

const listeners = new Set()
const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt }
function emit() { const u = sessionUser(); listeners.forEach((fn) => fn(u)) }
function sessionUser() {
  const id = read('session')
  return publicUser(read('users', []).find((u) => u.id === id))
}
const uid = (p) => p + Math.random().toString(36).slice(2, 10)
function requireUser() { const u = sessionUser(); if (!u) throw new Error('سجّل دخولك أولاً'); return u }
function requireAdmin() { const u = requireUser(); if (u.role !== 'admin') throw new Error('هذه الصفحة للإدارة فقط'); return u }

export const local = {
  mode: 'demo',
  ready: ensureSeed(),

  // ---------- auth ----------
  async currentUser() { await this.ready; return sessionUser() },
  onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  async loginStart(email, password) {
    await this.ready
    const u = read('users', []).find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u || u.pass !== (await hash(password))) throw new Error('البريد أو كلمة المرور غير صحيحة')
    write('pending', u.id) // step 2 needs the code
  },
  async verifyLoginCode(email, code) {
    await this.ready
    const u = read('users', []).find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u || read('pending') !== u.id || code.trim() !== DEMO_CODE) throw new Error('الرمز غير صحيح أو انتهت صلاحيته')
    localStorage.removeItem(K('pending')); write('session', u.id); emit(); return publicUser(u)
  },
  async signUp({ name, email, phone, password }) {
    await this.ready
    const users = read('users', [])
    if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('هذا البريد مسجّل مسبقاً، سجّل دخولك بدلاً من ذلك')
    const u = { id: uid('u_'), name, email: email.trim(), phone, role: 'customer', pass: await hash(password), createdAt: new Date().toISOString() }
    users.push(u); write('users', users); write('session', u.id); emit(); return publicUser(u)
  },
  async signOut() { localStorage.removeItem(K('session')); emit() },
  async updateProfile(patch) {
    const me = requireUser()
    const users = read('users', []).map((u) => (u.id === me.id ? { ...u, name: patch.name ?? u.name, phone: patch.phone ?? u.phone } : u))
    write('users', users); emit(); return sessionUser()
  },

  // ---------- catalog ----------
  async getCategories() { await this.ready; return read('categories', []).sort((a, b) => a.sort - b.sort) },
  async getProducts({ includeHidden = false } = {}) {
    await this.ready
    return read('products', []).filter((p) => includeHidden || p.active)
  },
  async getProduct(id) { await this.ready; return read('products', []).find((p) => p.id === id) || null },
  async saveProduct(p) {
    requireAdmin()
    const list = read('products', [])
    const i = list.findIndex((x) => x.id === p.id)
    if (i >= 0) list[i] = { ...list[i], ...p }
    else list.push({ createdAt: new Date().toISOString(), active: true, ...p, id: p.id || uid('p_') })
    write('products', list); return p
  },
  async deleteProduct(id) { requireAdmin(); write('products', read('products', []).filter((p) => p.id !== id)) },
  async saveCategory(c) {
    requireAdmin()
    const list = read('categories', [])
    const i = list.findIndex((x) => x.id === c.id)
    if (i >= 0) list[i] = { ...list[i], ...c }; else list.push({ sort: list.length + 1, icon: 'spark', ...c, id: c.id || uid('c_') })
    write('categories', list)
  },
  async deleteCategory(id) {
    requireAdmin()
    if (read('products', []).some((p) => p.categoryId === id)) throw new Error('انقل منتجات هذا التصنيف أولاً ثم احذفه')
    write('categories', read('categories', []).filter((c) => c.id !== id))
  },
  async getSettings() { return read('settings', null) },
  async saveSettings(settings) { requireAdmin(); write('settings', settings) },
  async rebuildSite() { return { ok: false, reason: 'demo' } },
  async uploadImage(file) {
    return new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
    })
  },

  // ---------- orders ----------
  async createOrder(order) {
    await this.ready
    const me = sessionUser()
    const orders = read('orders', [])
    const now = new Date().toISOString()
    const o = {
      ...order, id: uid('o_'), number: 10000 + orders.length + 1, userId: me?.id || null,
      status: order.paymentMethod === 'card' ? 'paid' : 'pending', createdAt: now,
      history: order.paymentMethod === 'card'
        ? [{ status: 'pending', at: now }, { status: 'paid', at: now, note: 'دفع تجريبي في وضع العرض' }]
        : [{ status: 'pending', at: now, note: 'بانتظار التحويل البنكي' }],
    }
    orders.unshift(o); write('orders', orders); return o
  },
  async myOrders() { const me = requireUser(); return read('orders', []).filter((o) => o.userId === me.id) },
  async getOrder(id) {
    const me = requireUser()
    const o = read('orders', []).find((x) => x.id === id)
    if (!o || (o.userId !== me.id && me.role !== 'admin')) return null
    return o
  },
  // ---- reports (same shape as the admin_report function in supabase/reports.sql) ----
  async recordVisit(h) {
    const all = read('visits', [])
    if (h.t === 'leave') { const v = all.find((x) => x.id === h.id); if (v && h.d > (v.dur || 0)) { v.dur = h.d; write('visits', all) } return }
    const ua = h.ua || ''
    all.push({ id: h.id, at: h.at, kind: h.t, vid: h.vid, sid: h.sid, path: h.p, source: h.u || 'مباشر', campaign: h.c || null, country: 'SA', city: 'الرياض',
      device: /iPad|Tablet/i.test(ua) ? 'تابلت' : /Mobi|iPhone|Android/i.test(ua) ? 'جوال' : 'كمبيوتر', os: /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : 'Linux',
      browser: /Edg\//.test(ua) ? 'Edge' : /Firefox/.test(ua) ? 'Firefox' : /Chrome/.test(ua) ? 'Chrome' : 'Safari', dur: null })
    write('visits', all.slice(-5000))
  },
  async adminReport(from, to) {
    requireAdmin()
    const F = new Date(from).getTime(), T = new Date(to).getTime(), L = T - F
    const visits = read('visits', []), orders = read('orders', []), users = read('users', [])
    const inR = (t, a, b) => { const x = new Date(t).getTime(); return x >= a && x < b }
    const v = visits.filter((x) => inR(x.at, F, T)), pv = v.filter((x) => x.kind === 'view'), prv = visits.filter((x) => x.kind === 'view' && inR(x.at, F - L, F))
    const uniq = (a, k = 'vid') => new Set(a.map((x) => x[k])).size
    const sess = Object.values(pv.reduce((m, x) => { (m[x.sid] ||= { n: 0, d: 0, first: x }).n++; m[x.sid].d += x.dur || 0; if (x.at < m[x.sid].first.at) m[x.sid].first = x; return m }, {}))
    const isPaid = (o) => !['pending', 'cancelled'].includes(o.status)
    const o = orders.filter((x) => inR(x.createdAt, F, T)), paid = o.filter(isPaid), ppaid = orders.filter((x) => inR(x.createdAt, F - L, F) && isPaid(x))
    const day = (t) => new Date(new Date(t).getTime() + 3 * 3600e3).toISOString().slice(0, 10)
    const days = []; for (let d = day(F); d <= day(T - 1000); d = day(new Date(d).getTime() + 864e5 + 1)) days.push(d)
    const top = (arr, key, n = 10, distinct = 'vid') => Object.entries(arr.reduce((m, x) => { const k = key(x); if (k == null) return m; (m[k] ||= new Set()).add(distinct ? x[distinct] : x.id); return m }, {}))
      .map(([k, set]) => ({ k, n: set.size })).sort((a, b) => b.n - a.n).slice(0, n)
    const live = visits.filter((x) => x.kind === 'view' && Date.now() - new Date(x.at).getTime() < 5 * 60e3)
    const liveLast = Object.values(live.reduce((m, x) => { if (!m[x.vid] || m[x.vid].at < x.at) m[x.vid] = x; return m }, {})).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 30)
    const items = paid.flatMap((x) => x.items || [])
    const prods = Object.values(items.reduce((m, it) => { const r = (m[it.productId] ||= { id: it.productId, k: it.name, qty: 0, n: 0 }); r.qty += it.qty; r.n += it.price * it.qty; return m }, {})).sort((a, b) => b.n - a.n).slice(0, 10)
    const coup = Object.values(paid.filter((x) => x.coupon).reduce((m, x) => { const r = (m[x.coupon] ||= { k: x.coupon, n: 0, d: 0 }); r.n++; r.d += x.discount || 0; return m }, {})).sort((a, b) => b.n - a.n)
    return {
      visitors: uniq(pv), views: pv.length, sessions: sess.length,
      bounce: sess.length ? Math.round((1000 * sess.filter((x) => x.n === 1).length) / sess.length) / 10 : 0,
      avgDuration: sess.length ? Math.round(sess.reduce((a, x) => a + x.d, 0) / sess.length) : 0,
      newVisitors: uniq(pv.filter((x) => !visits.some((y) => y.vid === x.vid && new Date(y.at).getTime() < F))),
      live: uniq(live), liveList: liveLast,
      carts: uniq(v.filter((x) => x.kind === 'cart')), checkouts: uniq(v.filter((x) => x.kind === 'checkout')),
      revenue: paid.reduce((a, x) => a + x.total, 0), paidOrders: paid.length, buyers: new Set(paid.map((x) => x.userId)).size,
      discount: paid.reduce((a, x) => a + (x.discount || 0), 0), pending: o.filter((x) => x.status === 'pending').length, cancelled: o.filter((x) => x.status === 'cancelled').length,
      newCustomers: users.filter((u) => u.role !== 'admin' && u.createdAt && inR(u.createdAt, F, T)).length,
      prev: { visitors: uniq(prv), views: prv.length, revenue: ppaid.reduce((a, x) => a + x.total, 0), orders: ppaid.length },
      daily: days.map((d) => { const dp = pv.filter((x) => day(x.at) === d), dpaid = paid.filter((x) => day(x.createdAt) === d); return { day: d, visitors: uniq(dp), views: dp.length, orders: dpaid.length, revenue: dpaid.reduce((a, x) => a + x.total, 0) } }),
      pages: Object.values(pv.reduce((m, x) => { const r = (m[x.path] ||= { k: x.path, n: 0, s: new Set() }); r.n++; r.s.add(x.vid); return m }, {})).map((r) => ({ k: r.k, n: r.n, u: r.s.size })).sort((a, b) => b.n - a.n).slice(0, 12),
      sources: top(sess.map((x) => x.first), (x) => x.source, 10, 'sid'),
      campaigns: top(pv, (x) => x.campaign, 10, 'sid'),
      countries: top(pv, (x) => x.country || '??'), cities: top(pv, (x) => x.city), devices: top(pv, (x) => x.device, 10), browsers: top(pv, (x) => x.browser, 8), systems: top(pv, (x) => x.os, 8),
      hours: Object.entries(pv.reduce((m, x) => { const h = (new Date(x.at).getUTCHours() + 3) % 24; m[h] = (m[h] || 0) + 1; return m }, {})).map(([k, n]) => ({ k: +k, n })).sort((a, b) => a.k - b.k),
      products: prods, coupons: coup,
    }
  },
  async allOrders() { requireAdmin(); return read('orders', []) },
  async updateOrderStatus(id, status, note) {
    requireAdmin()
    const orders = read('orders', []).map((o) => (o.id === id
      ? { ...o, status, history: [...(o.history || []), { status, at: new Date().toISOString(), note: note || '' }] }
      : o))
    write('orders', orders)
  },

  // ---------- wishlist ----------
  async getWishlist() { const me = sessionUser(); return me ? read('wish:' + me.id, []) : read('wish:guest', []) },
  async setWishlist(ids) { const me = sessionUser(); write('wish:' + (me ? me.id : 'guest'), ids) },

  // ---------- customers & coupons ----------
  async listCustomers() {
    requireAdmin()
    const orders = read('orders', [])
    return read('users', []).filter((u) => u.role !== 'admin').map((u) => {
      const mine = orders.filter((o) => o.userId === u.id)
      return { ...publicUser(u), orders: mine.length, spent: mine.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0) }
    })
  },
  async listCoupons() { requireAdmin(); return read('coupons', []) },
  async saveCoupon(c) {
    requireAdmin()
    const list = read('coupons', []).filter((x) => x.code !== c.code)
    list.push({ ...c, code: c.code.toUpperCase() }); write('coupons', list)
  },
  async deleteCoupon(code) { requireAdmin(); write('coupons', read('coupons', []).filter((c) => c.code !== code)) },
  async validateCoupon(code) {
    await this.ready
    const c = read('coupons', []).find((x) => x.code === code.trim().toUpperCase() && x.active)
    if (!c) throw new Error('الكود غير صالح أو منتهي')
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) throw new Error('انتهت صلاحية هذا الكود')
    return c
  },

  // ---------- payments ----------
  async startPayment(order) { return { redirect: null, order } },
  async notifyOrder() {},
  async testOrderNotice() { return { sent: false, reason: 'demo' } },
  async downloadInvoice() { throw new Error('الفاتورة متاحة في المتجر الحقيقي فقط') },
  async verifySignup() { throw new Error('غير متاح في وضع العرض') },
  async resendSignup() {},
  async sendResetCode() { throw new Error('غير متاح في وضع العرض') },
  async resetWithCode() { throw new Error('غير متاح في وضع العرض') },
  async downloadUrl(orderId, productId) {
    const o = await this.getOrder(orderId)
    if (!o || ['pending', 'cancelled'].includes(o.status)) throw new Error('يتاح التحميل بعد تأكيد الدفع')
    const p = read('products', []).find((x) => x.id === productId)
    if (!p?.fileUrl) throw new Error('الملف لم يُرفع بعد. أضف رابطه من لوحة التحكم.')
    return p.fileUrl
  },
}
