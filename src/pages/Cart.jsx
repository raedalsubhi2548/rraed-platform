import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { useApp } from '@/state.jsx'
import { TamaraWidget } from '@/components/brand/Tamara.jsx'
import { money } from '@/lib/format.js'
import { productPath } from '@/lib/slug.js'
import OptionList from '@/components/OptionList.jsx'
import { Button } from '@/components/ui/button'
import { PageHead, Empty, Qty, Input, Panel } from '@/components/ui/kit.jsx'

export default function Cart() {
  const { lines, subtotal, setQty, setNote } = useApp()
  return (
    <div className="container-w py-10 sm:py-14">
      <PageHead title="السلة" />
      {lines.length === 0 ? (
        <Empty icon={ShoppingBag} title="سلتك فاضية" action={<Button asChild><Link to="/shop">تصفّح الخدمات</Link></Button>}>ابدأ بالخدمة اللي يحتاجها متجرك.</Empty>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <ul className="grid gap-3">
            {lines.map(({ key, product: p, qty, note, chosen, unit }) => (
              <li key={key} className="grid grid-cols-[72px_1fr] gap-4 rounded-lg bg-surface p-4 shadow-hairline ring-1 ring-border sm:grid-cols-[88px_1fr_auto]">
                <img src={p.image} alt="" className="size-[72px] rounded-md object-cover sm:size-[88px]" />
                <div className="grid min-w-0 gap-1.5">
                  <Link to={productPath(p.id)} className="font-semibold leading-6 hover:underline">{p.name}</Link>
                  <OptionList items={chosen} />
                  <span className="tabular text-sm text-muted-foreground">{money(unit)} {p.perUnit || ''}</span>
                  <Input value={note || ''} onChange={(e) => setNote(key, e.target.value)} placeholder="ملاحظة على هذه الخدمة (اختياري)" aria-label={`ملاحظة على ${p.name}`} className="h-10 text-sm" />
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:grid sm:justify-items-end">
                  <strong className="tabular font-display text-lg text-primary">{money(unit * qty)}</strong>
                  <div className="flex items-center gap-2">
                    <Qty size="sm" value={qty} onChange={(q) => setQty(key, q)} />
                    <button onClick={() => setQty(key, 0)} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${p.name}`}><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Panel title="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--header-height)+24px)]">
            <div className="flex items-center justify-between border-b border-border pb-4"><span className="text-muted-foreground">المجموع</span><strong className="tabular font-display text-2xl text-primary">{money(subtotal)}</strong></div>
            <TamaraWidget amount={subtotal} className="mt-4" />
            <p className="my-4 text-sm text-muted-foreground">كود الخصم وطريقة الدفع في الخطوة التالية.</p>
            <div className="grid gap-2">
              <Button asChild size="lg"><Link to="/checkout">إتمام الطلب</Link></Button>
              <Button asChild variant="ghost"><Link to="/shop">أكمل التسوّق</Link></Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
