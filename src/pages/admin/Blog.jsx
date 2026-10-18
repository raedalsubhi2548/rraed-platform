import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Newspaper } from 'lucide-react'
import { api } from '@/lib/api.js'
import { useApp } from '@/state.jsx'
import { date } from '@/lib/format.js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/kit.jsx'
import { AdminHead, SearchBox, Segments, TableCard, Table, Th, Td, IconBtn, useConfirm } from '@/components/admin/ui.jsx'
import { POSTS, BLOG_CATEGORIES, blogPath } from '@/data/blog/index.js'
import { storeUrl } from '@/lib/host.js'

const Pill = ({ tone, children }) => (
  <span className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold', tone === 'on' ? 'bg-success-soft text-success' : tone === 'draft' ? 'bg-accent/25 text-accent-text' : 'bg-sunken text-muted-foreground')}>{children}</span>
)

export default function Blog() {
  const { refreshCatalog, notify } = useApp()
  const confirm = useConfirm()
  const nav = useNavigate()
  const [mine, setMine] = useState(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const load = () => api.listPosts().then((l) => { setErr(''); setMine(l) }).catch((e) => { setErr(e.message); setMine([]) })
  useEffect(() => { load() }, [])

  // dashboard articles first, then the built-in ones that have no copy of their own
  const rows = useMemo(() => {
    const own = new Set((mine || []).map((p) => p.slug))
    const builtIn = new Set(POSTS.map((p) => p.slug))
    return [
      ...(mine || []).map((p) => ({ ...p, kind: builtIn.has(p.slug) ? 'copy' : 'own', status: p.published ? 'on' : 'draft' })),
      ...POSTS.filter((p) => !own.has(p.slug)).map((p) => ({ ...p, kind: 'built', status: 'on' })),
    ].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [mine])
  const shown = rows.filter((r) => (!st || r.status === st) && (!q || r.title.includes(q)))
  const n = (s) => rows.filter((r) => r.status === s).length

  const remove = async (r) => {
    if (!(await confirm({ title: `حذف «${r.title}»؟`, body: r.kind === 'copy' ? 'يرجع المقال لنسخته الأصلية.' : undefined }))) return
    try { await api.deletePost(r.slug); await load(); refreshCatalog(); notify('تم الحذف') } catch (e) { notify(e.message, 'err') }
  }

  return (
    <>
      <AdminHead title="المدونة" lead={mine ? `${rows.length} مقال · ${n('on')} منشور` : undefined}
        action={<Button asChild><Link to="/admin/blog/new"><Plus className="size-4" />مقال جديد</Link></Button>} />
      {err && <p className="mb-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{err}</p>}
      <div className="mb-4 grid gap-3">
        <Segments value={st} onChange={setSt} options={[{ id: '', label: 'الكل', count: rows.length }, { id: 'on', label: 'منشور', count: n('on') }, { id: 'draft', label: 'مسودة', count: n('draft') }]} />
        <SearchBox value={q} onChange={setQ} placeholder="ابحث بعنوان المقال" />
      </div>

      {!mine ? <Skeleton className="h-96" /> : shown.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border-2 border-dashed border-border-strong py-16 text-center"><Newspaper className="size-8 text-muted-foreground" /><p className="text-muted-foreground">لا توجد مقالات</p></div>
      ) : (
        <>
          <ul className="grid gap-2 md:hidden">
            {shown.map((r) => (
              <li key={r.slug} className="grid gap-2 rounded-lg bg-surface p-3.5 shadow-hairline ring-1 ring-border">
                <button onClick={() => nav(`/admin/blog/${r.slug}`)} className="text-start text-sm font-semibold leading-7">{r.title}</button>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Pill tone={r.status}>{r.status === 'on' ? 'منشور' : 'مسودة'}</Pill>
                  <span>{BLOG_CATEGORIES[r.category]?.name}</span><span>·</span><span>{date(r.date)}</span>
                </div>
              </li>
            ))}
          </ul>
          <TableCard className="hidden md:block">
            <Table>
              <thead><tr><Th>المقال</Th><Th>القسم</Th><Th>الحالة</Th><Th>التاريخ</Th><Th className="text-end"><span className="sr-only">إجراءات</span></Th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.slug} className="hover:bg-sunken/50">
                    <Td>
                      <Link to={`/admin/blog/${r.slug}`} className="line-clamp-2 max-w-[460px] font-semibold leading-7 hover:text-primary hover:underline">{r.title}</Link>
                      {r.kind === 'built' && <span className="text-[11px] text-muted-foreground">مدمج في الموقع</span>}
                      {r.kind === 'copy' && <span className="text-[11px] text-muted-foreground">نسخة معدّلة</span>}
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{BLOG_CATEGORIES[r.category]?.name}</Td>
                    <Td><Pill tone={r.status}>{r.status === 'on' ? 'منشور' : 'مسودة'}</Pill></Td>
                    <Td className="tabular whitespace-nowrap text-muted-foreground">{date(r.date)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {r.status === 'on' && <IconBtn onClick={() => window.open(storeUrl(blogPath(r.slug)), '_blank')} aria-label="عرض في المتجر"><Eye className="size-4" /></IconBtn>}
                        <IconBtn onClick={() => nav(`/admin/blog/${r.slug}`)} aria-label="تعديل"><Pencil className="size-4" /></IconBtn>
                        {r.kind !== 'built' && <IconBtn tone="danger" onClick={() => remove(r)} aria-label="حذف"><Trash2 className="size-4" /></IconBtn>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}
    </>
  )
}
