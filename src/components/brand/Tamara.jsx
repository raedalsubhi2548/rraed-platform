import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { isDemo } from '@/lib/api.js'
import { useApp } from '@/state.jsx'

// Tamara (pay in instalments). The server says whether it is switched on and gives the public key (api/tamara.js).
const configs = new Map() // per signed-in account
export function tamaraConfig(uid = '') {
  if (isDemo || typeof window === 'undefined') return Promise.resolve({ enabled: false })
  if (configs.has(uid)) return configs.get(uid)
  // sent with the session: while testing, the server shows Tamara only to the owner and the team
  const p = (async () => {
    const { sb } = await import('@/lib/supa.js')
    const token = uid && sb ? (await sb.auth.getSession()).data.session?.access_token : ''
    const r = await fetch('/api/tamara?op=config', { headers: token ? { authorization: 'Bearer ' + token } : {} })
    return r.ok ? r.json() : { enabled: false }
  })().catch(() => ({ enabled: false }))
  configs.set(uid, p)
  return p
}
/** { enabled, publicKey } after hydration (null until known), so the prerendered page and the first render match. */
export function useTamara() {
  const { user } = useApp()
  const [cfg, setCfg] = useState(null)
  // asked again when the signed-in account changes (test mode depends on who is signed in)
  useEffect(() => { let alive = true; tamaraConfig(user?.id || '').then((c) => alive && setCfg(c)); return () => { alive = false } }, [user?.id])
  return cfg
}

/** How an amount splits with Tamara: { n, per } from the store's own plans (Tamara's limits), or null when it can't. */
export function tamaraSplit(cfg, amount) {
  if (!cfg?.enabled || !(amount > 0)) return null
  const plans = cfg.plans?.length ? cfg.plans : [{ instalments: 4, min: 0, max: 0 }] // Tamara's standard plan in KSA
  const fits = plans.filter((p) => (!p.min || amount >= p.min) && (!p.max || amount <= p.max))
  const p = fits.find((x) => x.instalments === 4) || fits[0]
  return p ? { n: p.instalments, per: Math.ceil(amount / p.instalments) } : null
}
/** The smallest order Tamara accepts here (0 when unknown). */
export const tamaraMin = (cfg) => Math.min(...(cfg?.plans || []).map((p) => p.min || 0).filter(Boolean), Infinity) || 0
const n = (x) => (x === 2 ? 'دفعتين' : `${x} دفعات`)
export const splitText = (sp) => `${n(sp.n)} بقيمة ${sp.per.toLocaleString('en-US')} ر.س`

/** «Split it with Tamara» under a price (service page, cart): the Tamara badge with the instalment amount.
 *  Nothing shows when Tamara is off or the amount is outside its limits. */
export function TamaraWidget({ amount, className }) {
  const sp = tamaraSplit(useTamara(), amount)
  if (!sp) return null
  return (
    <p className={cn('flex flex-wrap items-center gap-2 text-[14px] leading-6 text-muted-foreground', className)}>
      <TamaraBadge className="h-6" />
      <span>قسّمها على {n(sp.n)} بقيمة <b className="tabular font-bold text-foreground">{sp.per.toLocaleString('en-US')} ر.س</b> بدون فوائد</span>
    </p>
  )
}

/** The short version for service cards: badge + «4 × 25 ر.س». Keeps the same height on every card of a row. */
export function TamaraMini({ amount, className }) {
  const cfg = useTamara()
  if (!cfg?.enabled) return null
  const sp = tamaraSplit(cfg, amount)
  return (
    <p className={cn('flex h-6 items-center gap-1.5 text-[11.5px] text-muted-foreground', className)}>
      {sp && <><TamaraBadge className="h-5" /><span className="tabular">أو {sp.n} × <b className="font-bold text-foreground">{sp.per.toLocaleString('en-US')} ر.س</b></span></>}
    </p>
  )
}

/** The badge itself, for the checkout option. */
export const TamaraBadge = ({ className }) => <img src="https://cdn.tamara.co/assets/svg/tamara-logo-badge-ar.svg" alt="تمارا" className={cn('h-7 w-auto', className)} />

/** How an order was paid, for labels. */
export const payLabel = (o) => (String(o?.paymentRef || '').startsWith('tamara:') ? 'تمارا (تقسيط)' : o?.paymentMethod === 'bank' ? 'تحويل بنكي' : 'بطاقة / Apple Pay')

