import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Bold, Eye, Heading2, Heading3, Link2, List, ListOrdered, Plus, Quote, Table2, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api.js'
import { useApp } from '@/state.jsx'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, Input, Panel, Select, Skeleton, Textarea } from '@/components/ui/kit.jsx'
import { AdminHead, useConfirm } from '@/components/admin/ui.jsx'
import Rich, { parse } from '@/components/blog/Rich.jsx'
import { POSTS, BLOG_CATEGORIES, blogPath } from '@/data/blog/index.js'
import { SITE } from '@/lib/seo.js'
import { storeUrl } from '@/lib/host.js'
import NotFound from '@/pages/NotFound.jsx'

// the built-in articles keep their text in files: open one here and saving stores an edited copy that replaces it
const files = import.meta.glob('../../data/blog/posts/*.js')
const today = () => new Date().toISOString().slice(0, 10)
const BLANK = () => ({ slug: '', title: '', seoTitle: '', description: '', keywords: '', category: 'design', body: '', faq: [], services: [], published: false, date: today() })
const toForm = (p) => ({
  slug: p.slug, title: p.title || '', seoTitle: p.seoTitle || '', description: p.description || '', keywords: p.keywords || '', category: p.category || 'design',
  body: p.body || '', faq: (p.faq || []).map((x) => ({ q: x.q, a: x.a })), services: p.services || [], published: p.published !== false, date: p.date || today(),
})
const TABLE = '| العمود الأول | العمود الثاني |\n| قيمة | قيمة |\n| قيمة | قيمة |'
const BRAND = ` | ${SITE.name}`

const Count = ({ n, max, min = 0 }) => <span className={cn('tabular text-xs font-semibold', n > max || (n && n < min) ? 'text-danger' : 'text-muted-foreground')}>{n}/{max}</span>

export default function BlogEditor() {
  const { slug } = useParams()
  const isNew = slug === 'new'
  const nav = useNavigate()
  const { products, refreshCatalog, notify } = useApp()
  const confirm = useConfirm()
  const [f, setF] = useState(null) // null = loading, false = not found
  const [saved, setSaved] = useState(false) // a copy exists in the database
  const [tab, setTab] = useState('write')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const ta = useRef(null)
  const sel = useRef(null)
  const builtIn = POSTS.some((p) => p.slug === slug)

  useEffect(() => {
    let on = true
    setF(null); setSaved(false); setErr('')
    if (isNew) { setF(BLANK()); return }
    ;(async () => {
      let list = []
      try { list = await api.listPosts() } catch (e) { if (on) setErr(e.message) }
      const mine = list.find((p) => p.slug === slug)
      if (mine) { if (on) { setF(toForm(mine)); setSaved(true) } return }
      const base = POSTS.find((p) => p.slug === slug)
      if (!base) { if (on) setF(false); return }
      const mod = await files[`../../data/blog/posts/${slug}.js`]()
      if (on) setF({ ...toForm(base), body: mod.default.trim(), published: true })
    })()
    return () => { on = false }
  }, [slug, isNew])

  const blocks = useMemo(() => (tab === 'preview' && f ? parse(f.body) : []), [tab, f?.body])
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  // ---- editor tools ----
  const put = (fn) => {
    const el = ta.current; if (!el) return
    const [text, a, b] = fn(el.value, el.selectionStart, el.selectionEnd)
    sel.current = [a, b]
    setF((x) => ({ ...x, body: text }))
  }
  // the cursor is placed after the new text is on screen
  useEffect(() => {
    if (!sel.current || !ta.current) return
    const [a, b] = sel.current; sel.current = null
    ta.current.focus(); ta.current.setSelectionRange(a, b)
  }, [f?.body])
  const wrap = (l, r = l, ph = 'نص') => put((v, a, b) => { const s = v.slice(a, b) || ph; return [v.slice(0, a) + l + s + r + v.slice(b), a + l.length, a + l.length + s.length] })
  const lines = (prefix, ph = 'نص') => put((v, a, b) => {
    const start = v.lastIndexOf('\n', a - 1) + 1
    const out = (v.slice(start, b) || ph).split('\n').map((ln, i) => (prefix === '1. ' ? `${i + 1}. ` : prefix) + ln).join('\n')
    return [v.slice(0, start) + out + v.slice(b), start, start + out.length]
  })
  const block = (txt) => put((v, a, b) => { const ins = `\n\n${txt}\n\n`; return [v.slice(0, a) + ins + v.slice(b), a + ins.length, a + ins.length] })

  const faqSet = (i, k, val) => setF((x) => ({ ...x, faq: x.faq.map((r, j) => (j === i ? { ...r, [k]: val } : r)) }))
  const toggleService = (id) => setF((x) => ({ ...x, services: x.services.includes(id) ? x.services.filter((s) => s !== id) : [...x.services, id] }))

  const save = async (publish) => {
    setErr('')
    const next = { ...f, published: publish }
    if (!next.title.trim()) return setErr('اكتب عنوان المقال')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(next.slug)) return setErr('الرابط حروف إنجليزية صغيرة وأرقام وشرطات، مثل my-article')
    if (publish && !next.body.trim()) return setErr('اكتب نص المقال قبل النشر')
    setBusy(true)
    try {
      if (isNew) {
        const taken = POSTS.some((p) => p.slug === next.slug) || (await api.listPosts()).some((p) => p.slug === next.slug)
        if (taken) throw new Error('هذا الرابط مستخدم لمقال ثاني')
      }
      await api.savePost(next)
      setF(next); setSaved(true)
      refreshCatalog()
      notify(publish ? 'تم النشر' : 'حُفظت المسودة')
      if (isNew) nav(`/admin/blog/${next.slug}`, { replace: true })
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!(await confirm({ title: `حذف «${f.title}»؟`, body: builtIn ? 'يرجع المقال لنسخته الأصلية.' : undefined }))) return
    try { await api.deletePost(slug); refreshCatalog(); notify('تم الحذف'); nav('/admin/blog') } catch (e) { setErr(e.message) }
  }

  if (f === false) return <NotFound />
  if (!f) return <div className="grid gap-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-96" /></div>

  const seoBase = f.seoTitle || f.title
  const seoLen = seoBase.length + (seoBase.length + BRAND.length <= 60 ? BRAND.length : 0)
  const live = f.published
  const tools = [
    [Heading2, 'عنوان', () => lines('## ', 'عنوان القسم')], [Heading3, 'عنوان فرعي', () => lines('### ', 'عنوان فرعي')],
    [Bold, 'عريض', () => wrap('**')], [List, 'نقاط', () => lines('- ')], [ListOrdered, 'ترقيم', () => lines('1. ')],
    [Quote, 'ملاحظة', () => lines('> ', 'ملاحظة')], [Table2, 'جدول', () => block(TABLE)], [Link2, 'رابط', () => wrap('[', '](https://)', 'نص الرابط')],
  ]

  return (
    <>
      <AdminHead
        back={<Link to="/admin/blog" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowRight className="size-4" />المدونة</Link>}
        title={isNew ? 'مقال جديد' : f.title || 'مقال'}
        action={<>
          {saved && live && <Button variant="outline" asChild><a href={storeUrl(blogPath(f.slug))} target="_blank" rel="noreferrer"><Eye className="size-4" />عرض</a></Button>}
          {live ? <Button variant="outline" disabled={busy} onClick={() => save(false)}>إلغاء النشر</Button> : <Button variant="outline" disabled={busy} onClick={() => save(false)}>حفظ كمسودة</Button>}
          <Button disabled={busy} onClick={() => save(true)}>{live ? 'حفظ التعديلات' : 'نشر'}</Button>
        </>} />
      {err && <p className="mb-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{err}</p>}

      <div className="grid gap-5">
        <Panel title="المقال">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان" className="sm:col-span-2"><Input value={f.title} onChange={set('title')} maxLength={200} /></Field>
            <Field label="الرابط"><Input value={f.slug} onChange={(e) => setF((x) => ({ ...x, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} dir="ltr" placeholder="my-article" disabled={!isNew} maxLength={80} /></Field>
            <Field label="القسم"><Select value={f.category} onChange={set('category')}>{Object.entries(BLOG_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</Select></Field>
            <Field label="تاريخ النشر"><Input type="date" value={f.date} onChange={set('date')} className="w-full min-w-0 max-w-full appearance-none text-start [&::-webkit-date-and-time-value]:text-start" /></Field>
          </div>
        </Panel>

        <Panel title="النص">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-full bg-sunken p-1" role="tablist">
              {[['write', 'كتابة'], ['preview', 'معاينة']].map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('h-8 rounded-full px-4 text-sm font-semibold', tab === k ? 'bg-primary text-on-inverse' : 'text-muted-foreground hover:text-primary')}>{label}</button>
              ))}
            </div>
            {tab === 'write' && (
              <div className="flex flex-wrap items-center gap-1">
                {tools.map(([Icon, label, run]) => (
                  <button key={label} type="button" onClick={run} title={label} aria-label={label} className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sunken hover:text-primary"><Icon className="size-[18px]" /></button>
                ))}
                <Select aria-label="إدراج خدمة" value="" onChange={(e) => { if (e.target.value) block(`[[service:${e.target.value}]]`); e.target.value = '' }} className="h-9 w-40 rounded-md text-sm">
                  <option value="">إدراج خدمة</option>
                  {products.filter((p) => p.active !== false).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
            )}
          </div>
          {tab === 'write'
            ? <Textarea ref={ta} value={f.body} onChange={set('body')} aria-label="نص المقال" className="min-h-[520px] font-mono text-[14.5px] leading-8" spellCheck="false" />
            : <article className="min-h-[520px] rounded-md border-[1.5px] border-border bg-background p-5 text-[17px] leading-[2] text-foreground/90">{f.body.trim() ? <Rich blocks={blocks} /> : <p className="text-muted-foreground">لا يوجد نص</p>}</article>}
        </Panel>

        <Panel title="محركات البحث">
          <div className="grid gap-4">
            <Field label={<span className="flex items-center justify-between gap-3">العنوان في قوقل<Count n={seoLen} max={60} /></span>}><Input value={f.seoTitle} onChange={set('seoTitle')} placeholder={f.title} maxLength={120} /></Field>
            <Field label={<span className="flex items-center justify-between gap-3">الوصف<Count n={f.description.length} max={158} min={70} /></span>}><Textarea value={f.description} onChange={set('description')} maxLength={400} className="min-h-24" /></Field>
            <Field label="الكلمات المفتاحية"><Input value={f.keywords} onChange={set('keywords')} maxLength={600} /></Field>
          </div>
        </Panel>

        <Panel title="الأسئلة الشائعة" action={<Button type="button" size="sm" variant="outline" onClick={() => setF((x) => ({ ...x, faq: [...x.faq, { q: '', a: '' }] }))}><Plus className="size-4" />سؤال</Button>}>
          {f.faq.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد أسئلة</p> : (
            <ul className="grid gap-3">
              {f.faq.map((r, i) => (
                <li key={i} className="grid gap-2 rounded-md bg-sunken/60 p-3">
                  <div className="flex items-center gap-2">
                    <Input value={r.q} onChange={(e) => faqSet(i, 'q', e.target.value)} placeholder="السؤال" aria-label="السؤال" className="bg-surface" />
                    <button type="button" onClick={() => setF((x) => ({ ...x, faq: x.faq.filter((_, j) => j !== i) }))} aria-label="حذف السؤال" className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger"><X className="size-4" /></button>
                  </div>
                  <Textarea value={r.a} onChange={(e) => faqSet(i, 'a', e.target.value)} placeholder="الجواب" aria-label="الجواب" className="min-h-20 bg-surface" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="الخدمات المرتبطة">
          <div className="flex flex-wrap gap-2">
            {products.filter((p) => p.active !== false).map((p) => {
              const on = f.services.includes(p.id)
              return <button key={p.id} type="button" aria-pressed={on} onClick={() => toggleService(p.id)} className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition-colors', on ? 'bg-primary text-on-inverse ring-primary' : 'bg-surface text-primary ring-border hover:ring-primary/40')}>{p.name}</button>
            })}
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {live ? <Button variant="outline" disabled={busy} onClick={() => save(false)}>إلغاء النشر</Button> : <Button variant="outline" disabled={busy} onClick={() => save(false)}>حفظ كمسودة</Button>}
            <Button disabled={busy} onClick={() => save(true)}>{live ? 'حفظ التعديلات' : 'نشر'}</Button>
          </div>
          {saved && <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={remove}><Trash2 className="size-4" />{builtIn ? 'استرجاع الأصلي' : 'حذف'}</Button>}
        </div>
      </div>
    </>
  )
}
