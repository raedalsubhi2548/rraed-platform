import { fromSlug, toSlug, productPath } from './slug.js'
import { POSTS, BLOG_CATEGORIES, blogPath } from '../data/blog/index.js'
// One source of truth for titles, descriptions, canonical links, social cards and structured
// data. Used at runtime (useSeo) and at build time (scripts/prerender.mjs) so crawlers that do
// not run JavaScript still get the full head for every public page.

// The store's WhatsApp and phone (0536090915), same as src/lib/format.js
const WA = '966536090915'
export const WA_LOCAL = '0' + WA.replace(/^966/, '')

export const SITE = {
  name: 'منصة رائد',
  nameEn: 'Raed',
  // One home for search engines: every canonical, sitemap entry and social card points at rraed.com,
  // whichever address (vercel.app, www) a visitor or crawler arrived on.
  url: ((typeof process !== 'undefined' && process.env?.SITE_URL) || 'https://rraed.com').replace(/\/$/, ''),
  phone: '+' + WA,
  email: 'info@rraed.com',
  logo: '/logo.png',
  ogImage: '/og-v2.jpg', // new file name: WhatsApp and others cache link previews by image URL
  tagline: 'تصميم متاجر سلة وصفحات الهبوط والتسويق والخدمات التجارية',
  keywords: 'منصة رائد، تصميم متجر سلة، تصميم متاجر سلة، مصمم متاجر سلة، تصميم متجر إلكتروني، تصميم صفحة هبوط، تصميم شعار، تصميم بنرات، إعلانات سناب شات، إعلانات تيك توك، ربط بكسل سناب، ربط قوقل أناليتكس بسلة، سجل تجاري إلكتروني، وثيقة العمل الحر، توثيق المتجر، التسجيل في تابي، التسجيل في تمارا، ثيمات سلة، اشتراك سلة',
  description: 'منصة رائد: تصميم متاجر سلة احترافية، صفحات هبوط مبرمجة بدون اشتراك شهري، حملات إعلانية على سناب وتيك توك وإنستغرام، ربط أدوات قوقل والبكسل، والخدمات الحكومية للمتاجر في السعودية.',
}

const BLOG_ART = {
  design: '/brand/og/raed-design.jpg',
  marketing: '/brand/og/raed-marketing.jpg',
  legal: '/brand/og/raed-government.jpg',
}
const CAT_ART = {
  'design-services': '/brand/og/raed-design.jpg',
  'marketing-services': '/brand/og/raed-marketing.jpg',
  subscriptions: '/brand/og/raed-subscriptions.jpg',
  'government-services': '/brand/og/raed-government.jpg',
}

// Search titles/descriptions per service and section: the words people actually search in Saudi.
const SEO_CAT = {
  'design-services': ['تصميم متاجر سلة وصفحات هبوط وشعارات', 'تصميم متجر سلة احترافي، صفحات هبوط مبرمجة بدون اشتراك شهري، تصميم شعار وبنرات إعلانية، وإضافة المنتجات. أسعار ثابتة وتنفيذ سريع من منصة رائد.'],
  'marketing-services': ['إعلانات سناب وتيك توك وربط البكسل', 'إنشاء حملات إعلانية على سناب شات وتيك توك وإنستغرام، ربط البكسل وأدوات قوقل، وربط متجرك بالذكاء الاصطناعي. خدمات تسويق المتاجر من منصة رائد.'],
  subscriptions: ['اشتراك سلة وثيمات سلة وحجز دومين', 'تفعيل اشتراك سلة، شراء ثيمات سلة الأصلية وتركيبها، وحجز دومين باسم متجرك وربطه بسلة. كل اللي يحتاجه متجرك من منصة رائد.'],
  'government-services': ['سجل تجاري ووثيقة عمل حر وتوثيق المتجر', 'إصدار سجل تجاري إلكتروني، وثيقة العمل الحر، توثيق المتجر في منصة الأعمال، والتسجيل في تابي وتمارا. نجهّز طلبك ونتابعه لك من منصة رائد.'],
}
const SEO_PRODUCT = {
  'salla-store-design': ['تصميم متجر سلة احترافي جاهز للبيع', 'تصميم متجر سلة متكامل جاهز للبيع من أول يوم: بنرات، أقسام، منتجات، شحن ودفع. مصمم متاجر سلة بتسليم من يومين إلى ستة أيام.'],
  'landing-page-design': ['تصميم صفحة هبوط مبرمجة بدون اشتراك شهري', 'تصميم صفحة هبوط مستقلة مبرمجة بـ HTML وCSS وJavaScript، بدون اشتراكات شهرية، مع دومين واستضافة سنة هدية. صفحة هبوط تبيع لمنتجك.'],
  'banner-design': ['تصميم بنرات إعلانية لمتجر سلة والسوشال', 'تصميم بنر إعلاني بجودة عالية بمقاسات سلة أو السوشال ميديا، بنص تسويقي واضح داخل التصميم.'],
  'logo-design': ['تصميم شعار لوجو احترافي لمتجرك', 'تصميم لوجو احترافي يعبّر عن نشاطك، يسلَّم بجودة عالية وبصيغ متعددة جاهزة للمتجر والسوشال.'],
  'add-product-options': ['إضافة منتجات سلة مع الخيارات والكميات', 'إضافة منتج في متجر سلة بكل خياراته من مقاسات وألوان وروائح، مع سعر وصور كل خيار.'],
  'add-products': ['إضافة منتجات لمتجر سلة', 'إدخال منتجاتك في متجر سلة بالاسم والوصف والسعر والصور، وجاهزة للبيع.'],
  'ai-integration-chatgpt-claude-salla': ['ربط متجر سلة بالذكاء الاصطناعي ChatGPT وClaude', 'ربط متجرك في سلة بـ ChatGPT أو Claude عبر تقنية MCP الرسمية: أدر الطلبات والمنتجات والمخزون والتقارير بأوامر نصية بالعربي.'],
  'snapchat-ads-creation': ['إنشاء حملة إعلانية على سناب شات', 'إعلانات سناب شات لمتجرك: حملة كاملة بهدف واضح واستهداف حسب المدينة والعمر والاهتمامات، وهيكل حملة جاهز للانطلاق.'],
  'tiktok-ads-creation': ['إنشاء حملة إعلانية على تيك توك', 'إعلانات تيك توك لمتجرك: حملة جاهزة للانطلاق بهدف واضح واستهداف دقيق للفئة المهتمة بمنتجك.'],
  'instagram-ads-creation': ['إنشاء حملة إعلانية على إنستغرام', 'إعلانات إنستغرام الممولة لمتجرك، تصل لعملائك المستهدفين مع ضبط كامل لإعدادات الحملة.'],
  'pixel-integration': ['ربط بكسل سناب وتيك توك وميتا بمتجر سلة', 'ربط البكسل بمتجرك وضبط أحداث التتبع: زيارة الصفحات، مشاهدة المنتج، الإضافة للسلة، وإتمام الشراء.'],
  'google-tools-integration': ['ربط قوقل أناليتكس وتاج مانجر بمتجر سلة', 'ربط Google Analytics بمتجرك في سلة، مع خيار Google Tag Manager وSearch Console وMerchant Center.'],
  'salla-subscription': ['تفعيل اشتراك سلة وسلة برو', 'تفعيل اشتراك متجرك في سلة على الباقة الأنسب لك، مع خيار الترقية لسلة برو.'],
  'salla-theme': ['شراء ثيم سلة «ثيم عالي» الأصلي وتركيبه', 'شراء ثيمات سلة الأصلية المرخّصة: نركّب «ثيم عالي» ونفعّله على متجرك، مع ضبط الإعدادات ودعم بعد التركيب.'],
  'buy-domain': ['حجز دومين لمتجر سلة وربطه', 'شراء دومين رسمي باسم متجرك وربطه بمتجر سلة، مع التأكد من التفعيل.'],
  'issue-commercial-registration-saudi': ['إصدار سجل تجاري إلكتروني للمتجر', 'إصدار سجل تجاري إلكتروني عبر وزارة التجارة، مع اختيار النشاط المناسب ومتابعة الطلب حتى الإصدار.'],
  'freelance-certificate-family-platform': ['إصدار وثيقة العمل الحر', 'إصدار وثيقة العمل الحر الرسمية عبر منصة الأسر المنتجة، مع اختيار المهنة المناسبة لنشاطك.'],
  'business-verification': ['توثيق المتجر في منصة الأعمال', 'توثيق متجرك الإلكتروني في منصة الأعمال والحصول على علامة التوثيق الرسمية، مع تجهيز الطلب ومتابعته حتى القبول.'],
  'tabby-registration': ['التسجيل في تابي وتفعيل التقسيط بمتجرك', 'تفعيل الدفع بالتقسيط عبر تابي في متجرك، مع تجهيز طلب التسجيل لنسبة قبول أعلى.'],
  'tmara-registration': ['التسجيل في تمارا وتفعيل التقسيط بمتجرك', 'تفعيل الدفع بالتقسيط عبر تمارا في متجرك، مع متابعة طلب التسجيل حتى التفعيل.'],
}

const abs = (p) => (p?.startsWith('http') ? p : SITE.url.replace(/\/$/, '') + p)
const clip = (s = '', n = 158) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t }
const price = (p) => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price)

const ORG = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': abs('/#org'),
  name: `${SITE.name} | ${SITE.nameEn}`,
  alternateName: [SITE.name, SITE.nameEn],
  url: abs('/'),
  logo: abs(SITE.logo),
  image: abs(SITE.ogImage),
  description: SITE.description,
  telephone: SITE.phone,
  email: SITE.email,
  areaServed: { '@type': 'Country', name: 'المملكة العربية السعودية' },
  priceRange: 'SAR',
  contactPoint: [{ '@type': 'ContactPoint', telephone: SITE.phone, email: SITE.email, contactType: 'customer service', availableLanguage: ['ar', 'en'] }],
})

const WEBSITE = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: abs('/'),
  name: SITE.name,
  inLanguage: 'ar-SA',
  publisher: { '@id': abs('/#org') },
  potentialAction: { '@type': 'SearchAction', target: abs('/shop?q={search_term_string}'), 'query-input': 'required name=search_term_string' },
})

const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

/** Build the head for a route. data: { products, categories, product, category, faq, reviews } */
export function seoFor(path, data = {}) {
  const { products = [], categories = [], faq = [], reviews = [] } = data
  const base = { canonical: abs(path === '/' ? '/' : path), image: abs(SITE.ogImage), robots: 'index,follow', type: 'website', jsonLd: [] }
  const t = (s) => `${s} | ${SITE.name}`

  if (path === '/') {
    return {
      ...base,
      title: `${SITE.name} | تصميم متاجر سلة وصفحات هبوط وتسويق إلكتروني`,
      description: SITE.description,
      keywords: SITE.keywords,
      jsonLd: [ORG(), WEBSITE(),
        faq.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) },
      ].filter(Boolean),
    }
  }
  if (path === '/shop') {
    return {
      ...base,
      title: t('كل الخدمات: تصميم متاجر سلة وتسويق وخدمات حكومية'),
      description: clip(`كل خدمات ${SITE.name} بأسعار ثابتة: تصميم متجر سلة، صفحات هبوط، إعلانات سناب وتيك توك، ربط البكسل، سجل تجاري، وثيقة العمل الحر والتسجيل في تابي وتمارا.`),
      keywords: SITE.keywords,
      jsonLd: [crumbs([['الرئيسية', '/'], ['كل الخدمات', '/shop']]), itemList(products)],
    }
  }
  if (path === '/blog') {
    return {
      ...base,
      title: t('المدونة: مقالات تكبّر متجرك في سلة'),
      description: clip('مقالات لتجار سلة عن مميزات تصميم المتجر الاحترافي، وفوائد بكسل سناب وتيك توك وGoogle Analytics، ووثيقة العمل الحر والسجل التجاري، وتوثيق منصة الأعمال.'),
      jsonLd: [crumbs([['الرئيسية', '/'], ['المدونة', '/blog']]), {
        '@context': 'https://schema.org', '@type': 'Blog', name: `مدونة ${SITE.name}`, url: abs('/blog'), inLanguage: 'ar',
        publisher: { '@id': abs('/#org') },
        blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(blogPath(p.slug)), datePublished: p.date })),
      }],
    }
  }
  const bm = path.match(/^\/blog\/([a-z0-9-]+)$/)
  if (bm) {
    const p = POSTS.find((x) => x.slug === bm[1])
    if (!p) return { ...base, title: t('المقال غير موجود'), description: SITE.description, robots: 'noindex' }
    const img = abs(BLOG_ART[p.category] || SITE.ogImage)
    return {
      ...base,
      type: 'article',
      title: t(p.seoTitle || p.title),
      description: clip(p.description),
      keywords: p.keywords,
      image: img,
      article: { published: p.date, modified: p.updated || p.date, section: BLOG_CATEGORIES[p.category]?.name },
      jsonLd: [
        crumbs([['الرئيسية', '/'], ['المدونة', '/blog'], [p.title, blogPath(p.slug)]]),
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.description,
          image: [img],
          datePublished: p.date,
          dateModified: p.updated || p.date,
          inLanguage: 'ar',
          articleSection: BLOG_CATEGORIES[p.category]?.name,
          keywords: p.keywords,
          mainEntityOfPage: abs(blogPath(p.slug)),
          author: { '@type': 'Organization', name: SITE.name, url: abs('/') },
          publisher: { '@id': abs('/#org') },
          citation: (p.sources || []).map((x) => x.url),
        },
        p.faq?.length && { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) },
      ].filter(Boolean),
    }
  }
  const slug = path.match(/^\/([^/]+)$/)?.[1]
  const cm = slug && (data.category || categories.find((x) => x.id === slug))
  if (cm) {
    const c = cm
    const list = products.filter((p) => p.categoryId === c.id)
    return {
      ...base,
      title: t(SEO_CAT[c.id]?.[0] || c.name),
      description: clip(SEO_CAT[c.id]?.[1] || `${c.name} من ${SITE.name}: ${c.blurb || ''} ${list.slice(0, 4).map((p) => p.name).join('، ')}.`),
      image: abs(CAT_ART[c.id] || SITE.ogImage),
      jsonLd: [crumbs([['الرئيسية', '/'], ['كل الخدمات', '/shop'], [c.name, `/${c.id}`]]), itemList(list)],
    }
  }
  const pm = slug && (data.product || products.find((x) => x.id === fromSlug(slug)))
  if (pm) {
    const p = pm
    if (!p) return { ...base, title: t('الخدمة غير موجودة'), description: SITE.description, robots: 'noindex' }
    const c = categories.find((x) => x.id === p.categoryId)
    const img = abs(CAT_ART[p.categoryId] || SITE.ogImage)
    return {
      ...base,
      type: 'product',
      title: t(SEO_PRODUCT[p.id]?.[0] || p.name),
      description: clip(SEO_PRODUCT[p.id]?.[1] || p.summary || p.description || `${p.name} من ${SITE.name}.`),
      image: img,
      price: price(p),
      jsonLd: [
        crumbs([['الرئيسية', '/'], ...(c ? [[c.name, `/${c.id}`]] : []), [p.name, productPath(p.id)]]),
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: clip(p.summary || p.description || p.name, 500),
          image: [img],
          sku: toSlug(p.id),
          brand: { '@type': 'Brand', name: SITE.name },
          offers: {
            '@type': 'Offer', url: abs(productPath(p.id)), priceCurrency: 'SAR', price: String(price(p)), availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@id': abs('/#org') },
            // services are delivered online: nothing is shipped, and nothing comes back once delivered (see /policies)
            shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'SAR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'SA' } },
            hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'SA', returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted', merchantReturnLink: abs('/policies') },
          },
        },
      ],
    }
  }
  if (path === '/work') return { ...base, title: t('أعمالنا: متاجر سلة صممناها وتصاميم سوشال ميديا'), description: clip(`نماذج من أعمال ${SITE.name}: 13 متجر سلة صممناها كاملة، وبنرات وتصاميم سوشال ميديا لعملائنا. شوف شغلنا قبل ما تطلب.`), jsonLd: [crumbs([['الرئيسية', '/'], ['أعمالنا', '/work']])] }
  if (path === '/reviews') return { ...base, title: t('آراء العملاء في تصميم متاجر سلة'), description: clip(`${reviews.length} رأي مكتوب من عملاء ${SITE.name} عن تصميم متاجر سلة والخدمات، وكلها بتقييم 5 من 5.`), jsonLd: [crumbs([['الرئيسية', '/'], ['آراء العملاء', '/reviews']])] }
  if (path === '/contact') return { ...base, title: t('تواصل معنا'), description: clip(`تواصل مع ${SITE.name} على واتساب ${WA_LOCAL} أو على البريد ${SITE.email}، ونرد عليك بنفس اليوم.`), jsonLd: [ORG(), crumbs([['الرئيسية', '/'], ['تواصل معنا', '/contact']])] }
  if (path === '/policies') return { ...base, title: t('السياسات والشروط'), description: clip(`سياسة الاستخدام والإلغاء والاسترجاع والخصوصية في ${SITE.name}.`) }
  // private or transactional pages
  return { ...base, title: SITE.name, description: SITE.description, robots: 'noindex,nofollow' }
}

function itemList(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(productPath(p.id)), name: p.name })),
  }
}

/** Render the head tags as an HTML string (build-time prerender). */
export function headHtml(s) {
  const e = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return [
    `<title>${e(s.title)}</title>`,
    `<meta name="description" content="${e(s.description)}" />`,
    `<meta name="robots" content="${e(s.robots === 'index,follow' ? 'index,follow,max-image-preview:large' : s.robots)}" />`,
    ...(s.keywords ? [`<meta name="keywords" content="${e(s.keywords)}" />`] : []),
    `<link rel="canonical" href="${e(s.canonical)}" />`,
    `<meta property="og:site_name" content="${e(SITE.name)}" />`,
    `<meta property="og:locale" content="ar_SA" />`,
    `<meta property="og:type" content="${e(s.type)}" />`,
    `<meta property="og:title" content="${e(s.title)}" />`,
    `<meta property="og:description" content="${e(s.description)}" />`,
    `<meta property="og:url" content="${e(s.canonical)}" />`,
    `<meta property="og:image" content="${e(s.image)}" />`,
    `<meta property="og:image:secure_url" content="${e(s.image)}" />`,
    ...(/\/og-v2\.jpg$|\/brand\/og\//.test(s.image) ? [`<meta property="og:image:type" content="image/jpeg" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`] : []),
    `<meta property="og:image:alt" content="${e(s.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(s.title)}" />`,
    `<meta name="twitter:description" content="${e(s.description)}" />`,
    `<meta name="twitter:image" content="${e(s.image)}" />`,
    ...(s.article ? [`<meta property="article:published_time" content="${e(s.article.published)}" />`, `<meta property="article:modified_time" content="${e(s.article.modified)}" />`, `<meta property="article:section" content="${e(s.article.section)}" />`] : []),
    ...(s.price != null ? [`<meta property="product:price:amount" content="${e(s.price)}" />`, `<meta property="product:price:currency" content="SAR" />`] : []),
    ...s.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
}
