import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { WORK } from '@/data/work.js'

const lh3 = (id, h) => `https://lh3.googleusercontent.com/d/${id}=h${h}`
const ROW_A = [8, 15, 2, 25, 32, 10, 21, 37, 4, 30, 12, 18]
const ROW_B = [1, 9, 23, 40, 16, 34, 22, 6, 28, 36, 13, 41]

function Row({ ids, reverse }) {
  const list = [...ids, ...ids]
  return (
    <div className="group/row flex overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_10%,black_90%,transparent)]">
      <ul className={`flex w-max shrink-0 gap-4 py-4 motion-safe:animate-[marquee_120s_linear_infinite] group-hover/row:[animation-play-state:paused] group-active/row:[animation-play-state:paused] group-focus-within/row:[animation-play-state:paused] sm:gap-5 ${reverse ? '[animation-direction:reverse]' : ''}`}>
        {list.map((i, k) => (
          <li key={k} aria-hidden={k >= ids.length || undefined} className="shrink-0">
            <Link to="/work#banners" tabIndex={k >= ids.length ? -1 : undefined} className="group block overflow-hidden rounded-[18px] bg-[#ffffff] p-1.5 shadow-[0_1px_2px_color-mix(in_srgb,var(--p-green-900)_6%,transparent),0_24px_40px_-26px_color-mix(in_srgb,var(--p-green-900)_55%,transparent)] ring-1 ring-primary/[0.06] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1.5 hover:shadow-[0_2px_4px_color-mix(in_srgb,var(--p-green-900)_6%,transparent),0_32px_50px_-26px_color-mix(in_srgb,var(--p-green-900)_60%,transparent)]">
              <img src={lh3(WORK[i], 420)} alt={k < ids.length ? `من أعمال منصة رائد ${k + 1}` : ''} loading="lazy" decoding="async"
                className="block h-[150px] w-auto min-w-[150px] rounded-[13px] bg-sunken object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:h-[210px] sm:min-w-[210px]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Our banner & social work drifting slowly in two rows; hover pauses a row. */
export default function GalleryWall({ eyebrow = 'من مكتب منصة رائد', title = 'بنرات وتصاميم سوشال ميديا', text = 'نماذج حقيقية من شغلنا لعملائنا، مرّر عليها عشان توقف.' }) {
  return (
    <section className="cv-auto relative py-14 sm:py-20" aria-label={title || "معرض الأعمال"}>
      <div className="container-w mb-6 flex flex-col items-center gap-2 text-center sm:mb-8">
        {eyebrow && <p className="text-[14px] font-medium text-primary/55">{eyebrow}</p>}
        {title && <h2 className="font-display text-[2.1rem] font-bold leading-[1.45] text-primary sm:text-[2.75rem]">{title}</h2>}
        {text && <p className="max-w-md text-[15px] leading-7 text-muted-foreground">{text}</p>}
      </div>
      <div className="grid gap-1">
        <Row ids={ROW_A} />
        <Row ids={ROW_B} reverse />
      </div>
      <div className="mt-8 text-center">
        <Link to="/work#banners" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-[14px] font-medium text-on-inverse shadow-[0_14px_28px_-14px_color-mix(in_srgb,var(--p-green-900)_80%,transparent)] transition-colors hover:bg-primary-hover">
          شوف كل التصاميم ({WORK.length})<ArrowLeft className="size-4" />
        </Link>
      </div>
    </section>
  )
}
