import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Quote, Star } from 'lucide-react'
import { useApp } from '@/state.jsx'
import { FAQ } from '@/data/content.js'
import { ALL_REVIEWS } from '@/data/reviews.js'
import { money, effectivePrice, liveWa } from '@/lib/format.js'
import { productPath } from '@/lib/slug.js'
import { stagesFor, stageOf } from '@/lib/route.js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import Icon from '@/components/Icon.jsx'
import LineArt from '@/components/home/LineArt.jsx'
import ServiceTicket from '@/components/home/ServiceTicket.jsx'
import GalleryWall from '@/components/atelier/GalleryWall.jsx'
import PayIcons from '@/components/brand/PayIcons.jsx'

const ART = '/brand/ai'

/** linkProps: an internal path opens in the store, an https address in a new tab. */
const linkTo = (link) => (!link ? {} : /^https:/i.test(link) ? { href: liveWa(link) } : { to: link })
const Go = ({ link, className, children }) => {
  const l = linkTo(link)
  return l.to ? <Link to={l.to} className={className}>{children}</Link> : l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a> : <span className={className}>{children}</span>
}

/** A section heading in the display voice: large, light, nothing stacked above it. */
function Heading({ title, text, className, center }) {
  if (!title) return null
  return (
    <div className={cn('container-w mb-9 sm:mb-12', center ? 'text-center' : 'text-start', className)}>
      <h2 className="text-balance font-display text-[2rem] font-light leading-[1.35] text-foreground sm:text-[2.8rem]">{title}</h2>
      {text && <p className={cn('mt-3 max-w-xl text-[15.5px] leading-8 text-muted-foreground', center && 'mx-auto')}>{text}</p>}
    </div>
  )
}

const ViewAll = ({ to, children = 'عرض الكل' }) => (
  <Link to={to} className="group inline-flex min-h-11 items-center gap-2 border-b border-[var(--border-strong)] pb-1 text-[14.5px] font-medium text-foreground transition-colors hover:border-[var(--primary)]">
    {children}<ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
  </Link>
)

/* ================= The route panel: four stages, one lit at a time ================= */
function useAutoAdvance(count, ms = 4800) {
  const [i, setI] = useState(0)
  const held = useRef(false)
  useEffect(() => {
    if (count < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => { if (!held.current && document.visibilityState === 'visible') setI((x) => (x + 1) % count) }, ms)
    return () => clearInterval(t)
  }, [count, ms])
  return [i, (n) => { held.current = true; setI(n) }, held]
}

function RoutePanel({ stages }) {
  const [active, pick, held] = useAutoAdvance(stages.length)
  if (!stages.length) return null
  const s = stages[active]
  return (
    <div className="rim plate relative rounded-[30px] p-5 sm:p-7" onMouseEnter={() => { held.current = true }} onMouseLeave={() => { held.current = false }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[17px] font-normal text-foreground sm:text-[19px]">من الصفر لأول طلب</p>
        <span className="tabular text-[12.5px] text-muted-foreground">{stages.length} مراحل</span>
      </div>

      <ol className="relative mt-5 grid gap-1">
        <span className="route-line absolute inset-y-4 start-[21px] w-px" aria-hidden="true" />
        {stages.map((st, i) => {
          const on = i === active
          return (
            <li key={st.category} className="relative">
              <button type="button" onClick={() => pick(i)} aria-pressed={on} aria-controls="route-detail"
                className={cn('group flex w-full items-center gap-4 rounded-2xl py-2.5 pe-3 ps-1.5 text-start transition-colors duration-300', on ? 'bg-[color-mix(in_srgb,var(--primary)_7%,transparent)]' : 'hover:bg-[color-mix(in_srgb,var(--primary)_4%,transparent)]')}>
                <span className={cn('relative z-10 grid size-[30px] shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular transition-[background-color,color,box-shadow] duration-500',
                  on ? 'bg-primary text-primary-foreground shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_14%,transparent),0_0_22px_color-mix(in_srgb,var(--primary)_55%,transparent)]' : 'bg-[var(--surface-sunken)] text-muted-foreground ring-1 ring-[var(--border-strong)]')}>{st.n}</span>
                <span className="min-w-0 flex-1">
                  <b className={cn('block font-display text-[15.5px] font-medium transition-colors', on ? 'text-foreground' : 'text-foreground/75')}>{st.title}</b>
                  <span className="block truncate text-[12.5px] text-muted-foreground">{st.cat.name}</span>
                </span>
                <span className="tabular shrink-0 text-end text-[12px] leading-tight text-muted-foreground">من<b className="block font-display text-[15px] font-normal text-foreground">{money(st.from)}</b></span>
              </button>
            </li>
          )
        })}
      </ol>

      <div id="route-detail" aria-live="polite" className="mt-4 border-t border-[var(--border)] pt-4">
        <p key={s.category} className="text-[13.5px] leading-7 text-muted-foreground motion-safe:animate-[rise-in_520ms_var(--p-ease-emphasized)_both]">{s.line}</p>
        <ul key={s.category + 'l'} className="mt-3 grid gap-1.5 motion-safe:animate-[rise-in_620ms_var(--p-ease-emphasized)_both]">
          {s.items.slice(0, 3).map((p) => (
            <li key={p.id}>
              <Link to={productPath(p.id)} className="group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-[14px] text-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]">
                <span className="truncate">{p.name}</span>
                <span className="tabular flex shrink-0 items-center gap-2 text-muted-foreground">{money(effectivePrice(p))}<ArrowLeft className="size-3.5 opacity-0 transition-[opacity,translate] group-hover:-translate-x-0.5 group-hover:opacity-100" /></span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to={`/${s.category}`} className="mt-3 inline-flex min-h-11 items-center gap-2 px-3 text-[13.5px] font-medium text-foreground underline decoration-[var(--border-strong)] underline-offset-[6px] hover:decoration-[var(--primary)]">
          كل خدمات «{s.title}» ({s.items.length})<ArrowLeft className="size-4" />
        </Link>
      </div>
    </div>
  )
}

/* ================= Hero ================= */
function Hero({ b: h, first }) {
  const { settings, categories, products } = useApp()
  const stages = useMemo(() => stagesFor(categories, products), [categories, products])
  const H = first ? 'h1' : 'h2'
  return (
    <section className={cn('relative isolate overflow-hidden', first && '-mt-[var(--header-height)]')}>
      {/* the night field: one cold light from above, and the route drawn across it in silver */}
      <span className="absolute inset-0 -z-20 bg-[radial-gradient(70%_60%_at_70%_-10%,color-mix(in_srgb,var(--p-gold-400)_16%,transparent),transparent_70%),radial-gradient(60%_50%_at_10%_110%,color-mix(in_srgb,var(--p-green-700)_45%,transparent),transparent_70%),linear-gradient(180deg,var(--night-0),var(--night-1))]" aria-hidden="true" />
      {h.image && <img src={h.image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-25 mix-blend-luminosity" />}
      <svg className="pointer-events-none absolute inset-0 -z-10 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="rt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c3cedd" stopOpacity="0" /><stop offset=".5" stopColor="#c3cedd" stopOpacity=".35" /><stop offset="1" stopColor="#c3cedd" stopOpacity="0" /></linearGradient>
        </defs>
        <path d="M-40 760 C 260 700, 380 520, 640 540 S 1080 700, 1180 420 S 1360 120, 1500 80" fill="none" stroke="url(#rt)" strokeWidth="1.2" />
        <path d="M-40 760 C 260 700, 380 520, 640 540 S 1080 700, 1180 420 S 1360 120, 1500 80" fill="none" stroke="#f6f8fc" strokeWidth="2" strokeLinecap="round" pathLength="100" strokeDasharray="6 94"
          className="motion-safe:animate-[route-run_9s_cubic-bezier(.45,0,.25,1)_infinite]" style={{ filter: 'drop-shadow(0 0 6px rgb(255 255 255 / .9))' }} />
        {[[640, 540], [1180, 420]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" fill="#f6f8fc" opacity=".7" />)}
      </svg>

      <div className={cn('container-w grid items-center gap-10 pb-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pb-24', first ? 'pt-[calc(var(--header-height)+40px)] lg:pt-[calc(var(--header-height)+72px)]' : 'pt-20')}>
        <div className="text-center lg:text-start">
          <H className="font-display text-[2.6rem] font-light leading-[1.25] text-foreground sm:text-[3.6rem] lg:text-[4.4rem] lg:leading-[1.18]">
            {first && settings.store.name === 'منصة رائد' && <span className="sr-only">تصميم متاجر سلة في السعودية: </span>}
            <span className="block">{h.title1}</span>
            {h.title2 && <span className="block text-[var(--silver)]">{h.title2}</span>}
          </H>
          {h.text && <p className="mx-auto mt-6 max-w-[34ch] text-[16.5px] leading-[1.95] text-muted-foreground sm:text-[17.5px] lg:mx-0">{h.text}</p>}
          <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild size="lg" className="px-8 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.4)_inset]">
              {/^https:/i.test(h.ctaLink) ? <a href={liveWa(h.ctaLink)} target="_blank" rel="noopener noreferrer">{h.cta}<ArrowLeft className="size-4" /></a> : <Link to={h.ctaLink}>{h.cta}<ArrowLeft className="size-4" /></Link>}
            </Button>
            <Button asChild size="lg" variant="outline" className="px-7 font-medium"><Link to="/work">شوف أعمالنا</Link></Button>
          </div>
          {h.showStats && (
            <Link to="/reviews" className="mt-9 inline-flex items-center gap-3 text-[14px] text-muted-foreground transition-colors hover:text-foreground">
              <span className="flex items-center gap-0.5 text-[var(--silver)]">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" strokeWidth={0} />)}</span>
              <span><b className="tabular font-semibold text-foreground">5.0</b> من تقييمات عملائنا في سلة</span>
            </Link>
          )}
        </div>
        <RoutePanel stages={stages} />
      </div>
    </section>
  )
}

/* ================= A stage of the route: a category shelf hung on the silver line ================= */
function Station({ b, stage, items }) {
  const to = b.viewAllTo || `/${stage.category}`
  return (
    <section className="cv-auto relative py-14 sm:py-20">
      <div className="container-w grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-14">
        <div className="relative lg:sticky lg:top-[calc(var(--header-height)+32px)] lg:self-start">
          <div className="flex items-start gap-4">
            <span className="relative mt-1 grid size-11 shrink-0 place-items-center rounded-full bg-primary font-display text-[17px] font-normal text-primary-foreground shadow-[0_0_0_7px_color-mix(in_srgb,var(--primary)_10%,transparent),0_0_30px_color-mix(in_srgb,var(--primary)_40%,transparent)]">
              <span className="tabular">{stage.n}</span>
            </span>
            <div className="min-w-0">
              <h2 className="text-balance font-display text-[1.8rem] font-light leading-[1.3] text-foreground sm:text-[2.1rem]">{b.title || stage.title}</h2>
              <p className="mt-1 font-display text-[15px] text-[var(--silver)]">{stage.title}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-[15px] leading-8 text-muted-foreground">{stage.line}</p>
          <p className="tabular mt-4 text-[13.5px] text-muted-foreground">تبدأ من <b className="font-display text-[18px] font-normal text-foreground">{money(stage.from)}</b></p>
          {b.viewAll && <div className="mt-5"><ViewAll to={to}>كل خدمات المرحلة ({stage.items.length})</ViewAll></div>}
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-6">
          {items.map((p) => <li key={p.id}><ServiceTicket p={p} /></li>)}
        </ul>
      </div>
    </section>
  )
}

/** Products the owner picked (or the newest / featured): the opening shelf, wide plates in one row. */
function ProductsBlock({ b }) {
  const { products, categories, byId, catalogReady } = useApp()
  const stages = useMemo(() => stagesFor(categories, products), [categories, products])
  if (!catalogReady) return <div className="container-w grid grid-cols-2 gap-5 py-16 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-[22px] bg-[var(--surface)]" />)}</div>
  const list = b.source === 'picked' ? b.ids.map((id) => byId[id]).filter(Boolean)
    : b.source === 'category' ? products.filter((p) => p.categoryId === b.category)
      : b.source === 'featured' ? products.filter((p) => p.featured)
        : [...products].sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')))
  const items = list.slice(0, b.limit)
  if (!items.length) return null
  const n = b.source === 'category' ? stageOf(stages, b.category) : 0
  if (n) return <Station b={b} stage={stages.find((s) => s.n === n)} items={items} />
  return (
    <section className="cv-auto py-14 sm:py-20">
      <div className="container-w mb-9 flex flex-wrap items-end justify-between gap-4 sm:mb-12">
        <h2 className="text-balance font-display text-[2rem] font-light leading-[1.35] text-foreground sm:text-[2.8rem]">{b.title}</h2>
        {b.viewAll && <ViewAll to={b.viewAllTo || '/shop'} />}
      </div>
      <ul className="container-w grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {items.map((p) => <li key={p.id}><ServiceTicket p={p} /></li>)}
      </ul>
    </section>
  )
}

/* ================= Promise strip: true facts on one silver rule ================= */
function Promises({ b }) {
  if (!b.items.length) return null
  return (
    <section className="container-w">
      <ul className={cn('grid gap-y-6 border-y border-[var(--border)] py-7 sm:py-8', ['grid-cols-1', 'grid-cols-2', 'grid-cols-1 sm:grid-cols-3', 'grid-cols-2 sm:grid-cols-4'][b.items.length - 1])}>
        {b.items.map((x, i) => (
          <li key={x.title + i} className={cn('flex items-center justify-center gap-4 px-4 text-start', i > 0 && 'sm:border-s sm:border-[var(--border)]')}>
            <LineArt name={x.icon} tone="green" className="size-11 shrink-0 text-[var(--silver)]" delay={i * 0.15} />
            <span><b className="block font-display text-[15px] font-medium text-foreground">{x.title}</b><span className="text-[13px] text-muted-foreground">{x.text}</span></span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ================= Picture with words ================= */
const BUILT_IN = /^\/brand\/ai\/raed-(landing|installments)\.webp$/
function ImageTextBlock({ b }) {
  const { byId } = useApp()
  const p = b.priceOf && byId[b.priceOf]
  const img = b.image || `${ART}/raed-landing.webp`
  return (
    <section className="cv-auto container-w py-12 sm:py-16">
      <Go link={b.link} className="rim plate group grid items-center overflow-hidden rounded-[34px] sm:grid-cols-[1.05fr_0.95fr]">
        <span className="relative block aspect-[16/10] overflow-hidden sm:aspect-auto sm:h-full sm:min-h-[400px]">
          <img src={img} srcSet={BUILT_IN.test(img) ? `${img.replace('.webp', '-800.webp')} 800w, ${img} 1600w` : undefined} sizes="(max-width: 640px) 92vw, 55vw" alt="" loading="lazy" decoding="async"
            className="size-full object-cover transition-transform duration-[2.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          <span className="absolute inset-0 bg-[linear-gradient(0deg,var(--plate-end,var(--surface)),transparent_45%)] sm:bg-[linear-gradient(270deg,var(--plate-end,var(--surface)),transparent_40%)]" aria-hidden="true" />
        </span>
        <span className="relative flex flex-col p-6 sm:p-10 lg:p-14">
          <span className="text-balance font-display text-[1.9rem] font-light leading-[1.3] text-foreground sm:text-[2.5rem]">{b.title}{b.accent && <span className="block text-[var(--silver)]">{b.accent}</span>}</span>
          {b.text && <span className="mt-4 max-w-md text-[15.5px] leading-8 text-muted-foreground">{b.text}</span>}
          {b.kicker && <span className="mt-3 text-[14px] text-muted-foreground">{b.kicker}</span>}
          <span className="mt-7 flex flex-wrap items-center gap-5">
            {b.cta && <span className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[14.5px] font-semibold text-primary-foreground transition-transform group-hover:-translate-y-0.5">{b.cta}<ArrowLeft className="size-4" /></span>}
            {p && <span className="tabular font-display text-[22px] font-light text-foreground">{money(effectivePrice(p))}</span>}
          </span>
          {b.payIcons && <PayIcons className="mt-6 w-full max-w-[420px]" />}
        </span>
      </Go>
    </section>
  )
}

function BannerBlock({ b }) {
  if (!b.image) return null
  return (
    <section className={cn('py-6 sm:py-8', b.size === 'container' && 'container-w')}>
      <Go link={b.link} className={cn('block overflow-hidden', b.size === 'container' && 'rim rounded-[28px]')}>
        <picture>
          {b.imageMobile && <source media="(max-width: 767px)" srcSet={b.imageMobile} />}
          <img src={b.image} alt={b.alt || ''} loading="lazy" decoding="async" className="block h-auto w-full" />
        </picture>
      </Go>
    </section>
  )
}

function TextBlock({ b }) {
  const l = linkTo(b.link)
  return (
    <section className={cn('container-w mx-auto max-w-3xl py-14 sm:py-20', b.align === 'center' ? 'text-center' : 'text-start')}>
      {b.title && <h2 className="text-balance font-display text-[2rem] font-light leading-[1.35] text-foreground sm:text-[2.6rem]">{b.title}</h2>}
      {b.text && <p className="mt-5 whitespace-pre-line text-[16px] leading-[2] text-muted-foreground">{b.text}</p>}
      {b.cta && (l.to || l.href) && <div className="mt-8"><Button asChild size="lg" className="px-8"><Go link={b.link}>{b.cta}<ArrowLeft className="size-4" /></Go></Button></div>}
    </section>
  )
}

/* ================= The route as a map: every category, the first one large ================= */
const CAT_ART = {
  'design-services': 'raed-cat-design.webp',
  'marketing-services': 'raed-cat-marketing.webp',
  subscriptions: 'raed-cat-subscriptions.webp',
  'government-services': 'raed-cat-government.webp',
}
function CategoriesBlock({ b }) {
  const { categories, products, settings } = useApp()
  const stages = useMemo(() => stagesFor(categories, products), [categories, products])
  const ordered = [...categories].sort((x, y) => (stageOf(stages, x.id) || 99) - (stageOf(stages, y.id) || 99))
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Heading title={b.title} />
      <ul className="container-w grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {ordered.map((c) => {
          const n = stageOf(stages, c.id)
          const count = products.filter((p) => p.categoryId === c.id).length
          const art = settings.categoryImages[c.id] || (CAT_ART[c.id] && `${ART}/${CAT_ART[c.id]}`)
          return (
            <li key={c.id}>
              <Link to={`/${c.id}`} className="rim group relative block aspect-[3/4] overflow-hidden rounded-[26px] bg-[var(--night-2)] shadow-[var(--shadow-plate)] sm:aspect-[4/5]">
                {art
                  ? <img src={art} srcSet={!settings.categoryImages[c.id] && CAT_ART[c.id] ? `${ART}/${CAT_ART[c.id].replace('.webp', '-480.webp')} 480w, ${art} 900w` : undefined} sizes="(max-width: 1024px) 46vw, 300px" alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-[scale,filter] duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06] group-hover:brightness-110" />
                  : <span className="absolute inset-0 grid place-items-center text-[var(--silver)]"><Icon name={c.icon} size={40} /></span>}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,color-mix(in_srgb,var(--night-0)_92%,transparent))]" aria-hidden="true" />
                {n > 0 && <span className="tabular absolute top-3.5 start-3.5 grid size-9 place-items-center rounded-full bg-[var(--silver-hi)] font-display text-[14px] text-[var(--night-1)]">{n}</span>}
                <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <b className="block font-display text-[16px] font-normal leading-snug sm:text-[19px]">{c.name}</b>
                  <span className="tabular mt-1 flex items-center justify-between text-[12.5px] text-white/70">{count} خدمات<ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" /></span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ================= Reviews: published Salla words, drifting in two rows ================= */
function ReviewRow({ items, reverse }) {
  const [live, setLive] = useState(false)
  useEffect(() => setLive(true), [])
  const row = live ? [...items, ...items] : items
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_8%,black_92%,transparent)]">
      <ul className={cn('flex w-max shrink-0 gap-4 py-3', live && 'motion-safe:animate-[marquee_160s_linear_infinite] group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]', reverse && '[animation-direction:reverse]')}>
        {row.map((r, i) => (
          <li key={i} aria-hidden={i >= items.length || undefined} className="w-[285px] shrink-0 sm:w-[350px]">
            <figure className="rim plate flex h-full flex-col rounded-[22px] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="flex gap-0.5 text-[var(--silver)]">{[0, 1, 2, 3, 4].map((k) => <Star key={k} className="size-3.5 fill-current" strokeWidth={0} />)}</span>
                <Quote className="size-5 text-[var(--silver)] opacity-40" strokeWidth={1.3} />
              </div>
              <blockquote className="mt-4 line-clamp-4 flex-1 text-[14.5px] leading-7 text-foreground/90">{r.text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-4 text-[12.5px]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-sunken)] font-display text-[14px] text-foreground ring-1 ring-[var(--border-strong)]">{r.name.charAt(0)}</span>
                <span className="min-w-0"><b className="block truncate font-semibold text-foreground">{r.name}</b>{r.city && <span className="text-muted-foreground">{r.city}</span>}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Reviews({ b }) {
  const short = ALL_REVIEWS.filter((r) => r.text.length < 170).slice(0, 20)
  const half = Math.ceil(short.length / 2)
  return (
    <section className="cv-auto py-14 sm:py-20">
      <Heading title={b.title} center text={`${ALL_REVIEWS.length} رأي منشور في متجرنا على سلة، كلها خمس نجوم.`} />
      <div className="grid gap-2">
        <ReviewRow items={short.slice(0, half)} />
        <ReviewRow items={short.slice(half)} reverse />
      </div>
      <div className="mt-10 text-center"><ViewAll to="/reviews">كل الآراء ({ALL_REVIEWS.length})</ViewAll></div>
    </section>
  )
}

function FaqBlock({ b }) {
  return (
    <section className="cv-auto container-w grid gap-8 py-16 sm:py-24 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
      <div>
        <h2 className="text-balance font-display text-[2rem] font-light leading-[1.35] text-foreground sm:text-[2.8rem]">{b.title}</h2>
        <p className="mt-3 max-w-xs text-[15px] leading-8 text-muted-foreground">ما لقيت جوابك؟ اسألنا على واتساب ونرد عليك بنفس اليوم.</p>
      </div>
      <Accordion type="single" collapsible className="grid gap-3">
        {FAQ.map((q, i) => (
          <AccordionItem key={q.q} value={String(i)} className="rim rounded-[18px] border-0">
            <AccordionTrigger className="font-medium">{q.q}</AccordionTrigger>
            <AccordionContent>{q.a} {q.link && <Link className="font-semibold text-foreground underline underline-offset-4" to={q.link}>السياسات والشروط</Link>}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

const RENDER = {
  hero: Hero, banner: BannerBlock, promises: Promises, products: ProductsBlock, categories: CategoriesBlock,
  imageText: ImageTextBlock, text: TextBlock, gallery: ({ b }) => <GalleryWall title={b.title} text={b.text} />, reviews: Reviews, faq: FaqBlock,
}

// The home page is the owner's list of blocks (store designer), drawn on the night route.
export default function Home() {
  const { settings } = useApp()
  const blocks = settings.home.filter((b) => b.on)
  const top = blocks[0]?.type === 'hero' ? blocks[0] : null
  const rest = top ? blocks.slice(1) : blocks
  return (
    <div className="night relative isolate bg-background">
      {top ? <div data-block={top.id}><Hero b={top} first /></div> : <h1 className="sr-only">{settings.home.find((b) => b.type === 'hero')?.title1 || 'الرئيسية'}</h1>}
      <div className={cn('relative', !top && 'pt-[calc(var(--header-height)+24px)]')}>
        {/* the route keeps going down the page: one silver hairline on the start side, lit where you are */}
        <span className="route-line pointer-events-none absolute inset-y-0 start-[max(16px,calc((100%-var(--container))/2-28px))] hidden w-px lg:block" aria-hidden="true">
          <span className="route-glow absolute inset-x-0 top-0 h-40 motion-safe:[animation:route-follow_linear_both] motion-safe:[animation-timeline:scroll(root)]" />
        </span>
        {rest.map((b) => {
          const C = RENDER[b.type]
          return <div key={b.id} data-block={b.id}><C b={b} /></div>
        })}
      </div>
    </div>
  )
}
