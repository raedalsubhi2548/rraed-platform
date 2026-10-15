import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STOPS } from '@/data/route.js'
import { useApp } from '@/state.jsx'

// Deterministic barcode bars from a string (decorative).
export function Barcode({ value, className }) {
  const bars = useMemo(() => {
    let h = 0
    for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) | 0
    return Array.from({ length: 46 }, (_, i) => {
      const x = Math.sin(h + i) * 10000
      return x - Math.floor(x) > 0.66 ? 3 : 1.5
    })
  }, [value])
  let x = 0
  return (
    <svg viewBox="0 0 160 36" className={cn('h-9 w-40 text-primary', className)} aria-hidden="true">
      {bars.map((w, i) => { const r = <rect key={i} x={x} y="0" width={w} height="36" fill="currentColor" />; x += w + 1.8; return r })}
    </svg>
  )
}

// The ticket shell: notched sides + perforated rule between head and body.
export function Ticket({ head, children, className, notchTone = 'var(--ticket-notch)' }) {
  return (
    <div className={cn('relative rounded-[var(--ticket-radius)] bg-[var(--ticket-bg)] shadow-card', className)}>
      {head}
      {head && (
        <div className="relative h-px" aria-hidden="true">
          <span className="absolute -start-3 -top-3 size-6 rounded-full" style={{ background: notchTone }} />
          <span className="absolute -end-3 -top-3 size-6 rounded-full" style={{ background: notchTone }} />
          <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-[var(--ticket-rule)]" />
        </div>
      )}
      {children}
    </div>
  )
}

export function useStopCounts() {
  const { byId } = useApp()
  return useMemo(() => STOPS.map((s) => s.ids.filter((id) => byId[id]).length), [byId])
}
export const servicesLabel = (n) => (n === 1 ? 'خدمة وحدة' : n === 2 ? 'خدمتين' : n <= 10 ? `${n} خدمات` : `${n} خدمة`)

/** Hero waybill: the route of a store, stop by stop, with the active stop stamped. */
export function Waybill({ active, onSelect }) {
  const counts = useStopCounts()
  const [intro, setIntro] = useState(-1)
  const timer = useRef()
  // One orchestrated moment: the route fills stop by stop on first paint.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setIntro(STOPS.length); return }
    let i = 0
    timer.current = setInterval(() => { i += 1; setIntro(i); if (i >= STOPS.length) clearInterval(timer.current) }, 260)
    return () => clearInterval(timer.current)
  }, [])
  const shown = Math.min(intro, active)

  return (
    <Ticket
      className="w-full"
      head={
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold text-accent-text">بوليصة متجرك</p>
            <p className="mt-1 font-display text-lg font-semibold text-primary">من الورق الرسمي لأول طلب</p>
          </div>
          <div className="text-end">
            <Barcode value="RAED-ROUTE" className="h-7 w-28" />
            <p className="mt-1 text-[11px] text-muted-foreground">مثال توضيحي</p>
          </div>
        </div>
      }
    >
      <ol className="relative p-5 sm:p-6" aria-label="محطات متجرك">
        {/* rail */}
        <span className="absolute start-[42.5px] top-11 bottom-11 w-[3px] rounded-full bg-[var(--tracker-rail)] sm:start-[46.5px] sm:top-12 sm:bottom-12" aria-hidden="true" />
        <span
          className="absolute start-[42.5px] top-11 w-[3px] rounded-full bg-[var(--tracker-fill)] transition-[height] duration-500 ease-emphasized sm:start-[46.5px] sm:top-12"
          style={{ height: `calc((100% - 5.5rem) * ${Math.max(0, shown) / (STOPS.length - 1)})` }}
          aria-hidden="true"
        />
        {STOPS.map((s, i) => {
          const done = i < shown
          const now = i === active && intro >= i
          return (
            <li key={s.key} className="relative">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={i === active ? 'step' : undefined}
                className={cn(
                  'group relative flex w-full items-center gap-4 rounded-md py-3 ps-1 pe-2 text-start transition-colors duration-200',
                  i === active ? 'bg-sunken' : 'hover:bg-sunken/60',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-[3px] font-display text-sm font-bold transition-colors duration-300',
                    done ? 'border-primary bg-primary text-accent' : now ? 'border-accent bg-accent text-accent-foreground' : 'border-[var(--tracker-rail)] bg-surface text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-base font-semibold text-primary">{s.title}</span>
                    <span className="text-sm text-muted-foreground">{s.name}</span>
                  </span>
                </span>
                <span className="tabular rounded-full bg-background px-2.5 py-0.5 text-xs font-bold text-accent-text ring-1 ring-border">{servicesLabel(counts[i])}</span>
                {now && (
                  <span className="pointer-events-none absolute -top-2.5 end-20 hidden rotate-[-8deg] bg-surface rounded-sm border-2 border-accent px-2 py-0.5 text-[11px] font-bold text-accent-text animate-[stamp-in_420ms_var(--p-ease-emphasized)] sm:block" aria-hidden="true">
                    محطتك
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </Ticket>
  )
}
