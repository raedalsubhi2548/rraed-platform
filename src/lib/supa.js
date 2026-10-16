// Live backend: Supabase (auth + Postgres + storage). Schema in supabase/schema.sql.
import { createClient } from '@supabase/supabase-js'
import { coverFor } from './cover.js'

// accept the URL with or without a trailing /rest/v1/ (common copy-paste from the dashboard)
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// A dropped connection (Safari: "TypeError: Load failed") is retried once when repeating the request is harmless:
// reads, updates, deletes and upserts. Order creation (an RPC) is never repeated.
const NET = 'تعذّر الاتصال بالإنترنت، تأكد من الشبكة وحاول مرة ثانية'
async function steadyFetch(input, init = {}) {
  const method = (init.method || 'GET').toUpperCase()
  const prefer = new Headers(init.headers || {}).get('prefer') || ''
  const safe = ['GET', 'HEAD', 'PATCH', 'DELETE'].includes(method) || /merge-duplicates/.test(prefer)
  try { return await fetch(input, init) } catch (e) {
    if (!(e instanceof TypeError) || !safe) throw new Error(NET)
    await new Promise((r) => setTimeout(r, 700))
    try { return await fetch(input, init) } catch { throw new Error(NET) }
  }
}
export const sb = url && key ? createClient(url, key, { global: { fetch: steadyFetch } }) : null

// --- row <-> object mapping (DB is snake_case, UI is camelCase) ---
// Rows imported from the old store carry its name and its green images; show the Raed brand instead.
const LEGACY_IMG = /cdn\.salla\.(sa|network)|^data:/
const artFor = (r) => (r.image && /cdn\.salla\.sa\/zvxNvp\//.test(r.image) ? `/api/art?f=${encodeURIComponent(r.image.split('/').pop())}&id=${encodeURIComponent(r.id)}&v=6` : coverFor({ id: r.id, categoryId: r.category_id }))
const rebrand = (t) => (typeof t === 'string' ? t.replace(/\u0648\u0627\u0631\u0641(?![\u0621-\u064A])/g, 'رائد') : t)
const product = (r) => r && ({
  id: r.id, name: rebrand(r.name), price: Number(r.price), salePrice: r.sale_price == null ? null : Number(r.sale_price),
  categoryId: r.category_id, badge: r.badge, featured: r.featured, sort: r.sort,
  summary: rebrand(r.summary), description: rebrand(r.description), active: r.active, digital: r.digital, perUnit: r.per_unit,
  createdAt: r.created_at, options: Array.isArray(r.options) ? r.options : undefined,
  image: !r.image || LEGACY_IMG.test(r.image) ? artFor(r) : r.image,
})
const productRow = (p) => ({
  id: p.id, name: p.name, price: p.price, sale_price: p.salePrice || null, category_id: p.categoryId,
  image: !p.image || p.image.startsWith('data:') ? null : p.image.startsWith('/api/art?f=') ? 'https://cdn.salla.sa/zvxNvp/' + decodeURIComponent(p.image.slice(11).split('&')[0]) : p.image, badge: p.badge || null, featured: !!p.featured, sort: p.sort ?? 0, summary: p.summary,
  description: p.description, active: p.active !== false, digital: !!p.digital, per_unit: p.perUnit || null,
  ...(Array.isArray(p.options) ? { options: p.options } : {}), // only once the options column exists (supabase/options.sql)
})
// items keep the image they had when ordered; old Salla mockups get the same store art as the catalog
const itemImage = (it) => (!it.image || LEGACY_IMG.test(it.image) ? artFor({ id: it.productId, image: it.image }) : it.image)
const order = (r) => r && ({
  id: r.id, number: r.number, userId: r.user_id, customer: r.customer, items: (r.items || []).map((it) => ({ ...it, image: itemImage(it) })),
  subtotal: Number(r.subtotal), discount: Number(r.discount), coupon: r.coupon, total: Number(r.total),
  status: r.status, notes: r.notes, paymentMethod: r.payment_method, paymentRef: r.payment_ref || null, history: r.history || [], createdAt: r.created_at,
})
const coupon = (r) => ({ code: r.code, type: r.type, value: Number(r.value), active: r.active, expiresAt: r.expires_at })

// Taken off the store (Oct 2026). Kept hidden here until supabase/options.sql deletes the rows.
const REMOVED = { products: ['waarfe-ai-ad-campaigns-guide'], categories: ['digital-products'] }

function check({ data, error }) { if (error) throw new Error(error.message); return data }

let cachedUser = null
async function loadProfile(authUser) {
  if (!authUser) return (cachedUser = null)
  const { data, error } = await sb.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
  const prev = cachedUser?.id === authUser.id ? cachedUser : null
  if (error && prev) return prev // a passing network hiccup must not demote the admin
  cachedUser = {
    id: authUser.id, email: authUser.email || '',
    name: data?.name || authUser.user_metadata?.name || '', phone: data?.phone || '',
    role: data?.role || prev?.role || 'customer', createdAt: data?.created_at || authUser.created_at,
  }
  return cachedUser
}

function translateAuthError(msg) {
  if (/Signups not allowed|otp_disabled|User not found/i.test(msg)) return 'ما عندنا حساب بهذا البريد، اختر «حساب جديد» وسجّل'
  if (/Invalid login/i.test(msg)) return 'البريد أو كلمة المرور غير صحيحة'
  if (/already registered/i.test(msg)) return 'هذا البريد مسجّل مسبقاً، سجّل دخولك بدلاً من ذلك'
  if (/Email not confirmed/i.test(msg)) return 'فعّل بريدك من الرسالة اللي وصلتك ثم سجّل دخولك'
  if (/Password should be/i.test(msg)) return 'كلمة المرور لازم تكون 6 أحرف على الأقل'
  if (/Error sending|sending (confirmation|recovery|magic)/i.test(msg)) return 'تعذّر إرسال رمز التحقق الحين، حاول بعد شوي أو تواصل معنا على واتساب'
  if (/rate limit|too many|security purposes/i.test(msg)) return 'طلبت رموز كثير، انتظر دقيقة وحاول مرة ثانية'
  return msg
}

export const supa = {
  mode: 'live',
  ready: Promise.resolve(),

  async currentUser() {
    const { data } = await sb.auth.getSession()
    return loadProfile(data.session?.user)
  },
  onAuth(fn) {
    let seq = 0, alive = true
    // Supabase asks not to await its own calls inside this callback: do the profile read right after it returns,
    // and only let the newest event win (events can finish out of order).
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      const my = ++seq
      if (event === 'TOKEN_REFRESHED' && cachedUser?.id === session?.user?.id) return
      setTimeout(async () => {
        const u = await loadProfile(session?.user).catch(() => cachedUser)
        if (alive && my === seq) fn(u)
      }, 0)
    })
    return () => { alive = false; data.subscription.unsubscribe() }
  },
  // Every sign-in is an email code: no passwords anywhere (supabase/login-code-2026-10.sql removes the old ones).
  // create: a new account (name and phone ride along to the profile); otherwise only an existing account gets a code.
  async sendLoginCode(email, { create = false, name, phone } = {}, captchaToken) {
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: create, ...(create ? { data: { name, phone } } : {}), ...(captchaToken ? { captchaToken } : {}) },
    })
    if (error) throw new Error(translateAuthError(error.message))
  },
  async verifyLoginCode(email, code) {
    // a brand-new account's first code is a sign-up confirmation; every later one is an email login code
    let r = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    if (r.error) r = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' })
    if (r.error) throw new Error('الرمز غير صحيح أو انتهت صلاحيته')
    return loadProfile(r.data.user)
  },
  async signOut() { await sb.auth.signOut() },
  async updateProfile(patch) {
    const me = cachedUser; if (!me) throw new Error('سجّل دخولك أولاً')
    check(await sb.from('profiles').update({ name: patch.name, phone: patch.phone }).eq('id', me.id))
    return loadProfile((await sb.auth.getUser()).data.user)
  },

  async getCategories() { return check(await sb.from('categories').select('*').order('sort')).filter((c) => !REMOVED.categories.includes(c.id)) },
  async getProducts({ includeHidden = false } = {}) {
    let q = sb.from('products').select('*')
    if (!includeHidden) q = q.eq('active', true)
    return check(await q).filter((r) => !REMOVED.products.includes(r.id)).map(product)
  },
  async getProduct(id) {
    const p = product(check(await sb.from('products').select('*').eq('id', id).maybeSingle()))
    if (p && cachedUser?.role === 'admin') {
      const { data } = await sb.from('product_files').select('path').eq('product_id', id).maybeSingle()
      p.fileUrl = data?.path || ''
    }
    return p
  },
  async saveProduct(p) {
    const row = productRow({ ...p, id: p.id || 'p-' + Date.now().toString(36) })
    check(await sb.from('products').upsert(row))
    if (p.fileUrl !== undefined) check(await sb.rpc('set_product_file', { p_product: row.id, p_path: p.fileUrl || '' }))
    return product(row)
  },
  async deleteProduct(id) { check(await sb.from('products').delete().eq('id', id)) },
  async saveCategory(c) {
    check(await sb.from('categories').upsert({ id: c.id || 'c-' + Date.now().toString(36), name: c.name, blurb: c.blurb, icon: c.icon || 'spark', sort: c.sort ?? 99 }))
  },
  async deleteCategory(id) {
    const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id)
    if (count) throw new Error('انقل منتجات هذا التصنيف أولاً ثم احذفه')
    check(await sb.from('categories').delete().eq('id', id))
  },
  // ---------- store designer ----------
  async getSettings() {
    const { data, error } = await sb.from('site_settings').select('data').eq('id', 'main').maybeSingle()
    // a failed read keeps what the page already shows (the snapshot it was built with) instead of the defaults
    if (error) throw new Error(error.message)
    return data?.data || null
  },
  async saveSettings(settings) {
    const { error } = await sb.from('site_settings').upsert({ id: 'main', data: settings, updated_at: new Date().toISOString() })
    if (error) throw new Error(/site_settings|relation|schema cache/i.test(error.message) ? 'شغّل ملف supabase/designer.sql في Supabase أولاً' : error.message)
  },
  /** Rebuilds the pre-rendered pages so search engines and link previews see the new design too. */
  async rebuildSite() {
    const { data } = await sb.auth.getSession()
    const r = await fetch('/api/rebuild', { method: 'POST', headers: { authorization: 'Bearer ' + data.session?.access_token } })
    return r.json().catch(() => ({ ok: false }))
  },
  async uploadImage(file) {
    // images only (SVG is allowed for logos: it is served from the storage domain, not the store), and a sane size
    if (!/^image\/(png|jpeg|webp|gif|avif|svg\+xml)$/.test(file.type)) throw new Error('الصيغ المسموحة: PNG أو JPG أو WebP أو GIF أو SVG')
    if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 5 ميجا')
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' }[file.type]
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    check(await sb.storage.from('products').upload(path, file, { upsert: false, contentType: file.type }))
    return sb.storage.from('products').getPublicUrl(path).data.publicUrl
  },

  // Prices are recomputed in the database (place_order) — the browser never sets the total.
  async createOrder({ items, customer, notes, coupon: code, paymentMethod }) {
    const id = check(await sb.rpc('place_order', {
      p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty, note: String(i.note || '').slice(0, 1000), options: i.optionKeys || [] })),
      p_customer: customer, p_notes: notes || '', p_coupon: code || null, p_payment_method: paymentMethod,
    }))
    return order(check(await sb.from('orders').select('*').eq('id', id).single()))
  },
  async myOrders() {
    const me = cachedUser; if (!me) throw new Error('سجّل دخولك أولاً')
    return check(await sb.from('orders').select('*').eq('user_id', me.id).order('created_at', { ascending: false })).map(order)
  },
  async getOrder(id) { return order(check(await sb.from('orders').select('*').eq('id', id).maybeSingle())) },
  async adminReport(from, to) { return check(await sb.rpc('admin_report', { p_from: from, p_to: to })) },
  async allOrders() { return check(await sb.from('orders').select('*').order('created_at', { ascending: false })).map(order) },
  async updateOrderStatus(id, status, note) {
    check(await sb.rpc('set_order_status', { p_order: id, p_status: status, p_note: note || '' }))
  },

  async getWishlist() {
    const me = cachedUser
    if (!me) { try { return JSON.parse(localStorage.getItem('raed:wish:guest') || '[]') } catch { return [] } }
    return check(await sb.from('wishlists').select('product_id').eq('user_id', me.id)).map((r) => r.product_id)
  },
  async setWishlist(ids) {
    const me = cachedUser
    if (!me) { try { localStorage.setItem('raed:wish:guest', JSON.stringify(ids)) } catch { /* ignore */ } return }
    check(await sb.from('wishlists').delete().eq('user_id', me.id))
    if (ids.length) check(await sb.from('wishlists').insert(ids.map((product_id) => ({ user_id: me.id, product_id }))))
  },

  async listCustomers() { return check(await sb.rpc('admin_customers')) },
  async listCoupons() { return check(await sb.from('coupons').select('*')).map(coupon) },
  async saveCoupon(c) {
    check(await sb.from('coupons').upsert({ code: c.code.toUpperCase(), type: c.type, value: c.value, active: c.active, expires_at: c.expiresAt || null }))
  },
  async deleteCoupon(code) { check(await sb.from('coupons').delete().eq('code', code)) },
  async validateCoupon(code) {
    const r = check(await sb.rpc('check_coupon', { p_code: code.trim().toUpperCase() }))
    if (!r) throw new Error('الكود غير صالح أو منتهي')
    return coupon(r)
  },

  // Card / Apple Pay / mada through Tap — the charge is created server-side (api/tap-charge.js).
  async startPayment(o) {
    const { data } = await sb.auth.getSession()
    const res = await fetch('/api/tap-charge', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + data.session?.access_token },
      body: JSON.stringify({ orderId: o.id }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || 'تعذّر بدء الدفع، حاول مرة ثانية')
    return { redirect: body.url, free: !!body.free, order: o }
  },
  async downloadUrl(orderId, productId) {
    const { data } = await sb.auth.getSession()
    const res = await fetch(`/api/download?order=${encodeURIComponent(orderId)}&product=${encodeURIComponent(productId)}`, {
      headers: { authorization: 'Bearer ' + data.session?.access_token },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || 'تعذّر التحميل')
    return body.url
  },
  // emails for an order moment (server checks who may send what, and sends each one once)
  async notifyOrder(orderId, event) {
    const { data } = await sb.auth.getSession()
    await fetch('/api/order-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + data.session?.access_token },
      body: JSON.stringify({ orderId, event }),
    }).catch(() => {})
  },
  async testOrderNotice() {
    const { data } = await sb.auth.getSession()
    const r = await fetch('/api/order-email', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + data.session?.access_token }, body: JSON.stringify({ test: true }) })
    return r.json().catch(() => ({ sent: false, reason: 'server' }))
  },
  async downloadInvoice(order) {
    const { data } = await sb.auth.getSession()
    const res = await fetch(`/api/invoice?order=${encodeURIComponent(order.id)}`, { headers: { authorization: 'Bearer ' + data.session?.access_token } })
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'تعذّر تجهيز الفاتورة') }
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'), { href: url, download: `فاتورة-${order.number}.pdf` })
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000)
  },
  async verifyPayment(orderId, tapId) {
    const res = await fetch(`/api/tap-verify?order=${encodeURIComponent(orderId)}&tap_id=${encodeURIComponent(tapId)}`)
    return res.json().catch(() => ({}))
  },
}
