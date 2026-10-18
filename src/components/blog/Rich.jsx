// Renders an article written in our small markdown: ## / ### headings, paragraphs, "- " and "1. " lists,
// "> " callouts, "| a | b |" tables (first row = header), **bold**, [text](link) and [[service:id]] boxes.
import { Link } from 'react-router-dom'
import { ArrowLeft, Lightbulb, Clock } from 'lucide-react'
import { useApp } from '@/state.jsx'
import { money, effectivePrice } from '@/lib/format.js'
import { productPath } from '@/lib/slug.js'
import { cn } from '@/lib/utils'

export const headingId = (t) => t.replace(/[*?؟:،,.«»()]/g, '').trim().replace(/\s+/g, '-')

/** Splits the text into blocks once; also gives the h2 list for the table of contents. */
export function parse(text) {
  const blocks = []
  const lines = text.replace(/\r/g, '').split('\n')
  let i = 0
  while (i < lines.length) {
    const l = lines[i].trim()
    if (!l) { i++; continue }
    if (l.startsWith('### ')) { blocks.push({ t: 'h3', text: l.slice(4) }); i++; continue }
    if (l.startsWith('## ')) { blocks.push({ t: 'h2', text: l.slice(3), id: headingId(l.slice(3)) }); i++; continue }
    const svc = l.match(/^\[\[service:([\w-]+)\]\]$/)
    if (svc) { blocks.push({ t: 'service', id: svc[1] }); i++; continue }
    const group = (re) => { const out = []; while (i < lines.length && re.test(lines[i].trim())) out.push(lines[i++].trim()); return out }
    if (l.startsWith('> ')) { blocks.push({ t: 'note', text: group(/^> /).map((x) => x.slice(2)).join(' ') }); continue }
    if (l.startsWith('|')) {
      const rows = group(/^\|/).map((r) => r.replace(/^\|\s?|\s?\|$/g, '').split(' | ').map((c) => c.trim()))
      blocks.push({ t: 'table', head: rows[0], rows: rows.slice(1) }); continue
    }
    if (/^- /.test(l)) { blocks.push({ t: 'ul', items: group(/^- /).map((x) => x.slice(2)) }); continue }
    if (/^\d+\. /.test(l)) { const items = group(/^\d+\. /); blocks.push({ t: 'ol', start: parseInt(items[0], 10), items: items.map((x) => x.replace(/^\d+\. /, '')) }); continue }
    blocks.push({ t: 'p', text: l }); i++
  }
  return blocks
}

/** **bold** and [text](url) inside a line. */
function Inline({ text }) {
  const parts = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0, m, k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) parts.push(<strong key={k++} className="font-bold text-primary">{m[1]}</strong>)
    else if (!/^(\/(?!\/)|https?:\/\/)/i.test(m[3])) parts.push(m[2])
    else if (m[3].startsWith('/')) parts.push(<Link key={k++} to={m[3]} className="font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4 hover:decoration-primary">{m[2]}</Link>)
    else parts.push(<a key={k++} href={m[3]} target="_blank" rel="noopener" className="font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4 hover:decoration-primary">{m[2]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function ServiceBox({ id }) {
  const { byId } = useApp()
  const p = byId?.[id]
  if (!p || p.active === false) return null
  const price = effectivePrice(p)
  return (
    <aside className="not-prose my-8 overflow-hidden rounded-[20px] bg-primary text-on-inverse shadow-[0_24px_48px_-30px_color-mix(in_srgb,var(--p-green-900)_80%,transparent)]">
      <div className="relative grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <span className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_70%)]" aria-hidden="true" />
        <div className="relative min-w-0">
          <p className="text-[12px] font-semibold tracking-wide text-accent">خدمة من منصة رائد</p>
          <p className="mt-1 font-display text-[1.25rem] font-bold leading-8">{p.name}</p>
          {p.summary && <p className="mt-1 text-[14px] leading-7 text-on-inverse/75">{p.summary}</p>}
        </div>
        <div className="relative flex items-center gap-3 sm:flex-col sm:items-end">
          <span className="tabular flex items-baseline gap-2 whitespace-nowrap">{price < p.price && <s className="text-[14px] text-on-inverse/60">{money(p.price)}</s>}<span className={price < p.price ? 'font-display text-xl font-bold text-[#ff6b6b] sm:text-2xl' : 'font-display text-2xl font-bold'}>{money(price)}</span></span>
          <Link to={productPath(p.id)} className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-[14px] font-bold text-primary transition-colors hover:bg-accent">
            تفاصيل الخدمة<ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default function Rich({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.t) {
      case 'h2': return <h2 key={i} id={b.id} className="mt-12 mb-4 scroll-mt-28 font-display text-[1.55rem] font-bold leading-[1.6] text-primary sm:text-[1.75rem]">{b.text}</h2>
      case 'h3': return <h3 key={i} className="mt-8 mb-3 font-display text-[1.2rem] font-bold leading-8 text-primary">{b.text}</h3>
      case 'p': return <p key={i} className="my-5"><Inline text={b.text} /></p>
      case 'ul': return (
        <ul key={i} className="my-5 grid gap-2.5">
          {b.items.map((x, j) => <li key={j} className="relative ps-6 before:absolute before:start-1 before:top-[0.85em] before:size-[7px] before:rounded-full before:bg-accent"><Inline text={x} /></li>)}
        </ul>
      )
      case 'ol': return (
        <ol key={i} className="my-6 grid gap-3" start={b.start}>
          {b.items.map((x, j) => (
            <li key={j} className="grid grid-cols-[2rem_1fr] items-start gap-3">
              <span className="tabular mt-[3px] grid size-8 place-items-center rounded-full bg-primary/[0.07] font-display text-[14px] font-bold text-primary" aria-hidden="true">{b.start + j}</span>
              <span><Inline text={x} /></span>
            </li>
          ))}
        </ol>
      )
      case 'note': {
        const sum = /^\*\*باختصار:\*\*/.test(b.text)
        return (
          <div key={i} className={cn('my-7 flex gap-3 rounded-[16px] p-4 sm:p-5', sum ? 'bg-accent/20 ring-1 ring-accent/40' : 'bg-primary/[0.04] ring-1 ring-primary/[0.08]')}>
            {sum ? <Clock className="mt-1.5 size-5 shrink-0 text-primary" /> : <Lightbulb className="mt-1.5 size-5 shrink-0 text-primary/60" />}
            <p className="m-0 text-[15.5px] leading-8"><Inline text={b.text} /></p>
          </div>
        )
      }
      case 'table': return (
        <div key={i} className="my-7 overflow-x-auto rounded-[16px] ring-1 ring-primary/10">
          <table className="w-full min-w-[520px] border-collapse text-[14.5px] leading-7">
            <thead><tr>{b.head.map((c, j) => <th key={j} className="bg-primary/[0.05] px-4 py-3 text-start font-bold text-primary">{c}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j} className="border-t border-primary/[0.07] align-top">{r.map((c, k) => <td key={k} className={cn('px-4 py-3', k === 0 && 'font-semibold text-primary')}><Inline text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      )
      case 'service': return <ServiceBox key={i} id={b.id} />
      default: return null
    }
  })
}
