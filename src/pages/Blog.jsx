import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import PageIntro from '@/components/site/PageIntro.jsx'
import Cover from '@/components/blog/Cover.jsx'
import { BLOG_CATEGORIES, blogPath } from '@/data/blog/index.js'
import { useApp } from '@/state.jsx'
import { cn } from '@/lib/utils'

export const longDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' })

function Card({ post, lead }) {
  return (
    <article className={cn('group relative flex overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_color-mix(in_srgb,var(--p-green-900)_8%,transparent),0_24px_44px_-30px_color-mix(in_srgb,var(--p-green-900)_55%,transparent)] ring-1 ring-primary/[0.07] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1', lead ? 'flex-col lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr]' : 'flex-col')}>
      <Cover post={post} big={lead} className={cn('m-2 rounded-[16px]', lead ? 'aspect-[16/9] lg:aspect-auto lg:min-h-[320px]' : 'aspect-[16/9]')} />
      <div className={cn('flex flex-1 flex-col p-5', lead && 'lg:justify-center lg:p-9')}>
        <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground"><Clock className="size-3.5" />{post.minutes} دقائق قراءة</p>
        <h2 className={cn('mt-2 font-display font-bold leading-[1.6] text-primary', lead ? 'text-[1.45rem] sm:text-[1.75rem]' : 'text-[1.15rem]')}>
          <Link to={blogPath(post.slug)} className="after:absolute after:inset-0">{post.title}</Link>
        </h2>
        <p className={cn('mt-2 leading-7 text-muted-foreground', lead ? 'text-[15.5px]' : 'line-clamp-3 text-[14px]')}>{post.description}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-bold text-primary">اقرأ المقال<ArrowLeft className="size-4 transition-[translate] group-hover:-translate-x-1" /></span>
      </div>
    </article>
  )
}

export default function Blog() {
  const { posts } = useApp()
  const [cat, setCat] = useState('')
  const list = posts.filter((p) => !cat || p.category === cat)
  return (
    <div className="container-w pb-16">
      <PageIntro crumb="المدونة" title="المدونة" lead="مقالات لتجار سلة عن اللي يكبّر متجرك: تصميم يبيع، بكسل وأدوات قوقل تخلي إعلانك يربح، وتوثيق يرفع ثقة عملائك." />
      <nav className="mb-8 flex flex-wrap justify-center gap-2" aria-label="أقسام المدونة">
        {[['', 'الكل'], ...Object.entries(BLOG_CATEGORIES).map(([k, v]) => [k, v.name])].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setCat(k)} aria-pressed={cat === k}
            className={cn('h-10 rounded-full px-4 text-[14px] font-semibold ring-1 transition-colors', cat === k ? 'bg-primary text-on-inverse ring-primary' : 'bg-white text-primary ring-primary/15 hover:ring-primary/40')}>{label}</button>
        ))}
      </nav>
      <div className="mx-auto grid max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => <Card key={p.slug} post={p} lead={i === 0 && !cat} />)}
      </div>
    </div>
  )
}
