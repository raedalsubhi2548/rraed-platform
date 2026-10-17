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

let scriptP = null
function loadWidget(publicKey) {
  if (scriptP) return scriptP
  window.tamaraWidgetConfig = { lang: 'ar', country: 'SA', publicKey, style: { fontSize: '14px', badgeRatio: 1 } }
  scriptP = new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.tamara.co/widget-v2/tamara-widget.js'
    s.defer = true
    s.onload = resolve
    s.onerror = resolve
    document.head.appendChild(s)
  })
  return scriptP
}

/** Tamara's own «split it» line for an amount (product page, cart, checkout). Nothing shows when Tamara is off. */
export function TamaraWidget({ amount, className }) {
  const cfg = useTamara()
  const [ready, setReady] = useState(false)
  const on = !!(cfg?.enabled && cfg.publicKey)
  useEffect(() => { if (on) loadWidget(cfg.publicKey).then(() => setReady(true)) }, [on])
  // a new amount (options, quantity) re-draws the widget with the new numbers
  useEffect(() => { if (ready) window.TamaraWidgetV2?.refresh?.() }, [ready, amount])
  if (!on || !ready || !(amount > 0)) return null
  const value = String(Math.round(Number(amount) * 100) / 100)
  return (
    <div className={cn('min-h-6', className)} key={value}>
      <tamara-widget type="tamara-summary" amount={value} inline-type="2" config='{"badgePosition":"start","showExtraContent":""}' />
    </div>
  )
}

/** The badge itself, for the checkout option. */
export const TamaraBadge = ({ className }) => <img src="https://cdn.tamara.co/assets/svg/tamara-logo-badge-ar.svg" alt="تمارا" className={cn('h-7 w-auto', className)} />

/** How an order was paid, for labels. */
export const payLabel = (o) => (String(o?.paymentRef || '').startsWith('tamara:') ? 'تمارا (تقسيط)' : o?.paymentMethod === 'bank' ? 'تحويل بنكي' : 'بطاقة / Apple Pay')

export const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الطائف', 'بريدة', 'عنيزة', 'الرس', 'تبوك', 'أبها', 'خميس مشيط', 'حائل', 'جازان', 'نجران', 'الجبيل', 'الأحساء', 'ينبع', 'الباحة', 'سكاكا', 'عرعر', 'القطيف']
