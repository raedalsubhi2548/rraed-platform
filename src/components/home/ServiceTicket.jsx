import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/state.jsx'
import { money, effectivePrice } from '@/lib/format.js'
import { coverFor } from '@/lib/cover.js'
import { productPath } from '@/lib/slug.js'

/** A white card pinned with a navy pin: straight, equal height, everything on the same lines across a row. */
export default function ServiceTicket({ p, className }) {
  const { addToCart, toggleWish, wishlist, categories } = useApp()
  const cat = categories?.find((c) => c.id === p.categoryId)
  const wished = wishlist.includes(p.id)
  const sale = p.salePrice && p.salePrice < p.price
  return (
    <div className={cn('group relative h-full pt-2.5', className)}>
      {/* the pin */}
      <span className="pointer-events-none absolute top-0 left-1/2 z-20 -translate-x-1/2" aria-hidden="true">
        <span className="block size-[16px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#5d7cb5,var(--p-green-800)_55%,var(--p-green-950))] shadow-[0_4px_5px_-1px_rgb(0_0_0/0.45),inset_0_-2px_3px_rgb(0_0_0/0.3)]" />
        <span className="absolute top-[3px] left-[5px] size-[5px] rounded-full bg-white/70 blur-[0.5px]" />
      </span>
      <article className="relative flex h-full flex-col rounded-[14px] bg-white p-2.5 pt-3.5 shadow-[0_1px_2px_color-mix(in_srgb,var(--p-green-900)_8%,transparent),0_18px_32px_-22px_color-mix(in_srgb,var(--p-green-900)_50%,transparent)] ring-1 ring-[var(--p-green-900)]/[0.07] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1 group-hover:shadow-[0_2px_4px_color-mix(in_srgb,var(--p-green-900)_6%,transparent),0_28px_44px_-24px_color-mix(in_srgb,var(--p-green-900)_60%,transparent)]">
        <Link to={productPath(p.id)} className="relative block overflow-hidden rounded-[10px] bg-sunken">
          <img src={p.image} srcSet={p.image?.startsWith('/api/art?') ? `${p.image}&w=300 300w, ${p.image} 600w` : undefined} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 260px" alt={p.name} loading="lazy" decoding="async" width="500" height="500" onError={(e) => { if (!e.currentTarget.dataset.fb) { e.currentTarget.dataset.fb = 1; e.currentTarget.src = coverFor(p) } }}
            className="aspect-square w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
        </Link>
        <button type="button" onClick={() => toggleWish(p.id)} aria-pressed={wished} aria-label={wished ? 'إزالة من الأمنيات' : 'إضافة إلى الأمنيات'}
          className={cn('absolute top-[16px] end-[12px] z-10 grid size-11 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors', wished ? 'text-danger' : 'text-primary/60 hover:text-primary')}>
          <Heart className="size-[15px]" fill={wished ? 'currentColor' : 'none'} />
        </button>
        {(p.badge || sale) && (
          <span className="absolute top-[24px] start-[18px] z-10 max-w-[calc(100%-76px)] truncate rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-medium leading-none text-on-inverse backdrop-blur">{sale ? 'خصم' : p.badge}</span>
        )}
        <div className="flex flex-1 flex-col px-1 pt-3">
          {cat && <span className="mb-1 block truncate text-[11.5px] text-muted-foreground">{cat.name}</span>}
          <h3 className="line-clamp-2 h-[2.9rem] text-[14px] font-semibold leading-[1.45rem] text-primary">
            <Link to={productPath(p.id)} className="after:absolute after:inset-0">{p.name}</Link>
          </h3>
          <div className="mt-auto flex min-h-[3.4rem] items-center justify-between gap-2 border-t border-primary/10 pt-2.5">
            <p className="tabular leading-tight">
              <span className="text-[16px] font-bold text-primary">{money(effectivePrice(p))}</span>
              {sale && <s className="ms-1.5 text-xs text-muted-foreground">{money(p.price)}</s>}
              {p.perUnit && <span className="block text-[11px] text-muted-foreground">{p.perUnit}</span>}
            </p>
            <button type="button" onClick={() => addToCart(p.id)} aria-label={`أضف ${p.name} للسلة`}
              className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-inverse shadow-[0_8px_16px_-8px_color-mix(in_srgb,var(--p-green-900)_70%,transparent)] transition-[background-color,scale] duration-300 hover:scale-105 hover:bg-primary-hover active:scale-95">
              <Plus className="size-[18px]" />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
