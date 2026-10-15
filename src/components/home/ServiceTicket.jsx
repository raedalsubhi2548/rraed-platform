import { Link } from 'react-router-dom'
import { Heart, Plus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/state.jsx'
import { money, effectivePrice } from '@/lib/format.js'
import { coverFor } from '@/lib/cover.js'
import { productPath } from '@/lib/slug.js'
import { SERVICE_RATINGS } from '@/data/reviews.js'

/** A service plate: the picture melts into a deep panel with a polished silver rim; light runs around the rim
 *  on hover. Name, what it is, a real rating when one exists, and the price in silver numerals. Inside a
 *  `.night` region it renders midnight; on the light pages it renders porcelain. */
export default function ServiceTicket({ p, className }) {
  const { addToCart, toggleWish, wishlist } = useApp()
  const wished = wishlist.includes(p.id)
  const sale = p.salePrice && p.salePrice < p.price
  const rating = SERVICE_RATINGS[p.id]
  return (
    <article className={cn('rim plate group relative flex h-full flex-col overflow-hidden rounded-[22px] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1', className)}>
      <Link to={productPath(p.id)} className="relative block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <img src={p.image} srcSet={p.image?.startsWith('/api/art?') ? `${p.image}&w=300 300w, ${p.image} 600w` : undefined} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px" alt="" loading="lazy" decoding="async" width="500" height="375"
          onError={(e) => { if (!e.currentTarget.dataset.fb) { e.currentTarget.dataset.fb = 1; e.currentTarget.src = coverFor(p) } }}
          className="aspect-[4/3] w-full object-cover transition-[scale,filter] duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05] group-hover:brightness-110" />
        {/* the picture settles into the plate: no seam between image and panel */}
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,var(--plate-end,var(--surface)))]" aria-hidden="true" />
      </Link>

      <button type="button" onClick={() => toggleWish(p.id)} aria-pressed={wished} aria-label={wished ? `إزالة ${p.name} من الأمنيات` : `إضافة ${p.name} إلى الأمنيات`}
        className={cn('absolute top-2.5 end-2.5 z-10 grid size-11 place-items-center rounded-full bg-[var(--night-1)]/55 text-white ring-1 ring-white/25 backdrop-blur-md transition-[background-color,color]', wished ? 'text-[#ff8c8c]' : 'hover:bg-[var(--night-1)]/80')}>
        <Heart className="size-[16px]" fill={wished ? 'currentColor' : 'none'} strokeWidth={1.8} />
      </button>
      {(p.badge || sale) && (
        <span className="absolute top-3.5 start-3 z-10 max-w-[calc(100%-72px)] truncate rounded-full bg-[var(--silver-hi)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[var(--night-1)] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.6)]">{sale ? 'خصم' : p.badge}</span>
      )}

      <div className="relative -mt-6 flex flex-1 flex-col px-3.5 pb-3.5 sm:px-5 sm:pb-5">
        {rating && (
          <span className="mb-2 inline-flex w-fit items-center gap-1 text-[11.5px] text-muted-foreground">
            <Star className="size-3.5 fill-[var(--silver-lo)] text-[var(--silver-lo)]" strokeWidth={0} /><b className="tabular font-semibold text-foreground">5.0</b><span className="tabular">({rating.count})</span>
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-[14.5px] font-medium leading-[1.55] text-foreground sm:text-[16.5px]">
          <Link to={productPath(p.id)} className="outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[22px] focus-visible:after:outline-2 focus-visible:after:outline-offset-[-3px] focus-visible:after:outline-[var(--ring)]">{p.name}</Link>
        </h3>
        {p.summary && <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.75] text-muted-foreground sm:text-[13.5px]">{p.summary}</p>}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="leading-none">
            {sale && <s className="tabular mb-1 block text-[12px] text-muted-foreground">{money(p.price)}</s>}
            <span className="tabular font-display text-[19px] font-light text-foreground sm:text-[23px]">{money(effectivePrice(p))}</span>
            {p.perUnit && <span className="mt-1 block text-[11px] text-muted-foreground">{p.perUnit}</span>}
          </p>
          <button type="button" onClick={() => addToCart(p.id)} aria-label={`أضف ${p.name} للسلة`}
            className="relative z-[3] grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_22px_-10px_rgb(0_0_0/0.7)] transition-[scale,box-shadow] duration-300 hover:scale-105 hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_18%,transparent)] active:scale-95">
            <Plus className="size-[18px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  )
}
