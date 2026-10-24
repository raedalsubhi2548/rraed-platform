// Public product addresses. Products keep their database ids; a few old ids carried the earlier
// store's name or were long/misspelled, so they get a short, clean address here (the old one 301-redirects in vercel.json).
const ALIAS = {
  'tmara-registration': 'tamara-registration',
  'issue-commercial-registration-saudi': 'commercial-registration',
  'freelance-certificate-family-platform': 'freelance-document',
  'ai-integration-chatgpt-claude-salla': 'salla-ai-integration',
}
const BACK = Object.fromEntries(Object.entries(ALIAS).map(([id, slug]) => [slug, id]))

export const toSlug = (id) => ALIAS[id] || id
export const fromSlug = (slug) => BACK[slug] || slug
export const productPath = (id) => `/${toSlug(id)}`
// Categories and services live at the top level (rraed.com/salla-store-design), next to the fixed pages; these names
// are taken by those pages, so no category or service may use them.
export const categoryPath = (id) => `/${id}`
export const RESERVED = ['shop', 'cart', 'checkout', 'order', 'review', 'login', 'contact', 'policies', 'work', 'reviews', 'blog', 'account', 'admin', 'api', 'assets', 'brand', 'c', 'p']
