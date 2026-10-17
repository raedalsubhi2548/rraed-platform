import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CreditCard, Lock, ChevronDown } from 'lucide-react'
import { useTamara, TamaraBadge, tamaraSplit, tamaraMin, splitText } from '@/components/brand/Tamara.jsx'
import { DECLARATION } from '@/data/terms.js'
import { useApp } from '@/state.jsx'
import { api, isDemo } from '@/lib/api.js'
import { cn } from '@/lib/utils'
import { money } from '@/lib/format.js'
import OptionList from '@/components/OptionList.jsx'
import { trackBeginCheckout } from '@/lib/analytics.js'
import { Button } from '@/components/ui/button'
import { PageHead, Panel, Field, Input, Textarea, Skeleton } from '@/components/ui/kit.jsx'


export default function Checkout() {
  const { user, authReady, lines, subtotal, clearCart, notify } = useApp()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [method, setMethod] = useState('card')
  const tamaraCfg = useTamara()
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponErr, setCouponErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [agreed, setAgreed] = useState(false) // the declaration must be accepted for every order
  const [leaving, setLeaving] = useState(false) // on the way to Tap: keep this screen, don't bounce to the empty cart
  const [phoneErr, setPhoneErr] = useState('') // every hook sits above the early returns below, so each render runs the same hooks
  // a card order whose payment didn't finish (failed to start, or the customer came back from Tap) is reused, not duplicated
  const pending = useRef(null)
  if (pending.current === null) { try { pending.current = JSON.parse(sessionStorage.getItem('raed:pending-order') || 'false') || undefined } catch { pending.current = undefined } }

  // back button from Tap restores this page from the cache with the old "leaving" state
  useEffect(() => {
    const back = (e) => { if (e.persisted) { setLeaving(false); setBusy(false) } }
    window.addEventListener('pageshow', back)
    return () => window.removeEventListener('pageshow', back)
  }, [])

  const counted = useRef(false)
  useEffect(() => { if (!counted.current && lines.length) { counted.current = true; trackBeginCheckout(lines, subtotal) } }, [lines, subtotal])
  useEffect(() => { if (user) setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone, email: user.email })) }, [user])

  // on the way to Tamara / Tap: a full-screen hold, so the page never shows its footer while the browser leaves
  if (leaving) return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-background px-6" role="status" aria-live="polite">
      <div className="grid justify-items-center gap-5 text-center">
        {method === 'tamara' ? <TamaraBadge className="h-10" /> : <Lock className="size-9 text-primary" />}
        <span className="size-9 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" aria-hidden="true" />
        <p className="text-lg font-semibold text-primary">{method === 'tamara' ? 'نحوّلك لتمارا…' : 'نحوّلك لبوابة الدفع الآمنة…'}</p>
      </div>
    </div>
  )
  if (!authReady) return <div className="container-w py-14"><Skeleton className="h-96" /></div>
  if (!user) return <Navigate to="/login?next=/checkout" replace />
  if (lines.length === 0) return <Navigate to="/cart" replace />

  const discount = coupon ? Math.min(subtotal, coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value) : 0
  const total = Math.max(0, subtotal - discount)

  const applyCoupon = async () => {
    setCouponErr('')
    try { setCoupon(await api.validateCoupon(code)); notify('تم تطبيق الخصم') } catch (e) { setCoupon(null); setCouponErr(e.message) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!/^0?5\d{8}$|^\+?9665\d{8}$/.test(form.phone.replace(/\s/g, ''))) { setPhoneErr('اكتب رقم جوال سعودي صحيح، مثل 05xxxxxxxx'); document.getElementById('checkout-phone')?.focus(); return }
    setPhoneErr('')
    if (!agreed) { setErr('لازم توافق على السياسات والشروط والإقرار والتعهد قبل إتمام الطلب'); return }
    setBusy(true)
    try {
      const items = lines.map(({ product: p, qty, note, options, chosen, unit }) => ({ productId: p.id, name: p.name, price: unit, qty, note: note || '', image: p.image, digital: !!p.digital, optionKeys: options, options: chosen }))
      // if paying failed a moment ago, retry the same order instead of creating a duplicate
      const key = `${total}|${coupon?.code || ''}|${lines.map((l) => l.key + 'x' + l.qty).join(',')}`
      const order = (pending.current?.key === key && pending.current.order) || await api.createOrder({
        items, customer: { name: form.name, phone: form.phone, email: form.email },
        notes: form.notes, coupon: coupon?.code || null, subtotal, discount, total, paymentMethod: 'card',
      })
      if ((method === 'card' || method === 'tamara') && !isDemo) {
        pending.current = { key, order }
        try { sessionStorage.setItem('raed:pending-order', JSON.stringify({ key, order: { id: order.id, number: order.number } })) } catch { /* private mode */ }
        // a 100% coupon never goes to Tamara: Tap's path marks it paid without charging
        const { redirect, free } = method === 'tamara' && total > 0 && tamaraSplit(tamaraCfg, total) ? await api.startTamara(order) : await api.startPayment(order)
        if (free) { // a 100% coupon: the order is already paid, no payment page
          pending.current = undefined; try { sessionStorage.removeItem('raed:pending-order') } catch { /* ignore */ }
          clearCart(); nav(`/order/${order.id}?new=1`, { replace: true }); return
        }
        // the cart is emptied only after Tap confirms the payment (on the order page), so a cancelled payment keeps it
        setLeaving(true)
        window.location.href = redirect
        return
      }
      clearCart()
      nav(`/order/${order.id}?new=1`, { replace: true })
    } catch (e2) {
      // a remembered order that's already paid or gone can't be reused; the next try starts a fresh one
      if (/مدفوع|غير موجود/.test(e2.message)) { pending.current = undefined; try { sessionStorage.removeItem('raed:pending-order') } catch { /* ignore */ } }
      setErr(e2.message); setBusy(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })
  const pay = (id) => cn('flex min-h-[76px] cursor-pointer items-center gap-3 rounded-lg border-[1.5px] p-4 transition-colors', method === id ? 'border-primary bg-sunken' : 'border-border hover:border-border-strong')

  return (
    <div className="container-w py-10 sm:py-14">
      <PageHead title="إتمام الطلب" />
      <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-6">
          <Panel title="بيانات التواصل">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم"><Input required {...f('name')} autoComplete="name" /></Field>
              <Field label="رقم الجوال" error={phoneErr}><Input id="checkout-phone" required {...f('phone')} type="tel" name="tel" inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" autoComplete="tel" aria-invalid={!!phoneErr || undefined} className="text-end" /></Field>
              <Field label="البريد الإلكتروني" className="sm:col-span-2"><Input type="email" required {...f('email')} dir="ltr" readOnly className="text-end" /></Field>
              <Field label="ملاحظات للطلب (اختياري)" className="sm:col-span-2"><Textarea rows={3} {...f('notes')} placeholder="رابط متجرك، أفضل وقت للتواصل، أو أي تفاصيل" /></Field>
            </div>
          </Panel>
          <Panel title="طريقة الدفع">
            <div className="grid gap-3">
              <label className={pay('card')}>
                <input type="radio" name="pay" checked={method === 'card'} onChange={() => setMethod('card')} className="size-5 shrink-0 accent-[var(--primary)]" />
                <span className="grid h-9 w-16 shrink-0 place-items-center"><CreditCard className="size-6 text-primary" /></span>
                <span className="grid min-w-0"><b className="truncate">بطاقة أو Apple Pay</b><small className="truncate text-muted-foreground">مدى، فيزا، ماستركارد عبر Tap</small></span>
              </label>
              {tamaraCfg?.enabled && total > 0 && (() => {
                const sp = tamaraSplit(tamaraCfg, total), min = tamaraMin(tamaraCfg)
                return (
                  <label className={cn(pay('tamara'), !sp && 'cursor-not-allowed opacity-60')}>
                    <input type="radio" name="pay" checked={method === 'tamara'} disabled={!sp} onChange={() => setMethod('tamara')} className="size-5 shrink-0 accent-[var(--primary)]" />
                    <span className="grid h-9 w-16 shrink-0 place-items-center"><TamaraBadge className="h-7 max-w-16" /></span>
                    <span className="grid min-w-0">
                      <b className="truncate">قسّطها مع تمارا</b>
                      <small className="truncate text-muted-foreground">{sp ? <>{splitText(sp)} · بدون فوائد</> : min ? `متاح للطلبات من ${min.toLocaleString('en-US')} ر.س` : 'غير متاح لهذا المبلغ'}</small>
                    </span>
                  </label>
                )
              })()}
            </div>
            {isDemo && method === 'card' && <p className="mt-4 rounded-md border border-dashed border-accent bg-accent/15 p-3 text-sm text-accent-text">وضع العرض: الدفع بالبطاقة يُسجَّل كمدفوع بدون خصم أي مبلغ.</p>}
          </Panel>
        </div>

        <Panel title="طلبك" className="lg:sticky lg:top-[calc(var(--header-height)+24px)]">
          <ul className="grid gap-3">
            {lines.map(({ key, product: p, qty, chosen, unit }) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <img src={p.image} alt="" className="size-12 rounded-sm object-cover" />
                <span className="grid flex-1 gap-0.5 leading-6"><span>{p.name}{qty > 1 && <span className="text-muted-foreground"> × {qty}</span>}</span><OptionList items={chosen} /></span>
                <strong className="tabular">{money(unit * qty)}</strong>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (code.trim()) applyCoupon() } }} name="coupon" autoComplete="off" spellCheck={false} autoCapitalize="characters" enterKeyHint="done" placeholder="كود الخصم" aria-label="كود الخصم" aria-invalid={!!couponErr || undefined} dir="ltr" className="h-11 text-end" />
            <Button type="button" variant="outline" size="sm" className="h-11" onClick={applyCoupon} disabled={!code.trim()}>تطبيق</Button>
          </div>
          {couponErr && <p className="mt-2 text-sm text-danger" role="alert">{couponErr}</p>}
          <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">المجموع</dt><dd className="tabular">{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-success"><dt>خصم {coupon.code}</dt><dd className="tabular">− {money(discount)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-border pt-3"><dt className="font-bold">الإجمالي</dt><dd className="tabular font-display text-2xl font-semibold text-primary">{money(total)}</dd></div>
          </dl>
          {err && <p className="mt-3 text-sm text-danger" role="alert">{err}</p>}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-sunken p-3.5 text-sm leading-6">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErr('') }} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" required />
            <span>أوافق على <Link to="/policies" target="_blank" className="font-semibold text-primary underline">السياسات والشروط</Link> وعلى الإقرار والتعهد التالي.</span>
          </label>
          <details className="group mt-2 rounded-lg ring-1 ring-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-primary">{DECLARATION.h}<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary>
            <div className="border-t border-border px-3.5 py-3 text-[13px] leading-6 text-muted-foreground">
              <p>{DECLARATION.intro}</p>
              <ol className="mt-2 grid list-decimal gap-1.5 ps-5">{DECLARATION.items.map((x) => <li key={x}>{x}</li>)}</ol>
            </div>
          </details>
          {!agreed && <p className="mt-3 text-center text-[13px] text-muted-foreground">علّم على الموافقة فوق عشان يتفعّل زر الدفع</p>}
          <Button size="lg" className="mt-4 w-full" disabled={busy || !agreed}><Lock />{busy ? 'جاري تأكيد الطلب…' : total === 0 ? 'أكمل الطلب' : method === 'tamara' && total > 0 ? 'أكمل مع تمارا' : method === 'card' ? `ادفع ${money(total)}` : 'أكّد الطلب'}</Button>

        </Panel>
      </form>
    </div>
  )
}
