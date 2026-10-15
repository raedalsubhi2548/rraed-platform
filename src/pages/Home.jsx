import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Quote } from 'lucide-react'
import { useApp } from '@/state.jsx'
import { FAQ } from '@/data/content.js'
import { ALL_REVIEWS } from '@/data/reviews.js'
import { money, effectivePrice, liveWa } from '@/lib/format.js'
import { cn } from '@/lib/utils'
import StarsSvg from '@/components/brand/Stars.jsx'
const Stars = (p) => <StarsSvg size={14} {...p} />
import { useInView } from '@/lib/useInView.js'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import Icon from '@/components/Icon.jsx'
import LineArt from '@/components/home/LineArt.jsx'
import ServiceTicket from '@/components/home/ServiceTicket.jsx'
import GalleryWall from '@/components/atelier/GalleryWall.jsx'
import { SectionTitle } from '@/components/brand/Ornaments.jsx'
import PayIcons from '@/components/brand/PayIcons.jsx'
import Vine from '@/components/brand/Vine.jsx'


/** Fades/rises its children in once, when scrolled into view. */
function Reveal({ as: T = 'div', className, delay = 0, children, ...p }) {
  const [ref, on] = useInView()
  return <T ref={ref} className={cn('transition-[opacity,translate,scale] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]', on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', className)} style={{ transitionDelay: `${delay}ms` }} {...p}>{children}</T>
}

function Head({ eyebrow, title }) {
  return (
    <Reveal className="mb-8 text-center sm:mb-12">
      {eyebrow && <p className="mb-1 text-[14px] font-medium text-primary/55">{eyebrow}</p>}
      <h2 className="text-balance font-display text-[2.1rem] font-bold leading-[1.45] text-primary sm:text-[2.75rem]">{title}</h2>
    </Reveal>
  )
}

function Title({ eyebrow, title, className }) {
  if (!title && !eyebrow) return null
  return <Reveal className={cn('container-w', className)}><SectionTitle eyebrow={eyebrow} title={title} /></Reveal>
}

const ViewAll = ({ to, children = 'عرض الكل' }) => (
  <div className="mt-10 text-center">
    <Button asChild variant="outline" className="font-medium"><Link to={to}>{children}<ArrowLeft className="size-4" /></Link></Button>
  </div>
)

/** Products as covers on a shelf. */
function Shelf({ items }) {
  return (
    <ul className="mx-auto grid max-w-[980px] grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
      {items.map((p, i) => <Reveal as="li" key={p.id} delay={(i % 4) * 90}><ServiceTicket p={p} className="h-full" /></Reveal>)}
    </ul>
  )
}

/* ---------------- Hero: a cinematic scene (our own AI art) merged with the header ---------------- */
const DUST = Array.from({ length: 16 }, (_, i) => ({ l: (i * 61) % 100, t: 20 + ((i * 37) % 70), d: 8 + (i % 5) * 1.8, w: i * 0.9, s: 2 + (i % 3) }))
const ART = '/brand/ai'

function Hero({ b: h, first }) {
  const { settings } = useApp()
  const H = first ? 'h1' : 'h2'
  return (
    <section className={cn('relative isolate overflow-hidden bg-[var(--p-green-950)] text-on-inverse', first && '-mt-[var(--header-height)]')}>
      {/* the scene */}
      <picture className="absolute inset-0 -z-10">
        <source media="(max-width: 767px)" srcSet={h.imageMobile || h.image || `${ART}/raed-hero-mobile-v3.webp`} />
        <img src={h.image || `${ART}/raed-hero-v3.webp`} alt={h.image ? h.title1 : 'تصميم متاجر سلة من منصة رائد على الجوال واللابتوب'} width="2800" height="1188" fetchpriority="high"
          className="size-full object-cover object-[50%_100%] md:object-[0%_50%] motion-safe:animate-[kenburns_28s_ease-in-out_infinite_alternate]" />
      </picture>
      {/* melt the scene into the header (top), the text side, and the page (bottom) */}
      <span className="absolute inset-x-0 top-0 -z-10 h-48 bg-[linear-gradient(var(--p-green-950),transparent)]" aria-hidden="true" />
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--p-green-950)_95%,transparent)_0%,color-mix(in_srgb,var(--p-green-950)_82%,transparent)_42%,transparent_68%)] md:bg-[linear-gradient(270deg,color-mix(in_srgb,var(--p-green-950)_90%,transparent)_0%,color-mix(in_srgb,var(--p-green-950)_55%,transparent)_38%,transparent_62%)]" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 opacity-0 bg-[linear-gradient(100deg,transparent,rgb(230_238_250/0.10),transparent)] motion-safe:animate-[sweep_9s_ease-in-out_infinite]" aria-hidden="true" />
      {DUST.map((d, i) => (
        <span key={i} className="pointer-events-none absolute -z-10 rounded-full bg-[var(--p-cream-200)]/60 motion-safe:animate-[dust_var(--d)_linear_infinite]" style={{ left: `${d.l}%`, top: `${d.t}%`, width: d.s, height: d.s, '--d': `${d.d}s`, '--dx': `${(i % 2 ? 1 : -1) * (10 + i * 2)}px`, animationDelay: `${d.w}s` }} aria-hidden="true" />
      ))}

      <div className={cn('container-w relative flex min-h-[640px] flex-col justify-start pb-[42vh] sm:min-h-[720px] md:min-h-[min(92vh,820px)] md:justify-center md:pb-32', first ? 'pt-[calc(var(--header-height)+92px)] md:pt-[calc(var(--header-height)+40px)]' : 'pt-24 md:pt-16')}>
        <div className="mx-auto max-w-[560px] text-center md:ms-0 md:me-auto md:text-start lg:ms-[2%]">
          <p className="inline-flex items-center gap-3 text-[14px] font-medium text-on-inverse/70 motion-safe:animate-[rise-in-solid_700ms_var(--p-ease-emphasized)_both]">
            <span className="h-px w-10 bg-[linear-gradient(90deg,transparent,rgb(251_252_254/0.6))]" />{h.eyebrow}<span className="h-px w-10 bg-[linear-gradient(270deg,transparent,rgb(251_252_254/0.6))] md:hidden" />
          </p>
          <H className="mt-5 font-display text-[2.35rem] font-bold leading-[1.35] sm:text-[3rem] lg:text-[3.6rem] lg:leading-[1.3] motion-safe:animate-[rise-in-solid_850ms_var(--p-ease-emphasized)_both]">
            {first && settings.store.name === 'منصة رائد' && <span className="sr-only">تصميم متاجر سلة في السعودية: </span>}
            <span className="block">{h.title1}</span>
            {h.title2 && <span className="block font-light text-[var(--p-cream-200)]">{h.title2}</span>}
          </H>
          <p className="mx-auto mt-5 max-w-[30ch] text-[17px] sm:max-w-[34ch] leading-[1.9] text-on-inverse/85 [text-shadow:0_1px_12px_color-mix(in_srgb,var(--p-green-950)_90%,transparent)] md:mx-0 motion-safe:animate-[rise-in-solid_1s_var(--p-ease-emphasized)_both]">{h.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start motion-safe:animate-[rise-in-solid_1.15s_var(--p-ease-emphasized)_both]">
            <Button asChild size="lg" className="bg-background px-8 font-semibold text-primary shadow-[0_16px_34px_-14px_rgb(0_0_0/0.6)] hover:bg-white">{/^https:/i.test(h.ctaLink) ? <a href={liveWa(h.ctaLink)} target="_blank" rel="noopener noreferrer">{h.cta}<ArrowLeft className="size-4" /></a> : <Link to={h.ctaLink}>{h.cta}<ArrowLeft className="size-4" /></Link>}</Button>
            <Button asChild size="lg" variant="inverse" className="px-7 font-medium backdrop-blur"><Link to="/work">شوف أعمالنا</Link></Button>
          </div>
          {h.showStats && <div className="mt-8 flex justify-center md:justify-start motion-safe:animate-[rise-in-solid_1.3s_var(--p-ease-emphasized)_both]">
            <Link to="/reviews" className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-[var(--p-green-950)]/55 py-2 ps-2 pe-4 text-[13px] sm:gap-4 sm:py-2.5 sm:ps-3 sm:pe-5 text-white shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-[var(--p-green-950)]/70 sm:text-[15.5px]">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-primary sm:gap-2 sm:px-3">
                <b className="tabular text-[15px] font-bold leading-none sm:text-[19px]">5.0</b><StarsSvg size={13} />
              </span>
              <span className="leading-tight">تقييم عملائنا</span>
              <span className="h-5 w-px bg-white/30 sm:h-6" />
              <span className="flex items-baseline gap-1.5 leading-tight"><b dir="ltr" className="tabular text-[16px] font-bold sm:text-[21px]">+200</b>طلب نفّذناه</span>
            </Link>
          </div>}
        </div>
      </div>

      {/* melt softly into the cream page — no hard edge */}
      <span className="pointer-events-none absolute inset-x-0 -bottom-px h-48 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--background)_70%,transparent)_45%,var(--background)_82%)] sm:h-72" aria-hidden="true" />
    </section>
  )
}

/** A scene that dissolves into the page: the picture melts at every edge, our words sit beside it on the same cream. */
const BUILT_IN = /^\/brand\/ai\/raed-(landing|installments)\.webp$/
function SceneBanner({ img, to, href, kicker, title, accent, body, cta, extra }) {
  const inner = (
    <>
      <span className="relative block aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:h-full">
        <img src={img} srcSet={BUILT_IN.test(img) ? `${img.replace('.webp', '-800.webp')} 800w, ${img} 1600w` : undefined} sizes="(max-width: 640px) 92vw, 50vw" alt="" loading="lazy" decoding="async"
          className="size-full object-cover object-left transition-transform duration-[2s] ease-[cubic-bezier(.16,1,.3,1)] [mask-image:radial-gradient(ellipse_62%_62%_at_50%_50%,black_38%,transparent_100%)] group-hover:scale-[1.04]" />
      </span>
      <div className="relative flex flex-col justify-center px-2 pb-4 sm:py-10">
        <span className="text-[14px] font-medium text-primary/60">{kicker}</span>
        <h2 className="mt-2 font-display text-[2rem] font-bold leading-[1.45] text-primary sm:text-[2.5rem]"><span className="block">{title}</span>{accent && <span className="block font-normal text-primary/60">{accent}</span>}</h2>
        {body && <p className="mt-2 max-w-md text-[15px] leading-[1.9] text-muted-foreground">{body}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {cta && <span className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-on-inverse shadow-[0_14px_30px_-14px_color-mix(in_srgb,var(--p-green-900)_70%,transparent)] transition-transform group-hover:-translate-y-0.5">{cta}<ArrowLeft className="size-4" /></span>}
          {extra}
        </div>
      </div>
    </>
  )
  const cls = 'group relative grid items-center gap-2 sm:min-h-[360px] sm:grid-cols-[0.9fr_1.1fr]'
  return (
    <Reveal className="container-w mx-auto max-w-[1100px] py-4">
      {to ? <Link to={to} className={cls}>{inner}</Link> : href ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a> : <div className={cls}>{inner}</div>}
    </Reveal>
  )
}

/** linkProps: an internal path opens in the store, an https address in a new tab. */
const linkTo = (link) => (!link ? {} : /^https:/i.test(link) ? { href: liveWa(link) } : { to: link })

function ImageTextBlock({ b }) {
  const { byId } = useApp()
  const p = b.priceOf && byId[b.priceOf]
  const extra = (p || b.payIcons) && <>{p && <span className="tabular text-xl font-semibold text-primary">{money(effectivePrice(p))}</span>}{b.payIcons && <PayIcons className="w-full max-w-[460px]" />}</>
  return <SceneBanner img={b.image || `${ART}/raed-landing.webp`} {...linkTo(b.link)} kicker={b.kicker} title={b.title} accent={b.accent} body={b.text} cta={b.cta} extra={extra} />
}

function BannerBlock({ b }) {
  if (!b.image) return null
  const pic = (
    <picture>
      {b.imageMobile && <source media="(max-width: 767px)" srcSet={b.imageMobile} />}
      <img src={b.image} alt={b.alt || ''} loading="lazy" decoding="async" className={cn('block h-auto w-full', b.size === 'container' && 'rounded-[20px]')} />
    </picture>
  )
  const l = linkTo(b.link)
  const body = l.to ? <Link to={l.to} className="block">{pic}</Link> : l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="block">{pic}</a> : pic
  return <Reveal className={cn('py-4 sm:py-6', b.size === 'container' && 'container-w mx-auto max-w-[1100px]')}>{body}</Reveal>
}

function TextBlock({ b }) {
  const l = linkTo(b.link)
  return (
    <section className={cn('container-w mx-auto max-w-3xl py-12 sm:py-16', b.align === 'center' ? 'text-center' : 'text-start')}>
      <Reveal>
        {b.eyebrow && <p className="mb-1 text-[14px] font-medium text-primary/55">{b.eyebrow}</p>}
        {b.title && <h2 className="text-balance font-display text-[2rem] font-bold leading-[1.45] text-primary sm:text-[2.5rem]">{b.title}</h2>}
        {b.text && <p className="mt-4 whitespace-pre-line text-[16px] leading-[2] text-muted-foreground">{b.text}</p>}
        {b.cta && (l.to || l.href) && (
          <div className="mt-7">
            <Button asChild size="lg" className="px-7">{l.to ? <Link to={l.to}>{b.cta}<ArrowLeft className="size-4" /></Link> : <a href={l.href} target="_blank" rel="noopener noreferrer">{b.cta}<ArrowLeft className="size-4" /></a>}</Button>
          </div>
        )}
      </Reveal>
    </section>
  )
}

/* ---------------- Promise strip (true facts only) ---------------- */
function Promises({ b, afterHero }) {
  const items = b.items.map((x) => ({ art: x.icon, t: x.title, d: x.text }))
  if (!items.length) return null
  return (
    <section className={cn('container-w relative z-10', afterHero ? '-mt-16 sm:-mt-24' : 'py-6')}>
      <ul className={cn('mx-auto grid max-w-4xl gap-2 px-1 py-4 sm:px-6', ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-2 sm:grid-cols-4'][items.length - 1])}>
        {items.map((x, i) => (
          <Reveal as="li" key={x.t} delay={i * 100} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-start">
            <LineArt name={x.art} tone="green" className="size-10 shrink-0 text-primary sm:size-12" delay={i * 0.15} />
            <span><b className="block text-[13px] font-semibold text-primary sm:text-[15px]">{x.t}</b><span className="text-[11.5px] text-muted-foreground sm:text-sm">{x.d}</span></span>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}


/* ---------------- Store sections ---------------- */
const CAT_ART = {
  'design-services': 'raed-cat-design.webp',
  'marketing-services': 'raed-cat-marketing.webp',
  subscriptions: 'raed-cat-subscriptions.webp',
  'government-services': 'raed-cat-government.webp',
}
/** All categories as one still bento: a large tile locked together with four smaller ones, nothing scrolls. */
function Categories() {
  const { categories, products, settings } = useApp()
  return (
    <section className="cv-auto container-w">
      <ul className="mx-auto grid max-w-[1040px] grid-cols-2 gap-3 sm:gap-4 lg:aspect-[2/1] lg:grid-cols-4 lg:grid-rows-2">
        {categories.map((c, i) => {
          const n = products.filter((p) => p.categoryId === c.id).length
          const big = i === 0
          // with an even count the last tile spans two columns, so the grid closes with no gap
          const wide = !big && categories.length % 2 === 0 && i === categories.length - 1
          return (
            <Reveal as="li" key={c.id} delay={i * 80} className={cn(big ? 'col-span-2 aspect-[16/10] lg:row-span-2 lg:aspect-auto' : wide ? 'col-span-2 aspect-[2/1] lg:aspect-auto' : 'aspect-square lg:aspect-auto')}>
              <Link to={`/${c.id}`} className="group relative block size-full overflow-hidden rounded-[20px] bg-[var(--p-green-950)] shadow-[0_1px_2px_color-mix(in_srgb,var(--p-green-900)_8%,transparent),0_24px_40px_-24px_color-mix(in_srgb,var(--p-green-900)_70%,transparent)] ring-1 ring-primary/10">
                {settings.categoryImages[c.id]
                  ? <img src={settings.categoryImages[c.id]} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]" />
                  : CAT_ART[c.id]
                  ? <img src={`${ART}/${CAT_ART[c.id]}`} srcSet={`${ART}/${CAT_ART[c.id].replace('.webp', '-480.webp')} 480w, ${ART}/${CAT_ART[c.id]} 900w`} sizes={big ? '(max-width: 1024px) 92vw, 520px' : '(max-width: 1024px) 46vw, 260px'} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]" />
                  : <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(80%_60%_at_50%_30%,var(--p-green-700),var(--p-green-900)_60%,var(--p-green-950))] text-on-inverse"><Icon name={c.icon} size={big ? 44 : 30} /></span>}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,color-mix(in_srgb,var(--p-green-950)_85%,transparent))]" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-5">
                  <span className="text-white">
                    <b className={cn('block font-semibold leading-snug', big ? 'text-[19px] sm:text-[24px]' : 'text-[14.5px] sm:text-[16px]')}>{c.name}</b>
                    <span className="tabular text-[12px] text-white/70 sm:text-[13px]">{n} خدمات</span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition-colors group-hover:bg-white group-hover:text-primary sm:size-9"><ArrowLeft className="size-4" /></span>
                </span>
              </Link>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}

function ProductsBlock({ b }) {
  const { products, byId, catalogReady } = useApp()
  if (!catalogReady) return <div className="container-w grid grid-cols-2 gap-6 py-16 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-sunken" />)}</div>
  const list = b.source === 'picked' ? b.ids.map((id) => byId[id]).filter(Boolean)
    : b.source === 'category' ? products.filter((p) => p.categoryId === b.category)
      : b.source === 'featured' ? products.filter((p) => p.featured)
        : [...products].sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')))
  const items = list.slice(0, b.limit)
  if (!items.length) return null
  return (
    <section className="cv-auto py-12 sm:py-16">
      <Title eyebrow={b.eyebrow} title={b.title} className="mb-10 sm:mb-14" />
      <div className="container-w">
        <Shelf items={items} />
        {b.viewAll && <ViewAll to={b.viewAllTo || (b.source === 'category' && b.category ? `/${b.category}` : '/shop')} />}
      </div>
    </section>
  )
}

/* ---------------- Reviews: two rows drifting in opposite directions ---------------- */
// The pre-rendered page carries each review once and stands still; the looping copy and the drift start after hydration.
function ReviewRow({ items, reverse }) {
  const [live, setLive] = useState(false)
  useEffect(() => setLive(true), [])
  const row = live ? [...items, ...items] : items
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_8%,black_92%,transparent)]">
      <ul className={cn('flex w-max shrink-0 gap-4 py-3', live && 'motion-safe:animate-[marquee_160s_linear_infinite] group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]', reverse && '[animation-direction:reverse]')}>
        {row.map((r, i) => (
          <li key={i} aria-hidden={i >= items.length || undefined} className="w-[280px] shrink-0 sm:w-[340px]">
            <figure className="flex h-full flex-col rounded-xl bg-surface p-5 shadow-[0_16px_40px_-30px_color-mix(in_srgb,var(--p-green-900)_50%,transparent)] ring-1 ring-accent/30">
              <div className="flex items-center justify-between"><Stars className="text-[var(--p-gold-500)]" /><Quote className="size-5 text-primary/20" strokeWidth={1.4} /></div>
              <blockquote className="mt-3 line-clamp-4 flex-1 text-[14px] leading-7">{r.text}</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-border pt-3 text-xs">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-semibold text-on-inverse">{r.name.charAt(0)}</span>
                <span className="min-w-0"><b className="block truncate font-semibold text-primary">{r.name}</b>{r.city && <span className="text-muted-foreground">{r.city}</span>}</span>
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
    <section className="cv-auto py-12 sm:py-16">
      <Title eyebrow={b.eyebrow} title={b.title} className="mb-10 sm:mb-12" />
      <div className="grid gap-2">
        <ReviewRow items={short.slice(0, half)} />
        <ReviewRow items={short.slice(half)} reverse />
      </div>
      <ViewAll to="/reviews">كل الآراء ({ALL_REVIEWS.length})</ViewAll>
    </section>
  )
}

function CategoriesBlock({ b }) {
  return (
    <section className="cv-auto py-12 sm:py-16">
      <Title eyebrow={b.eyebrow} title={b.title} className="mb-10 sm:mb-14" />
      <Categories />
    </section>
  )
}

function FaqBlock({ b }) {
  return (
    <section className="cv-auto container-w grid gap-8 py-16 sm:py-24 lg:grid-cols-[0.7fr_1.3fr]">
      <Head eyebrow={b.eyebrow} title={b.title} />
      <Accordion type="single" collapsible className="grid gap-3">
        {FAQ.map((q, i) => (
          <AccordionItem key={q.q} value={String(i)}>
            <AccordionTrigger>{q.q}</AccordionTrigger>
            <AccordionContent>{q.a} {q.link && <Link className="font-semibold text-primary underline underline-offset-4" to={q.link}>السياسات والشروط</Link>}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

const RENDER = {
  hero: Hero, banner: BannerBlock, promises: Promises, products: ProductsBlock, categories: CategoriesBlock,
  imageText: ImageTextBlock, text: TextBlock, gallery: ({ b }) => <GalleryWall eyebrow={b.eyebrow} title={b.title} text={b.text} />, reviews: Reviews, faq: FaqBlock,
}

// The home page is the owner's list of blocks (store designer); the original layout until they change it.
export default function Home() {
  const { settings } = useApp()
  const blocks = settings.home.filter((b) => b.on)
  const top = blocks[0]?.type === 'hero' ? blocks[0] : null
  const rest = top ? blocks.slice(1) : blocks
  return (
    <>
      {top ? <div data-block={top.id}><Hero b={top} first /></div> : <h1 className="sr-only">{settings.home.find((b) => b.type === 'hero')?.title1 || 'الرئيسية'}</h1>}
      <div className={cn('relative isolate', !top && 'pt-6')}>
        {settings.background.decor && <>
          <Vine />
          <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_18%_at_95%_14%,color-mix(in_srgb,var(--p-green-900)_7%,transparent),transparent),radial-gradient(40%_14%_at_5%_34%,color-mix(in_srgb,var(--p-gold-400)_12%,transparent),transparent),radial-gradient(50%_16%_at_100%_56%,color-mix(in_srgb,var(--p-green-900)_6%,transparent),transparent),radial-gradient(45%_14%_at_0%_78%,color-mix(in_srgb,var(--p-green-900)_6%,transparent),transparent)]" aria-hidden="true" />
        </>}
        {rest.map((b, i) => {
          const C = RENDER[b.type]
          return <div key={b.id} data-block={b.id}><C b={b} afterHero={i === 0 && !!top} /></div>
        })}
      </div>
    </>
  )
}
