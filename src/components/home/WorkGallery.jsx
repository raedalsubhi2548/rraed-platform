import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { img } from '@/data/work.js'

/** Masonry of portfolio images (natural ratios) with a keyboard/swipe lightbox. */
// thumb: grid thumbnail size passed to Google's image CDN ('400-rw' = 400px WebP, a fraction of the PNG)
export function WorkGallery({ items, className, grid = false, thumb = 600 }) {
  const [open, setOpen] = useState(-1)
  const go = useCallback((d) => setOpen((i) => (i + d + items.length) % items.length), [items.length])

  useEffect(() => {
    if (open < 0) return
    // RTL: ArrowLeft moves forward, ArrowRight back
    const onKey = (e) => { if (e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowRight') go(-1) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  let startX = 0
  return (
    <>
      {grid ? (
        // tidy grid: every design sits as a framed print on the store's soft backdrop, same size, all lined up
        <ul className={cn('grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6', className)}>
          {items.map((id, i) => (
            <li key={id}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`عرض التصميم ${i + 1} بحجم كبير`}
                className="group relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[14px] bg-[linear-gradient(165deg,#fbfcfe,#e6ecf4)] p-2.5 ring-1 ring-primary/[0.07] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-26px_color-mix(in_srgb,var(--p-green-900)_60%,transparent)] sm:p-3.5">
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(60%_80%_at_50%_100%,color-mix(in_srgb,var(--p-green-900)_8%,transparent),transparent)]" aria-hidden="true" />
                <img src={img(id, thumb)} alt={`تصميم ${i + 1} من أعمال منصة رائد`} loading="lazy" decoding="async"
                  className="relative max-h-full max-w-full rounded-[8px] object-contain shadow-[0_14px_28px_-14px_color-mix(in_srgb,var(--p-green-900)_55%,transparent)] ring-[3px] ring-white transition-transform duration-700 ease-emphasized group-hover:scale-[1.03]" />
                <span className="tabular absolute bottom-2 end-2 rounded-full bg-white/85 px-2 py-0.5 text-[10.5px] font-semibold text-primary/70 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">{i + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={cn('columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4', className)}>
        {items.map((id, i) => (
          <li key={id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block w-full overflow-hidden rounded-lg bg-sunken shadow-hairline ring-1 ring-border transition-shadow duration-300 hover:shadow-card"
              aria-label={`عرض التصميم ${i + 1} بحجم كبير`}
            >
              <img src={img(id, 700)} alt="" loading="lazy" decoding="async" className="w-full transition-transform duration-700 ease-emphasized group-hover:scale-[1.02]" />
            </button>
          </li>
        ))}
      </ul>
      )}

      <Dialog.Root open={open >= 0} onOpenChange={(o) => !o && setOpen(-1)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgb(11_19_34/0.92)] motion-safe:animate-[fade-in_200ms]" />
          <Dialog.Content
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="fixed inset-0 z-50 grid place-items-center p-4 outline-none sm:p-10"
            onTouchStart={(e) => { startX = e.touches[0].clientX }}
            onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1) }}
          >
            <Dialog.Title className="sr-only">معرض أعمال منصة رائد</Dialog.Title>
            <Dialog.Description className="sr-only">تصميم {open + 1} من {items.length}. استخدم الأسهم للتنقل.</Dialog.Description>
            {open >= 0 && (
              <img key={items[open]} src={img(items[open], 1800)} alt={`تصميم ${open + 1} من أعمال منصة رائد`} className="max-h-[86vh] max-w-full rounded-md object-contain shadow-overlay motion-safe:animate-[fade-in_240ms]" />
            )}
            <Dialog.Close className="absolute top-4 end-4 grid size-12 place-items-center rounded-full bg-background text-primary" aria-label="إغلاق"><X className="size-6" /></Dialog.Close>
            <button onClick={() => go(-1)} className="absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-primary" aria-label="السابق"><ChevronRight className="size-6" /></button>
            <button onClick={() => go(1)} className="absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-primary" aria-label="التالي"><ChevronLeft className="size-6" /></button>
            <p className="tabular absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-background px-3 py-1 text-sm font-bold text-primary">{open + 1} / {items.length}</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
