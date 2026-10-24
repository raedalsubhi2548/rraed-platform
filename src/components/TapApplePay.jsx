// Apple Pay through Tap (Apple Pay Web SDK). Tap registered rraed.com with Apple; the domain file lives at
// /.well-known/apple-developer-merchantid-domain-association. The button opens Apple's sheet and hands back a
// one-time token (tok_…) that api/tap-charge.js charges, like the card fields. Shown only on Apple devices that can pay.
import { useEffect, useRef, useState } from 'react'
import { TAP_PUBLIC_KEY, TAP_MERCHANT_ID } from '@/components/TapCard.jsx'

const BASE = 'https://tap-sdks.b-cdn.net/apple-pay/build-1.2.0/'

let loading
const loadSdk = () => (loading ||= new Promise((ok, no) => {
  if (window.TapApplepaySDK) return ok(window.TapApplepaySDK)
  if (!document.querySelector(`link[href="${BASE}main.css"]`)) document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: BASE + 'main.css' }))
  const s = Object.assign(document.createElement('script'), { src: BASE + 'main.js', async: true })
  s.onload = () => (window.TapApplepaySDK ? ok(window.TapApplepaySDK) : no(new Error('sdk')))
  s.onerror = () => { loading = null; no(new Error('sdk')) }
  document.head.appendChild(s)
}))

/** true on a device/browser where Apple Pay can be used (Safari on iPhone, iPad, Mac with a card in Wallet) */
export const canApplePay = () => {
  try { return typeof window !== 'undefined' && !!window.ApplePaySession && window.ApplePaySession.canMakePayments() } catch { return false }
}

/**
 * amount: the order total shown in Apple's sheet (the server charges the order's own total).
 * onToken(tokenId) is called after the customer approves; onError(message) on failure.
 */
export default function TapApplePay({ amount, customer, onToken, onError }) {
  const [state, setState] = useState('loading') // loading | ready | failed
  const id = 'tap-apple-pay-' + useRef(Math.random().toString(36).slice(2, 8)).current
  const cb = useRef({ onToken, onError })
  cb.current = { onToken, onError }

  useEffect(() => {
    let gone = false
    const el = document.getElementById(id)
    if (el) el.innerHTML = ''
    setState('loading')
    // Tap draws its button inside our box but doesn't always call onReady: treat "something appeared" as ready,
    // and give up after a few seconds instead of leaving an empty grey box
    const seen = () => { if (!gone && el && el.childElementCount > 0) { setState('ready'); return true } return false }
    const mo = el ? new MutationObserver(seen) : null
    mo?.observe(el, { childList: true, subtree: true })
    const giveUp = setTimeout(() => { if (!seen() && !gone) setState('failed') }, 9000)
    loadSdk().then((A) => {
      if (gone) return
      const phone = String(customer?.phone || '').replace(/\D/g, '').replace(/^(966|0)/, '')
      const [first, ...rest] = String(customer?.name || 'عميل').trim().split(/\s+/)
      A.render({
        debug: false,
        scope: 'TapToken',
        publicKey: TAP_PUBLIC_KEY,
        environment: 'production',
        merchant: { id: TAP_MERCHANT_ID, domain: window.location.hostname.replace(/^www\./, '') },
        transaction: { amount: Number(amount).toFixed(2), currency: 'SAR' },
        acceptance: { supportedBrands: ['mada', 'masterCard', 'visa'] },
        features: { supportsCouponCode: false },
        customer: {
          name: [{ locale: 'ar', first: first || 'عميل', middle: '', last: rest.join(' ') || '-' }],
          contact: { email: customer?.email || '', phone: { number: phone, countryCode: '+966' } },
        },
        interface: { locale: 'ar', theme: 'dark', type: 'buy', edges: 'curved' },
        onReady: () => !gone && setState('ready'),
        onSuccess: (data) => {
          const tok = data?.id || data?.token?.id || (typeof data === 'string' ? data : '')
          if (/^tok_/.test(tok)) cb.current.onToken?.(tok)
          else cb.current.onError?.('ما اكتمل الدفع بـ Apple Pay، حاول مرة ثانية')
        },
        onError: (e) => { console.warn('apple pay', e); cb.current.onError?.('ما اكتمل الدفع بـ Apple Pay، حاول مرة ثانية أو ادفع بالبطاقة') },
        onCancel: () => {},
      }, id)
    }).catch((e) => { console.warn('apple pay sdk', e); if (!gone) setState('failed') })
    return () => { gone = true; mo?.disconnect(); clearTimeout(giveUp) }
    // drawn again only when the total changes; the charged amount always comes from the order on the server
  }, [amount]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-12">
      {state === 'loading' && <div className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-sunken" aria-hidden="true" />}
      {state === 'failed' && <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">زر Apple Pay ما ظهر. ادفع بالبطاقة، أو اختر «صفحة الدفع من Tap» وفيها Apple Pay.</p>}
      <div id={id} />
    </div>
  )
}
