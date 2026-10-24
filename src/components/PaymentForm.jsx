// One payment box for the checkout and for a pending order: Apple Pay on top (on Apple devices), then Tap's card
// fields, then the pay button; Tamara in its own tab. Card data stays in Tap's fields: we only ever get a one-time
// token (tok_…), and the server charges the order's own total (api/tap-charge.js).
import { useRef, useState } from 'react'
import { Lock, ShieldCheck, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money } from '@/lib/format.js'
import { isDemo } from '@/lib/api.js'
import { Button } from '@/components/ui/button'
import TapCard, { TAP_PUBLIC_KEY } from '@/components/TapCard.jsx'
import TapApplePay from '@/components/TapApplePay.jsx'
import { TamaraBadge, splitText } from '@/components/brand/Tamara.jsx'

export const EMBED = !!TAP_PUBLIC_KEY && !isDemo

const BRANDS = [
  { name: 'مدى', src: '/brand/pay/mada.webp' },
  { name: 'Visa', src: 'https://cdn.salla.network/images/payment/visa.png' },
  { name: 'Mastercard', src: 'https://cdn.salla.network/images/payment/mastercard.png' },
]
const Brands = () => (
  <span className="flex items-center gap-1.5" aria-label="مدى، فيزا، ماستركارد">
    {BRANDS.map((b) => <span key={b.name} className="grid h-6 w-10 place-items-center rounded-[5px] bg-white px-1 ring-1 ring-black/10"><img src={b.src} alt={b.name} className="max-h-[70%] max-w-full object-contain" /></span>)}
  </span>
)

/**
 * amount, customer {name, phone, email}
 * apple: Apple Pay can be offered on this device (checked after hydration by the page)
 * tamara: null | { split } (available) | { why } (shown greyed with the reason)
 * method / setMethod: 'card' | 'tamara'
 * validate(): page checks (phone, agreement…) before any payment starts; returns true when OK
 * ready: the same checks, passively (Apple's button only works when they already pass)
 * onPay({ token, via }): creates/charges the order (token null in demo mode or for a 0 total)
 * onTamara(): starts Tamara
 * above: shown right above the pay button (e.g. the agreement)
 */
export default function PaymentForm({ amount, customer, apple, tamara, method, setMethod, validate, ready, onPay, onTamara, busy, error, above }) {
  const card = useRef(null)
  const [cardOk, setCardOk] = useState(false)
  const [cardState, setCardState] = useState('loading')
  const [localErr, setLocalErr] = useState('')
  const free = !(amount > 0)
  const tabs = !free && tamara

  const go = async (fn) => { setLocalErr(''); try { await fn() } catch (e) { setLocalErr(e.message); if (EMBED) card.current?.reset?.() } }
  const payCard = () => go(async () => {
    if (!validate()) return
    if (free || !EMBED) return onPay({ token: null, via: 'card' })
    if (!cardOk) throw new Error(cardState === 'failed' ? 'نموذج البطاقة ما تحمّل، حدّث الصفحة' : 'اكتب بيانات البطاقة كاملة')
    const token = await card.current.tokenize()
    await onPay({ token, via: 'card' })
  })
  const payApple = (token) => go(() => onPay({ token, via: 'applepay' }))
  const payTamara = () => go(async () => { if (validate()) await onTamara() })
  const msg = localErr || error

  return (
    <div className="grid gap-5">
      {tabs && (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-sunken p-1" role="tablist" aria-label="طريقة الدفع">
          <button type="button" role="tab" aria-selected={method === 'card'} onClick={() => setMethod('card')}
            className={cn('flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all', method === 'card' ? 'bg-surface text-primary shadow-hairline ring-1 ring-border' : 'text-muted-foreground hover:text-primary')}>
            <CreditCard className="size-4" />{apple ? 'بطاقة أو Apple Pay' : 'بطاقة'}
          </button>
          <button type="button" role="tab" aria-selected={method === 'tamara'} disabled={!tamara.split} onClick={() => setMethod('tamara')}
            className={cn('flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50', method === 'tamara' ? 'bg-surface text-primary shadow-hairline ring-1 ring-border' : 'text-muted-foreground hover:text-primary')}>
            <TamaraBadge className="h-5" />تقسيط
          </button>
        </div>
      )}
      {tabs && !tamara.split && <p className="-mt-3 text-center text-xs text-muted-foreground">{tamara.why}</p>}

      {!free && method === 'tamara' && tamara?.split && (
        <div className="grid justify-items-center gap-2 rounded-2xl bg-sunken px-5 py-6 text-center">
          <TamaraBadge className="h-9" />
          <p className="text-lg font-bold text-primary">قسّمها على {splitText(tamara.split)}</p>
          <p className="text-sm text-muted-foreground">بدون فوائد ولا رسوم إضافية، والموافقة من تمارا خلال دقيقة.</p>
        </div>
      )}
      {/* the card fields stay mounted while Tamara is open: Tap's fields are drawn once per page */}
      {!free && (
        <div className={cn('grid gap-4', method === 'tamara' && tamara?.split && 'hidden')}>
          {apple && EMBED && (
            <>
              <TapApplePay amount={amount} customer={customer} ready={ready} onBlocked={validate} onToken={payApple} onError={setLocalErr} />
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />أو ادفع بالبطاقة<span className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <div className="rounded-2xl bg-surface p-4 ring-1 ring-border sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-primary">بيانات البطاقة</p>
              <Brands />
            </div>
            {EMBED ? <TapCard ref={card} amount={amount} customer={customer} onValid={setCardOk} onState={setCardState} />
              : <p className="rounded-lg border border-dashed border-accent bg-accent/15 p-3 text-sm text-accent-text">{isDemo ? 'وضع العرض: الدفع يُسجَّل كمدفوع بدون خصم أي مبلغ.' : 'بننقلك لصفحة الدفع الآمنة لإدخال بيانات البطاقة.'}</p>}
          </div>
        </div>
      )}

      {above}
      {msg && <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{msg}</p>}

      {method === 'tamara' && tamara?.split && !free
        ? <Button type="button" size="lg" className="h-13 w-full text-base" onClick={payTamara} disabled={busy}>{busy ? 'نحوّلك لتمارا…' : 'أكمل مع تمارا'}</Button>
        : <Button type="button" size="lg" className="h-13 w-full text-base" onClick={payCard} disabled={busy}><Lock />{busy ? 'جاري تأكيد الدفع…' : free ? 'أكمل الطلب' : `ادفع ${money(amount)}`}</Button>}

      {!free && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" />دفع آمن ومشفّر عبر بوابة Tap المرخّصة، وما نحفظ بيانات بطاقتك
        </p>
      )}
    </div>
  )
}
