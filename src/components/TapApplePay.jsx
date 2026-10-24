// Apple Pay through Tap, with Tap's own React button (@tap-payments/apple-pay-button). Tap registered rraed.com with
// Apple; the domain file lives at /.well-known/apple-developer-merchantid-domain-association. The button opens Apple's
// sheet and hands back a one-time token (tok_…) that api/tap-charge.js charges, like the card fields.
// (Their CDN script keeps a single button per page and returns the old one on a second draw, so it went blank.)
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { TAP_PUBLIC_KEY, TAP_MERCHANT_ID } from '@/components/TapCard.jsx'

const Button = lazy(() => import('@tap-payments/apple-pay-button').then((m) => ({ default: m.ApplePayButton })))

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
  const cb = useRef({ onToken, onError })
  cb.current = { onToken, onError }
  // if Tap never says it's ready, don't leave an empty grey box
  useEffect(() => { setState('loading'); const t = setTimeout(() => setState((s) => (s === 'loading' ? 'failed' : s)), 12000); return () => clearTimeout(t) }, [amount])

  const phone = String(customer?.phone || '').replace(/\D/g, '').replace(/^(966|0)/, '')
  const [first, ...rest] = String(customer?.name || 'عميل').trim().split(/\s+/)

  return (
    <div className="relative min-h-12">
      {state === 'loading' && <div className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-sunken" aria-hidden="true" />}
      {state === 'failed' && <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">زر Apple Pay ما ظهر. ادفع بالبطاقة، أو اختر «صفحة الدفع من Tap» وفيها Apple Pay.</p>}
      <div className={state === 'failed' ? 'hidden' : ''}>
        <Suspense fallback={null}>
          <Button
            key={amount}
            scope="TapToken"
            publicKey={TAP_PUBLIC_KEY}
            environment="production"
            merchant={{ id: TAP_MERCHANT_ID, domain: window.location.hostname.replace(/^www\./, '') }}
            transaction={{ amount: Number(amount).toFixed(2), currency: 'SAR' }}
            acceptance={{ supportedBrands: ['mada', 'masterCard', 'visa'] }}
            features={{ supportsCouponCode: false }}
            customer={{
              name: [{ lang: 'ar', first: first || 'عميل', last: rest.join(' ') || '-' }],
              contact: { email: customer?.email || '', phone: { countryCode: '966', number: phone } },
            }}
            interface={{ locale: 'ar', theme: 'dark', type: 'buy', edges: 'circular' }}
            onReady={() => setState('ready')}
            onSuccess={async (data) => {
              const tok = data?.id || data?.token?.id || ''
              if (/^tok_/.test(tok)) cb.current.onToken?.(tok)
              else cb.current.onError?.('ما اكتمل الدفع بـ Apple Pay، حاول مرة ثانية')
            }}
            onError={(e) => { console.warn('apple pay', e); if (state === 'loading') setState('failed'); else cb.current.onError?.('ما اكتمل الدفع بـ Apple Pay، حاول مرة ثانية أو ادفع بالبطاقة') }}
            onCancel={() => {}}
          />
        </Suspense>
      </div>
    </div>
  )
}
