// The route from zero to first order: each stage is one catalog category, in the order a merchant meets them.
// Everything shown on a stage (services, starting price) is read from the live catalog, never typed here.
import { effectivePrice } from './format.js'

export const STAGES = [
  { category: 'government-services', title: 'وثّق نشاطك', line: 'الأوراق الرسمية اللي يحتاجها متجرك قبل أول ريال.' },
  { category: 'subscriptions', title: 'افتح متجرك', line: 'اشتراك سلة والثيم والدومين، جاهزة باسمك.' },
  { category: 'design-services', title: 'صمّم واجهتك', line: 'متجر وصفحات وهوية تشبه علامتك وتقنع من أول نظرة.' },
  { category: 'marketing-services', title: 'سوّق وابدأ تبيع', line: 'حملات وتتبع يوصّلونك لعملائك ويقيسون كل ريال.' },
]

/** The stages that exist in this catalog, with their services and lowest price. */
export function stagesFor(categories, products) {
  return STAGES.flatMap((s) => {
    const cat = categories.find((c) => c.id === s.category)
    if (!cat) return []
    const items = products.filter((p) => p.categoryId === s.category && p.active !== false)
    if (!items.length) return []
    // per-unit add-ons (priced «للمنتج») are not a way into the stage, so they never set its starting price
    const whole = items.filter((p) => !p.perUnit)
    const from = Math.min(...(whole.length ? whole : items).map(effectivePrice))
    return [{ ...s, cat, items, from }]
  }).map((s, i) => ({ ...s, n: i + 1 }))
}

/** Stage number for a category (0 when the category is not on the route). */
export const stageOf = (stages, categoryId) => stages.find((s) => s.category === categoryId)?.n || 0
