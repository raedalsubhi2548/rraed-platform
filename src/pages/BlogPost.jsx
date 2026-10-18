import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, CalendarDays, ChevronDown, ExternalLink, MessageCircle, ArrowLeft } from 'lucide-react'
import Cover from '@/components/blog/Cover.jsx'
import Rich, { parse } from '@/components/blog/Rich.jsx'
import { BLOG_CATEGORIES, blogPath } from '@/data/blog/index.js'
import { useApp } from '@/state.jsx'
import { api } from '@/lib/api.js'
import { longDate } from '@/pages/Blog.jsx'
import NotFound from '@/pages/NotFound.jsx'
import { waLink } from '@/lib/format.js'
import { cn } from '@/lib/utils'

// each article's text loads only on its own page
const files = import.meta.glob('../data/blog/posts/*.js')
const bodies = {}
const bodyOf = (slug) => (bodies[slug] ||= lazy(() => files[`../data/blog/posts/${slug}.js`]().then((m) => {
  const blocks = parse(m.default)
  return { default: ({ children }) => children(blocks) }
})))

function Progress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const on = () => { const h = document.documentElement; setP(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))) }
    on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on)
  }, [])
  return <span className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-right bg-accent" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
}

function Toc({ items, open, setOpen, side }) {
  if (items.length < 3) return null
  const list = (
    <ol className="grid gap-1 text-[14px] leading-7">
      {items.map((h, i) => <li key={h.id}><a href={`#${h.id}`} onClick={() => setOpen?.(false)} className="flex gap-2 rounded-lg px-2 py-1 text-foreground/75 hover:bg-primary/[0.05] hover:text-primary"><span className="tabular text-primary/40">{i + 1}</span>{h.text}</a></li>)}
    </ol>
  )
  if (side) return <nav aria-label="محتوى المقال"><p className="mb-2 px-2 text-[13px] font-bold text-muted-foreground">محتوى المقال</p>{list}</nav>
  return (
    <>
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group my-6 rounded-[16px] bg-white ring-1 ring-primary/[0.08] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-semibold text-primary">محتوى المقال<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary>
        <div className="border-t border-primary/[0.06] p-2">{list}</div>
      </details>
    </>
  )
}

// a dashboard article's text arrives on its own page (pre-rendered pages already carry it); a built-in one loads from its file
const inlineBody = (text) => { const blocks = parse(text); return ({ children }) => children(blocks) }
const Pending = () => <div className="container-w mt-10"><div className="mx-auto h-96 max-w-[720px] animate-pulse rounded-2xl bg-primary/[0.04]" /></div>

export default function BlogPost() {
  const { slug } = useParams()
  const { posts, catalogReady } = useApp()
  const post = posts.find((p) => p.slug === slug)
  if (!post) return catalogReady ? <NotFound /> : <Pending />
  return <Article key={post.slug} post={post} posts={posts} />
}

function Article({ post, posts }) {
  const [tocOpen, setTocOpen] = useState(false)
  const [text, setText] = useState(post.custom ? post.body : undefined)
  useEffect(() => {
    if (!post.custom) return
    let on = true
    api.getPostBody(post.slug).then((b) => { if (on && b != null) setText(b) }).catch(() => {})
    return () => { on = false }
  }, [post.slug, post.custom])
  const Body = useMemo(() => (post.custom ? (text == null ? Pending : inlineBody(text)) : bodyOf(post.slug)), [post.slug, post.custom, text])
  const cat = BLOG_CATEGORIES[post.category]
  const related = posts.filter((p) => p.slug !== post.slug).sort((a, b) => (b.category === post.category) - (a.category === post.category)).slice(0, 3)

  return (
    <div className="pb-16">
      <Progress />
      <header className="container-w pt-6 sm:pt-10">
        <nav className="mb-5 text-[13px] text-muted-foreground" aria-label="المسار">
          <Link to="/" className="hover:text-primary">الرئيسية</Link><span className="mx-1.5 opacity-50">/</span>
          <Link to={blogPath()} className="hover:text-primary">المدونة</Link><span className="mx-1.5 opacity-50">/</span>
          <span>{cat?.name}</span>
        </nav>
        <div className="mx-auto max-w-[860px] text-center">
          <h1 className="font-display text-[1.85rem] font-bold leading-[1.55] text-primary sm:text-[2.6rem]">{post.title}</h1>
          <p className="mx-auto mt-4 max-w-[680px] text-[16.5px] leading-8 text-muted-foreground">{post.description}</p>
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13.5px] text-muted-foreground">
            <span className="font-semibold text-primary">منصة رائد</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /><time dateTime={post.date}>{longDate(post.date)}</time></span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />{post.minutes} دقائق قراءة</span>
          </p>
        </div>
        <Cover post={post} big className="mx-auto mt-8 aspect-[3/1] max-w-[1100px] rounded-[24px] max-sm:aspect-[16/9]" />
      </header>

      <Suspense fallback={<div className="container-w mt-10"><div className="mx-auto h-96 max-w-[720px] animate-pulse rounded-2xl bg-primary/[0.04]" /></div>}>
        <Body>
          {(blocks) => {
            const toc = blocks.filter((b) => b.t === 'h2')
            return (
              <div className="container-w mt-10 grid gap-10 lg:grid-cols-[minmax(0,720px)_260px] lg:justify-center">
                <article className="min-w-0 text-[17px] leading-[2] text-foreground/90">
                  <Toc items={toc} open={tocOpen} setOpen={setTocOpen} />
                  <Rich blocks={blocks} />

                  {post.faq?.length > 0 && (
                    <section className="mt-14" aria-labelledby="faq">
                      <h2 id="faq" className="mb-4 scroll-mt-28 font-display text-[1.55rem] font-bold text-primary sm:text-[1.75rem]">أسئلة شائعة</h2>
                      <div className="grid gap-2.5">
                        {post.faq.map((f) => (
                          <details key={f.q} className="group rounded-[16px] bg-white ring-1 ring-primary/[0.08] open:ring-primary/20">
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 text-[16px] font-semibold leading-7 text-primary">{f.q}<ChevronDown className="mt-1.5 size-4 shrink-0 transition-transform group-open:rotate-180" /></summary>
                            <p className="px-5 pb-5 text-[15.5px] leading-8 text-foreground/80">{f.a}</p>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {post.sources?.length > 0 && (
                    <footer className="mt-12 rounded-[16px] bg-primary/[0.035] p-5 text-[14px] leading-7">
                      <p className="font-bold text-primary">المصادر</p>
                      <ul className="mt-2 grid gap-1.5">
                        {post.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-foreground/75 underline-offset-4 hover:text-primary hover:underline">مركز مساعدة سلة: {s.title}<ExternalLink className="size-3.5" /></a></li>)}
                      </ul>
                    </footer>
                  )}
                </article>

                <aside className="hidden lg:block">
                  <div className="sticky top-[calc(var(--header-height)+24px)] grid gap-6">
                    <Toc items={toc} side />
                    <div className="rounded-[18px] bg-white p-5 ring-1 ring-primary/[0.08]">
                      <p className="font-display text-[1.05rem] font-bold leading-7 text-primary">عندك سؤال عن متجرك؟</p>
                      <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">كلّمنا واتساب ونرد عليك.</p>
                      <a href={waLink(`السلام عليكم، قرأت مقال «${post.title}» وعندي سؤال`)} target="_blank" rel="noopener" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-semibold text-on-inverse hover:bg-primary-hover"><MessageCircle className="size-4" />راسلنا واتساب</a>
                    </div>
                  </div>
                </aside>
              </div>
            )
          }}
        </Body>
      </Suspense>

      <section className="container-w mt-16" aria-labelledby="more">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="more" className="font-display text-[1.45rem] font-bold text-primary">مقالات تهمك</h2>
            <Link to={blogPath()} className="flex items-center gap-1 text-[14px] font-semibold text-primary hover:underline">كل المقالات<ArrowLeft className="size-4" /></Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug} className="group relative overflow-hidden rounded-[18px] bg-white ring-1 ring-primary/[0.07]">
                <Cover post={p} className="m-1.5 aspect-[16/8] rounded-[13px]" />
                <div className="p-4">
                  <Link to={blogPath(p.slug)} className="font-display text-[1rem] font-bold leading-7 text-primary after:absolute after:inset-0 group-hover:underline">{p.title}</Link>
                  <p className={cn('mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground')}><Clock className="size-3.5" />{p.minutes} دقائق</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
