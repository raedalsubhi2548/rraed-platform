import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Check, Clock, Download, MessageCircle, FileText, Lock } from 'lucide-react'
import { api } from '@/lib/api.js'
import { useApp } from '@/state.jsx'
import { cn } from '@/lib/utils'
import { money, dateTime, waLink } from '@/lib/format.js'
import { Button } from '@/components/ui/button'
import OptionList from '@/components/OptionList.jsx'
import { trackPurchase } from '@/lib/analytics.js'
import { Panel, OrderTracker, StatusPill, statusLabel, Skeleton, Empty } from '@/components/ui/kit.jsx'

export { statusLabel }
export const StatusTrack = OrderTracker

function DownloadButton({ orderId, productId }) {
  const { notify } = useApp()
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    // open the tab inside the tap itself (Safari blocks one opened after a wait), then send it to the file
    const tab = window.open('', '_blank')
    try { const url = await api.downloadUrl(orderId, productId); if (tab) { tab.opener = null; tab.location.href = url } else window.location.href = url } catch (e) { tab?.close(); notify(e.message, 'err') } finally { setBusy(false) }
  }
  return <Button variant="accent" size="sm" className="mt-2 h-9" onClick={go} disabled={busy}><Download />{busy ? 'لحظة…' : 'تحميل الملف'}</Button>
}

function InvoiceButton({ order }) {
  const { notify } = useApp()
  const [busy, setBusy] = useState(false)
  const go = async () => { setBusy(true); try { await api.downloadInvoice(order) } catch (e) { notify(e.message, 'err') } finally { setBusy(false) } }
  return <Button variant="outline" onClick={go} disabled={busy}><FileText />{busy ? 'نجهّز الفاتورة…' : 'تحميل الفاتورة PDF'}</Button>
}

export default function Order() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user, authReady, clearCart, notify } = useApp()
  const [paying, setPaying] = useState(false)
  const [order, setOrder] = useState(undefined)
  const [verifying, setVerifying] = useState(false)
  const isNew = params.get('new') || params.get('tap_id')

  useEffect(() => {
    if (!authReady) return
    let alive = true
    let paidNow = false
    const load = () => api.getOrder(id).then((o) => { if (paidNow && o && o.status !== 'pending') trackPurchase(o); if (alive) setOrder(o) }).catch(() => alive && setOrder(null))
    const tap = params.get('tap_id')
    if (tap && api.verifyPayment) {
      setVerifying(true)
      api.verifyPayment(id, tap).then((r) => {
        if (r?.ok) { paidNow = true; clearCart(); try { sessionStorage.removeItem('raed:pending-order') } catch { /* ignore */ } }
      }).finally(() => { if (alive) setVerifying(false); load() })
    } else load()
    return () => { alive = false }
  }, [id, authReady, user?.id, params])

  if (order === undefined || verifying) return <div className="container-w grid gap-4 py-14"><p className="text-center text-muted-foreground">{verifying ? 'نتأكد من عملية الدفع…' : 'جاري التحميل…'}</p><Skeleton className="h-72" /></div>
  if (!order) return <div className="container-w py-14"><Empty title="ما لقينا الطلب" action={<Button asChild><Link to="/account">طلباتي</Link></Button>}>تأكد إنك مسجّل دخول بنفس الحساب اللي طلبت فيه.</Empty></div>

  const paid = order.status !== 'pending' && order.status !== 'cancelled'
  const payNow = async () => {
    setPaying(true)
    try { const { redirect, free } = await api.startPayment(order); if (free) { setOrder(await api.getOrder(order.id)); setPaying(false); return } window.location.href = redirect } catch (e) { notify(e.message, 'err'); setPaying(false) }
  }
  return (
    <div className="container-w py-10 sm:py-14">
      {isNew ? (
        <div className={cn('mb-8 flex items-center gap-4 rounded-xl p-6 sm:p-8', paid ? 'bg-inverse text-on-inverse' : 'bg-sunken')}>
          <span className={cn('grid size-14 shrink-0 place-items-center rounded-full', paid ? 'bg-accent text-accent-foreground' : 'bg-surface text-primary')}>{paid ? <Check className="size-7" strokeWidth={3} /> : <Clock className="size-7" />}</span>
          <div>
            <h1 className={cn('font-display text-2xl font-semibold sm:text-3xl', !paid && 'text-primary')}>{paid ? 'وصلنا طلبك' : 'استلمنا طلبك وبانتظار الدفع'}</h1>
            <p className={cn('mt-1', paid ? 'text-on-inverse/80' : 'text-muted-foreground')}>
              <span className="tabular">رقم الطلب #{order.number}.</span> {paid ? 'بنتواصل معك قريباً لبدء التنفيذ.' : 'ما اكتملت عملية الدفع، تقدر تكملها الحين.'}
            </p>
          </div>
        </div>
      ) : (
        <h1 className="tabular mb-8 font-display text-display-sm font-semibold text-primary">طلب #{order.number}</h1>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <Panel title="حالة الطلب" action={<StatusPill status={order.status} />}>
          <OrderTracker status={order.status} />
          {paid && <div className="mt-5"><InvoiceButton order={order} /></div>}
          {order.status === 'pending' && order.paymentMethod === 'card' && (
            <div className="mt-5"><Button size="lg" onClick={payNow} disabled={paying}><Lock />{paying ? 'نحوّلك لبوابة الدفع…' : `أكمل الدفع ${money(order.total)}`}</Button></div>
          )}
          <h3 className="mt-8 mb-3 font-display font-semibold text-primary">السجل</h3>
          <ol className="relative grid gap-4 border-s-2 border-border-strong ps-5">
            {[...(order.history || [])].reverse().map((h, i) => (
              <li key={i} className="relative">
                <span className={cn('absolute -start-[27px] top-1.5 size-3 rounded-full ring-4 ring-surface', i === 0 ? 'bg-accent' : 'bg-primary')} />
                <div className="flex flex-wrap items-baseline justify-between gap-2"><b>{statusLabel(h.status)}</b><span className="tabular text-xs text-muted-foreground">{dateTime(h.at)}</span></div>
                {h.note && <p className="mt-1 text-sm text-muted-foreground">{h.note}</p>}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="تفاصيل الطلب">
          <ul className="grid gap-4">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-3 text-sm">
                {it.image ? <img src={it.image} alt="" className="size-12 rounded-sm object-cover" /> : <span className="size-12 rounded-sm bg-sunken" />}
                <div className="flex-1">
                  <p className="leading-6">{it.name}{it.qty > 1 && <span className="text-muted-foreground"> × {it.qty}</span>}</p>
                  <OptionList items={it.options} />
                  {it.note && <p className="text-xs text-muted-foreground">{it.note}</p>}
                  {it.digital && paid && <DownloadButton orderId={order.id} productId={it.productId} />}
                </div>
                <strong className="tabular">{money(it.price * it.qty)}</strong>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid gap-2 border-t border-border pt-4">
            {order.discount > 0 && <div className="flex justify-between text-success"><dt>خصم {order.coupon}</dt><dd className="tabular">− {money(order.discount)}</dd></div>}
            <div className="flex items-baseline justify-between"><dt className="font-bold">الإجمالي</dt><dd className="tabular font-display text-2xl font-semibold text-primary">{money(order.total)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">{order.paymentMethod === 'card' ? 'بطاقة / Apple Pay' : 'تحويل بنكي'} · <span className="tabular">{dateTime(order.createdAt)}</span></p>
          <Button asChild variant="outline" className="mt-5 w-full"><Link to="/account">كل طلباتي</Link></Button>
        </Panel>
      </div>
    </div>
  )
}
