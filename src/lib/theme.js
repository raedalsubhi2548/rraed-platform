// Store designer: the owner's look-and-feel settings (logo, colours, background, header, footer and the home page
// as an ordered list of blocks). Saved as one JSON row (site_settings, id 'main'), baked into the pre-rendered
// pages and applied live. Every value is checked here before it reaches the page.
import { waLink } from './format.js'

export const DEFAULT_SETTINGS = {
  logo: '/logo-300.png', // on light backgrounds (header after scrolling, menus)
  logoLight: '/logo-white.png', // on dark backgrounds (hero, footer)
  logoScale: 100, // percent
  colors: { primary: '#1b2b44', accent: '#c3cedd', background: '#fbfcfe' },
  announcement: { on: false, text: '', link: '' },
}


// ---------- store identity, fonts, corners ----------
export const DEFAULT_STORE = {
  name: 'منصة رائد', nameEn: 'Raed', description: '', whatsapp: '966536090915', email: 'info@rraed.com',
  social: { instagram: '', x: '', tiktok: '', snapchat: '' },
}
export const FONTS = {
  heading: [['marhey', 'مرحي (الأصلي)', "'Marhey'"], ['plex', 'آي بي إم بلكس', "'IBM Plex Sans Arabic'"], ['cairo', 'القاهرة', "'Cairo'"], ['tajawal', 'تجوال', "'Tajawal'"], ['almarai', 'المراعي', "'Almarai'"], ['elmessiri', 'المسيري', "'El Messiri'"], ['reemkufi', 'ريم كوفي', "'Reem Kufi'"]],
  body: [['plex', 'آي بي إم بلكس (الأصلي)', "'IBM Plex Sans Arabic'"], ['cairo', 'القاهرة', "'Cairo'"], ['tajawal', 'تجوال', "'Tajawal'"], ['almarai', 'المراعي', "'Almarai'"]],
}
export const RADII = [['round', 'دائرية (الأصلي)'], ['soft', 'ناعمة'], ['sharp', 'حادة']]
/** 05xxxxxxxx, 5xxxxxxxx, +9665xxxxxxxx → 9665xxxxxxxx (international, digits only). */
export const normPhone = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.startsWith('05') ? '966' + d.slice(1) : d.startsWith('5') && d.length === 9 ? '966' + d : d }

// ---------- home page blocks ----------
// Each block type: a name, an icon (lucide name, for the designer) and its fields. Field kinds:
// text · textarea · link · image · switch · select · number · category · product · products · items
export const ICONS = ['store', 'landing', 'analytics', 'shield', 'chat', 'clock'] // the line drawings in LineArt
export const BLOCKS = {
  hero: { name: 'الواجهة الرئيسية', icon: 'Sparkles', hint: 'صورة كبيرة بعنوان وزر، أول ما يشوفه الزائر.', fields: [
    ['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title1', 'العنوان (السطر الأول)', 'text', 60], ['title2', 'العنوان (السطر الثاني)', 'text', 60],
    ['text', 'الوصف', 'textarea', 220], ['cta', 'نص الزر', 'text', 30], ['ctaLink', 'رابط الزر', 'link'],
    ['image', 'صورة الخلفية (كمبيوتر)', 'image'], ['imageMobile', 'صورة الخلفية (جوال)', 'image'], ['showStats', 'إظهار شارة التقييم وعدد الطلبات', 'switch'],
  ] },
  banner: { name: 'بانر صورة', icon: 'Image', hint: 'صورة إعلانية بعرض الصفحة أو داخل إطار، ولها رابط.', fields: [
    ['image', 'الصورة (كمبيوتر)', 'image'], ['imageMobile', 'الصورة (جوال، اختياري)', 'image'], ['link', 'الرابط (اختياري)', 'link'], ['alt', 'وصف الصورة (لقوقل)', 'text', 120],
    ['size', 'العرض', 'select', [['container', 'داخل إطار'], ['full', 'بعرض الشاشة']]],
  ] },
  promises: { name: 'مميزات المتجر', icon: 'BadgeCheck', hint: 'ثلاث نقاط قصيرة مع رسومات.', fields: [['items', 'المميزات', 'items']] },
  products: { name: 'منتجات', icon: 'LayoutGrid', hint: 'رف منتجات: من قسم، أو تختارها بنفسك، أو الأحدث.', fields: [
    ['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 60],
    ['source', 'المنتجات', 'select', [['category', 'من قسم'], ['picked', 'أختارها بنفسي'], ['latest', 'الأحدث'], ['featured', 'المميزة']]],
    ['category', 'القسم', 'category'], ['ids', 'اختر المنتجات', 'products'], ['limit', 'عدد المنتجات', 'number', [2, 12]], ['viewAll', 'زر «عرض الكل»', 'switch'],
  ] },
  categories: { name: 'أقسام المتجر', icon: 'Shapes', hint: 'كل أقسام المتجر بصورها.', fields: [['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 60]] },
  imageText: { name: 'صورة مع نص', icon: 'PanelLeft', hint: 'صورة بجانبها عنوان ووصف وزر.', fields: [
    ['kicker', 'سطر صغير', 'text', 60], ['title', 'العنوان', 'text', 60], ['accent', 'سطر ثاني للعنوان', 'text', 60], ['text', 'الوصف', 'textarea', 260],
    ['cta', 'نص الزر', 'text', 30], ['link', 'الرابط', 'link'], ['image', 'الصورة', 'image'], ['priceOf', 'إظهار سعر منتج (اختياري)', 'product'], ['payIcons', 'إظهار شعارات الدفع', 'switch'],
  ] },
  text: { name: 'نص حر', icon: 'Type', hint: 'عنوان وفقرة، مع زر اختياري.', fields: [
    ['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 80], ['text', 'النص', 'textarea', 900],
    ['cta', 'نص الزر (اختياري)', 'text', 30], ['link', 'رابط الزر', 'link'], ['align', 'المحاذاة', 'select', [['center', 'وسط'], ['start', 'يمين']]],
  ] },
  gallery: { name: 'معرض الأعمال', icon: 'GalleryHorizontal', hint: 'صور أعمالكم تتحرك في صفين.', fields: [['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 60], ['text', 'الوصف', 'textarea', 160]] },
  reviews: { name: 'آراء العملاء', icon: 'MessageSquareQuote', hint: 'تقييمات العملاء تتحرك في صفين.', fields: [['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 60]] },
  faq: { name: 'الأسئلة الشائعة', icon: 'CircleHelp', hint: 'أسئلة تتكرر مع إجاباتها.', fields: [['eyebrow', 'سطر صغير فوق العنوان', 'text', 60], ['title', 'العنوان', 'text', 60]] },
}

const HERO = {
  eyebrow: 'تصميم متاجر سلة', title1: 'متجرك يستاهل', title2: 'تصميم يليق فيه',
  text: 'نصمم متجرك في سلة ونجهّزه للبيع خلال يومين إلى ستة أيام، بتفاصيل تشبه علامتك.',
  cta: 'ابدأ متجرك', ctaLink: '/salla-store-design', image: '', imageMobile: '', showStats: true,
}
/** What a freshly added block starts with. */
export const BLOCK_DEFAULTS = {
  hero: HERO,
  banner: { image: '', imageMobile: '', link: '', alt: '', size: 'container' },
  promises: { items: [{ icon: 'clock', title: 'تسليم المتجر', text: 'من يومين إلى 6 أيام' }, { icon: 'shield', title: 'دفع آمن', text: 'مدى، فيزا، ماستركارد وApple Pay' }, { icon: 'chat', title: 'تواصل مباشر', text: 'على واتساب طول التنفيذ' }] },
  products: { eyebrow: '', title: 'منتجاتنا', source: 'latest', category: '', ids: [], limit: 4, viewAll: true },
  categories: { eyebrow: 'كل ما يحتاجه متجرك', title: 'أقسام المتجر' },
  imageText: { kicker: '', title: 'عنوان جذاب', accent: '', text: '', cta: 'اطلب الحين', link: '/shop', image: '', priceOf: '', payIcons: false },
  text: { eyebrow: '', title: 'عنوان القسم', text: 'اكتب هنا النص اللي تبيه يظهر لعملائك.', cta: '', link: '', align: 'center' },
  gallery: { eyebrow: 'من مكتب منصة رائد', title: 'بنرات وتصاميم سوشال ميديا', text: 'نماذج حقيقية من شغلنا لعملائنا، مرّر عليها عشان توقف.' },
  reviews: { eyebrow: 'آراء عملائنا', title: 'وش قالوا عن شغلنا' },
  faq: { eyebrow: 'قبل ما تطلب', title: 'أسئلة تتكرر' },
}

/** The home page as it was designed (used until the owner saves their own). */
export const defaultHome = (hero = {}) => [
  { id: 'hero', type: 'hero', on: true, ...HERO, ...hero },
  { id: 'promises', type: 'promises', on: true, ...BLOCK_DEFAULTS.promises },
  { id: 'new', type: 'products', on: true, eyebrow: 'جديدنا ومميزاتنا', title: 'الأكثر طلباً عند عملائنا', source: 'picked', category: '', ids: ['salla-store-design', 'landing-page-design', 'google-tools-integration', 'ai-integration-chatgpt-claude-salla'], limit: 4, viewAll: true, viewAllTo: '/shop' },
  { id: 'landing', type: 'imageText', on: true, kicker: 'طفشت من الاشتراكات الشهرية؟', title: 'صفحة هبوط مبرمجة لك', accent: 'بدون اشتراك شهري', text: 'مبرمجة بـ HTML وCSS وJavaScript، مع دومين واستضافة سنة هدية.', cta: 'اطلبها الحين', link: '/landing-page-design', image: '/brand/ai/raed-landing.webp', priceOf: 'landing-page-design', payIcons: false },
  { id: 'categories', type: 'categories', on: true, ...BLOCK_DEFAULTS.categories },
  { id: 'design', type: 'products', on: true, eyebrow: 'نصمم لعلامتك', title: 'خدمات التصميم', source: 'category', category: 'design-services', ids: [], limit: 4, viewAll: true },
  { id: 'marketing', type: 'products', on: true, eyebrow: 'نوصّلك لعملائك', title: 'خدمات التسويق', source: 'category', category: 'marketing-services', ids: [], limit: 4, viewAll: true },
  { id: 'payments', type: 'imageText', on: true, kicker: 'ادفع بالطريقة اللي تريحك', title: 'قسّم قيمة متجرك', accent: 'على دفعات مريحة', text: 'ادفع بـ Apple Pay أو فيزا أو ماستركارد، أو قسّطها مع تمارا وتابي.', cta: 'اسألنا عن التقسيط', link: waLink('السلام عليكم، أبي أعرف عن تقسيط قيمة الخدمة'), image: '/brand/ai/raed-installments.webp', priceOf: '', payIcons: true },
  { id: 'government', type: 'products', on: true, eyebrow: 'أوراقك الرسمية', title: 'الخدمات الحكومية', source: 'category', category: 'government-services', ids: [], limit: 4, viewAll: true },
  { id: 'gallery', type: 'gallery', on: true, ...BLOCK_DEFAULTS.gallery },
  { id: 'reviews', type: 'reviews', on: true, ...BLOCK_DEFAULTS.reviews },
  { id: 'faq', type: 'faq', on: true, ...BLOCK_DEFAULTS.faq },
]

const SLUG = /^[\w؀-ۿ-]{1,80}$/ // product / category ids
function cleanBlock(b) {
  if (!b || typeof b !== 'object' || !BLOCKS[b.type]) return null
  const def = BLOCK_DEFAULTS[b.type]
  const out = { id: typeof b.id === 'string' && /^[\w-]{1,40}$/.test(b.id) ? b.id : 'b' + Math.random().toString(36).slice(2, 8), type: b.type, on: b.on !== false }
  for (const [key, , kind, opt] of BLOCKS[b.type].fields) {
    const v = b[key], d = def[key]
    if (kind === 'text' || kind === 'textarea') out[key] = text(v, d, opt)
    else if (kind === 'link') out[key] = safeLink(v, typeof v === 'string' && !v.trim() ? '' : d)
    else if (kind === 'image') out[key] = safeUrl(v, '')
    else if (kind === 'switch') out[key] = typeof v === 'boolean' ? v : !!d
    else if (kind === 'select') out[key] = opt.some(([x]) => x === v) ? v : d
    else if (kind === 'number') out[key] = Math.min(opt[1], Math.max(opt[0], Math.round(Number(v)) || d))
    else if (kind === 'category' || kind === 'product') out[key] = typeof v === 'string' && (v === '' || SLUG.test(v)) ? v : d
    else if (kind === 'products') out[key] = Array.isArray(v) ? v.filter((x) => typeof x === 'string' && SLUG.test(x)).slice(0, 12) : d
    else if (kind === 'items') out[key] = Array.isArray(v) ? v.slice(0, 4).map((x) => ({ icon: ICONS.includes(x?.icon) ? x.icon : 'store', title: text(x?.title, '', 40), text: text(x?.text, '', 60) })) : d
  }
  if (typeof b.viewAllTo === 'string') out.viewAllTo = safeLink(b.viewAllTo, '')
  return out
}

export const DEFAULT_HEADER_LINKS = [{ label: 'كل الخدمات', to: '/shop' }, { label: 'أعمالنا', to: '/work' }, { label: 'آراء العملاء', to: '/reviews' }, { label: 'المدونة', to: '/blog' }, { label: 'تواصل', to: '/contact' }]
export const DEFAULT_FOOTER_LINKS = [{ label: 'كل الخدمات', to: '/shop' }, { label: 'أعمالنا', to: '/work' }, { label: 'آراء العملاء', to: '/reviews' }, { label: 'المدونة', to: '/blog' }, { label: 'السياسات والشروط', to: '/policies' }]
// links saved before the blog existed were exactly the old defaults: those stores get the new defaults (with the blog)
const OLD_HEADER = 'كل الخدمات>/shop|أعمالنا>/work|آراء العملاء>/reviews|تواصل>/contact'
const OLD_FOOTER = 'كل الخدمات>/shop|أعمالنا>/work|آراء العملاء>/reviews|السياسات والشروط>/policies'
const sig = (links) => links.map((l) => `${l.label}>${l.to}`).join('|')
export const DEFAULT_CTA = ['محتار من وين تبدأ؟', 'قل لنا وش نشاطك، ونرتّب لك اللي تحتاجه فعلاً.']
export const DEFAULT_ABOUT = 'نصمم متجرك ونسوّقه ونجهّز أوراقه الرسمية، من جهة وحدة.'

/** Ready-made palettes the owner can start from. */
export const PRESETS = [
  { name: 'كحلي (الأصلي)', primary: '#1b2b44', accent: '#c3cedd', background: '#fbfcfe' },
  { name: 'أسود وذهبي', primary: '#161616', accent: '#d4b06a', background: '#fbf9f5' },
  { name: 'أخضر زيتي', primary: '#1f3b2d', accent: '#c9b37e', background: '#f8f7f2' },
  { name: 'عنابي', primary: '#4a1626', accent: '#e2c2a4', background: '#fdf9f7' },
  { name: 'بنفسجي', primary: '#2d1f4f', accent: '#c7b8ec', background: '#faf9fe' },
  { name: 'بني قهوة', primary: '#3b2a20', accent: '#d9b98f', background: '#fbf8f4' },
]

const HEX = /^#[0-9a-f]{6}$/i
const safeColor = (v, d) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim().toLowerCase() : d)
// images and links: our own paths or https only (the values end up in src/href attributes)
// Addresses from the dashboard end up in links, <img src>, CSS url() and the prerendered HTML:
// only same-site paths ("/x", never "//x" or "/\\x") and https:// URLs, with no spaces, quotes, angle brackets or backslashes.
const URL_OK = /^(?:\/(?![\/\\])|https:\/\/[^\/\\\s])[^\s"'<>`\\]*$/i
const safeUrl = (v, d = '') => {
  const t = typeof v === 'string' ? v.trim() : ''
  return t && (URL_OK.test(t) || /^data:image\/(png|jpe?g|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(t)) ? t : d
}
const safeLink = (v, d = '') => {
  const t = typeof v === 'string' ? v.trim() : ''
  return t && URL_OK.test(t) ? t : d
}
const text = (v, d, max = 160) => (typeof v === 'string' ? v.slice(0, max) : d)

/** Saved settings on top of the defaults, every value checked. */
export function mergeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const D = DEFAULT_SETTINGS
  const c = s.colors || {}, a = s.announcement || {}, h = s.hero || {}
  return {
    logo: safeUrl(s.logo, D.logo) || D.logo,
    logoLight: safeUrl(s.logoLight, D.logoLight) || D.logoLight,
    logoScale: Math.min(160, Math.max(60, Number(s.logoScale) || D.logoScale)),
    colors: { primary: safeColor(c.primary, D.colors.primary), accent: safeColor(c.accent, D.colors.accent), background: safeColor(c.background, D.colors.background) },
    announcement: { on: !!a.on && !!String(a.text || '').trim(), text: text(a.text, '', 140), link: safeLink(a.link) },
    // the first designer kept the hero on its own; it now lives in the home blocks
    home: (Array.isArray(s.home) ? s.home : defaultHome(typeof s.hero === 'object' ? s.hero : {})).slice(0, 30).map(cleanBlock).filter(Boolean),
    background: { image: safeUrl(s.background?.image, ''), decor: s.background?.decor !== false },
    header: {
      links: ((h) => (h && sig(h) !== OLD_HEADER ? h : DEFAULT_HEADER_LINKS))(Array.isArray(s.header?.links) ? s.header.links.slice(0, 6).map((l) => ({ label: text(l?.label, '', 24), to: safeLink(l?.to, '') })).filter((l) => l.label && l.to) : null),
      search: s.header?.search !== false, wishlist: s.header?.wishlist !== false,
    },
    store: {
      name: text(s.store?.name, DEFAULT_STORE.name, 40).trim() || DEFAULT_STORE.name,
      nameEn: text(s.store?.nameEn, DEFAULT_STORE.nameEn, 40).trim(),
      description: text(s.store?.description, '', 300).trim(), // empty: the built-in SEO description
      whatsapp: /^\d{9,15}$/.test(normPhone(s.store?.whatsapp)) ? normPhone(s.store.whatsapp) : DEFAULT_STORE.whatsapp,
      email: typeof s.store?.email === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s.store.email.trim()) ? s.store.email.trim() : DEFAULT_STORE.email,
      social: Object.fromEntries(Object.keys(DEFAULT_STORE.social).map((k) => [k, /^https:\/\//i.test(s.store?.social?.[k] || '') ? safeLink(s.store.social[k], '') : ''])),
    },
    fonts: {
      heading: FONTS.heading.some(([k]) => k === s.fonts?.heading) ? s.fonts.heading : 'marhey',
      body: FONTS.body.some(([k]) => k === s.fonts?.body) ? s.fonts.body : 'plex',
    },
    radius: RADII.some(([k]) => k === s.radius) ? s.radius : 'round',
    categoryImages: Object.fromEntries(Object.entries(s.categoryImages && typeof s.categoryImages === 'object' ? s.categoryImages : {}).filter(([k, v]) => SLUG.test(k) && safeUrl(v, '')).slice(0, 40)),
    footer: {
      links: ((f) => (f && sig(f) === OLD_FOOTER ? null : f))(Array.isArray(s.footer?.links) ? s.footer.links.slice(0, 8).map((l) => ({ label: text(l?.label, '', 30), to: safeLink(l?.to, '') })).filter((l) => l.label && l.to) : null),
      about: text(s.footer?.about, DEFAULT_ABOUT, 200), payments: s.footer?.payments !== false,
      cta: s.footer?.cta !== false, ctaTitle: text(s.footer?.ctaTitle, DEFAULT_CTA[0], 60) || DEFAULT_CTA[0], ctaText: text(s.footer?.ctaText, DEFAULT_CTA[1], 140),
    },
  }
}

// --- colour maths (sRGB mixing is enough for tints and shades) ---
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)) }
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

/** CSS that re-tints the design tokens (src/styles/tokens.css). Empty for the original palette. */
export function themeCss(settings) {
  const s = mergeSettings(settings)
  const D = DEFAULT_SETTINGS.colors
  const { primary: P, accent: A, background: B } = s.colors
  const v = []
  if (P !== D.primary) {
    v.push(['--p-green-950', mix(P, '#000000', 0.42)], ['--p-green-900', P], ['--p-green-800', mix(P, '#ffffff', 0.08)], ['--p-green-700', mix(P, '#ffffff', 0.18)],
      ['--p-green-600', mix(P, '#ffffff', 0.3)], ['--p-green-200', mix(P, '#ffffff', 0.78)], ['--p-green-100', mix(P, '#ffffff', 0.88)], ['--p-green-50', mix(P, '#ffffff', 0.94)],
      ['--p-ink-900', mix(P, '#000000', 0.42)], ['--p-ink-600', mix(P, '#6b7280', 0.6)])
  }
  if (A !== D.accent || P !== D.primary) {
    // accent text must stay readable on the light background
    let t = 0.55, txt = mix(A, P, t)
    while (contrast(txt, B) < 4.6 && t < 0.95) { t += 0.05; txt = mix(A, P, t) }
    v.push(['--p-gold-700', txt], ['--p-gold-600', mix(A, P, 0.4)], ['--p-gold-500', mix(A, P, 0.18)], ['--p-gold-400', A], ['--p-gold-200', mix(A, '#ffffff', 0.45)], ['--p-gold-100', mix(A, '#ffffff', 0.7)])
  }
  if (B !== D.background || P !== D.primary) {
    v.push(['--p-cream-50', B], ['--p-cream-100', mix(B, P, 0.035)], ['--p-cream-200', mix(B, P, 0.1)], ['--p-cream-300', mix(B, P, 0.16)])
  }
  if (s.logoScale !== 100) v.push(['--logo-scale', String(s.logoScale / 100)])
  const fam = (list, k) => list.find(([x]) => x === k)[2]
  if (s.fonts.heading !== 'marhey') v.push(['--p-font-script', `${fam(FONTS.heading, s.fonts.heading)}, 'IBM Plex Sans Arabic', sans-serif`])
  if (s.fonts.body !== 'plex') { const f = `${fam(FONTS.body, s.fonts.body)}, 'IBM Plex Sans Arabic', system-ui, sans-serif`; v.push(['--p-font-text', f], ['--p-font-display', f]) }
  if (s.radius === 'soft') v.push(['--p-radius-pill', '14px'], ['--p-radius-lg', '14px'], ['--p-radius-xl', '18px'])
  if (s.radius === 'sharp') v.push(['--p-radius-pill', '6px'], ['--p-radius-lg', '6px'], ['--p-radius-xl', '8px'], ['--p-radius-md', '6px'], ['--p-radius-sm', '4px'])
  let css = v.length ? `:root{${v.map(([k, x]) => `${k}:${x}`).join(';')}}` : ''
  // corners: buttons, fields and cards follow the owner's choice (dots and avatars stay round)
  if (s.radius !== 'round') {
    const [btn, card] = s.radius === 'soft' ? ['12px', '16px'] : ['4px', '6px']
    css += `:is(a,button,input,select,textarea,label).rounded-full{border-radius:${btn}!important}:is(.rounded-xl,.rounded-lg,.rounded-2xl,[class*="rounded-[18px]"],[class*="rounded-[20px]"],[class*="rounded-[34px]"]){border-radius:${card}!important}`
  }
  // a background picture behind the whole store (characters that could end the url() are escaped)
  if (s.background.image) css += `body{background-image:url("${s.background.image.replace(/["'\\\n\r()<>]/g, encodeURIComponent)}");background-size:cover;background-position:center;background-attachment:fixed}`
  return css
}
