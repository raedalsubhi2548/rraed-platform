// لوحة التحكم ← العملاء ← «عملاء سلة»: customers of the old Salla store, uploaded from Salla's Excel export.
// Contacts for marketing (email / mobile), not site accounts. The owner uploads; the customers area can view,
// export and mark who asked not to receive marketing (those are left out of the exports).
import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Upload, Download, Users, BellOff, Bell } from 'lucide-react'
import { api } from '@/lib/api.js'
import { money, date } from '@/lib/format.js'
import { cn } from '@/lib/utils'
import { useApp } from '@/state.jsx'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/kit.jsx'
import { IconBtn, SearchBox, TableCard, Table, Th, Td } from '@/components/admin/ui.jsx'
import { readSallaCustomers, downloadCsv } from '@/lib/sallaExcel.js'

const wa = (p) => `https://wa.me/${p.replace(/\D/g, '').replace(/^0/, '966')}`
const FILTERS = [['all', 'الكل'], ['buyers', 'اشتروا'], ['email', 'عندهم إيميل']]

export default function SallaCustomers({ owner }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const file = useRef(null)
  const { notify } = useApp()
  const load = () => api.listSallaCustomers().then((l) => { setLoadErr(''); setList(l) }).catch((e) => { setLoadErr(e.message); setList([]) })
  useEffect(() => { load() }, [])

  const upload = async (f) => {
    if (!f) return
    setBusy(true)
    try {
      const rows = await readSallaCustomers(f)
      const n = await api.importSallaCustomers(rows)
      notify(`تم رفع ${n} عميل`)
      await load()
    } catch (e) { notify(e.message, 'err') } finally { setBusy(false); if (file.current) file.current.value = '' }
  }
  const toggleOut = async (c) => {
    try { await api.setSallaOptOut(c.id, !c.optedOut); setList((l) => l.map((x) => (x.id === c.id ? { ...x, optedOut: !c.optedOut } : x))) } catch (e) { notify(e.message, 'err') }
  }

  const shown = useMemo(() => (list || []).filter((c) =>
    (filter === 'all' || (filter === 'buyers' ? c.orders > 0 : !!c.email)) &&
    (!q || ((c.name || '') + (c.mobile || '') + (c.email || '') + (c.city || '')).includes(q))), [list, q, filter])
  const reachable = (list || []).filter((c) => !c.optedOut)
  const stamp = new Date().toISOString().slice(0, 10)
  const exportEmails = () => downloadCsv(`salla-emails-${stamp}.csv`, ['name', 'email', 'city'], reachable.filter((c) => c.email).map((c) => [c.name, c.email, c.city || '']))
  const exportMobiles = () => downloadCsv(`salla-mobiles-${stamp}.csv`, ['name', 'mobile', 'city'], reachable.filter((c) => c.mobile).map((c) => [c.name, c.mobile, c.city || '']))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="الاسم، الجوال، الإيميل، أو المدينة" className="w-full max-w-md" />
        <div className="flex rounded-full bg-sunken p-1" role="tablist" aria-label="تصفية">
          {FILTERS.map(([id, l]) => <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)} className={cn('h-9 rounded-full px-3 text-xs font-bold', filter === id ? 'bg-surface text-primary shadow-hairline' : 'text-muted-foreground')}>{l}</button>)}
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          {list?.length > 0 && <>
            <Button size="sm" variant="outline" onClick={exportEmails}><Download className="size-4" />الإيميلات ({reachable.filter((c) => c.email).length})</Button>
            <Button size="sm" variant="outline" onClick={exportMobiles}><Download className="size-4" />الجوالات ({reachable.filter((c) => c.mobile).length})</Button>
          </>}
          {owner && <>
            <input ref={file} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Button size="sm" disabled={busy} onClick={() => file.current?.click()}><Upload className="size-4" />{busy ? 'جاري الرفع…' : 'رفع ملف سلة'}</Button>
          </>}
        </div>
      </div>
      {list && list.length > 0 && <p className="mb-3 text-sm text-muted-foreground">{list.length} عميل · {list.filter((c) => c.orders > 0).length} اشتروا · {list.filter((c) => c.email).length} عندهم إيميل · {list.filter((c) => c.optedOut).length} لا يستقبلون تسويق</p>}

      {!list ? <Skeleton className="h-96" /> : shown.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-lg border-2 border-dashed border-border-strong py-16 text-center"><Users className="size-8 text-muted-foreground" /><p className="text-muted-foreground">{loadErr || 'ما فيه عملاء هنا.'}</p></div>
      ) : (
        <>
          <ul className="grid gap-2 md:hidden">
            {shown.map((c) => (
              <li key={c.id} className={cn('flex items-center gap-3 rounded-lg bg-surface p-4 shadow-hairline ring-1 ring-border', c.optedOut && 'opacity-60')}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken font-display font-semibold text-primary">{(c.name || '؟').charAt(0)}</span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="tabular text-xs text-muted-foreground">{c.city || '—'} · {c.orders} طلب · {money(c.spent)}</p></div>
                {c.mobile && <a href={wa(c.mobile)} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-primary text-accent" aria-label={`واتساب ${c.name}`}><MessageCircle className="size-4" /></a>}
                <IconBtn onClick={() => toggleOut(c)} aria-label={c.optedOut ? 'يستقبل تسويق' : 'لا يستقبل تسويق'} title={c.optedOut ? 'يستقبل تسويق' : 'لا يستقبل تسويق'}>{c.optedOut ? <Bell className="size-4" /> : <BellOff className="size-4" />}</IconBtn>
              </li>
            ))}
          </ul>
          <TableCard className="hidden md:block">
            <Table>
              <thead><tr><Th>العميل</Th><Th>الجوال</Th><Th>المدينة</Th><Th>الطلبات</Th><Th>إجمالي المشتريات</Th><Th>آخر طلب</Th><Th className="w-12"><span className="sr-only">التسويق</span></Th></tr></thead>
              <tbody>{shown.map((c) => (
                <tr key={c.id} className={cn('hover:bg-sunken/50', c.optedOut && 'opacity-60')}>
                  <Td>
                    <div className="min-w-0"><p className="font-semibold">{c.name}{c.optedOut && <span className="ms-2 inline-flex rounded-full bg-sunken px-2 py-0.5 align-middle text-[11px] font-bold text-muted-foreground ring-1 ring-border">لا يستقبل تسويق</span>}</p><p className="text-xs text-muted-foreground" dir="ltr">{c.email}</p></div>
                  </Td>
                  <Td>{c.mobile ? <a className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline" href={wa(c.mobile)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /><span dir="ltr">{c.mobile}</span></a> : <span className="text-muted-foreground">—</span>}</Td>
                  <Td>{c.city || <span className="text-muted-foreground">—</span>}</Td>
                  <Td className="tabular">{c.orders}</Td>
                  <Td className="tabular font-semibold text-primary">{money(c.spent)}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{c.lastOrder ? date(c.lastOrder) : '—'}</Td>
                  <Td><IconBtn onClick={() => toggleOut(c)} aria-label={c.optedOut ? 'يستقبل تسويق' : 'لا يستقبل تسويق'} title={c.optedOut ? 'يستقبل تسويق' : 'لا يستقبل تسويق'}>{c.optedOut ? <Bell className="size-4" /> : <BellOff className="size-4" />}</IconBtn></Td>
                </tr>
              ))}</tbody>
            </Table>
          </TableCard>
        </>
      )}
    </>
  )
}
