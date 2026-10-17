// Tamara rules the owner sets in the dashboard (مصمم المتجر ← المتجر ← التقسيط مع تمارا). Pure module: used by the
// store pages (through mergeSettings) and by the server (api/tamara.js), so both apply exactly the same rules.

export const TAMARA_DEFAULTS = { min: 300, max: 0, coupons: true, exclude: ['subscriptions'] }

const num = (v, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : d }

/** Saved rules on top of the defaults, every value checked. max 0 = no upper limit. */
export function tamaraRules(raw) {
  const t = raw && typeof raw === 'object' ? raw : {}
  const min = num(t.min, TAMARA_DEFAULTS.min), max = num(t.max, TAMARA_DEFAULTS.max)
  return {
    min,
    max: max && max < min ? 0 : max,
    coupons: typeof t.coupons === 'boolean' ? t.coupons : TAMARA_DEFAULTS.coupons,
    exclude: Array.isArray(t.exclude) ? [...new Set(t.exclude.filter((x) => typeof x === 'string' && /^[a-z0-9-]{1,60}$/.test(x)))].slice(0, 40) : TAMARA_DEFAULTS.exclude,
  }
}

/** Why Tamara can't be used for this order (null = it can). total in SAR; categories = the category id of every item. */
export function tamaraBlock(rules, { total, coupon, categories = [] }) {
  const r = rules || TAMARA_DEFAULTS
  if (categories.some((c) => c && r.exclude.includes(c))) return 'category'
  if (coupon && !r.coupons) return 'coupon'
  if (!(total >= r.min)) return 'min'
  if (r.max && total > r.max) return 'max'
  return null
}

const fmt = (x) => Number(x).toLocaleString('en-US')
export const tamaraBlockText = (why, r) => ({
  category: 'بعض الخدمات في سلتك ما تشمل التقسيط',
  coupon: 'التقسيط ما يشمل الطلبات بكود خصم',
  min: `متاح للطلبات من ${fmt(r.min)} ر.س`,
  max: `متاح للطلبات حتى ${fmt(r.max)} ر.س`,
}[why] || 'غير متاح لهذا الطلب')
