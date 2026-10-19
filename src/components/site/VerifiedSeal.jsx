import { useEffect, useRef } from 'react'

// The Saudi Business Center («منصة الأعمال») verification, shown in the footer: its own logo, and the same official
// «متجر موثّق» badge as the floating one (the frame opens the certificate card on tap; index.html loads the
// center's seal.js, which resizes the frame). The frame is added after the page is on screen so it never
// disturbs hydration. The token is public by design (it already sits in index.html).
const BASE = 'https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi'
const TOKEN = 'U05ONkgybnp1WHVmdFZrZEtENy9JQT09'

export default function VerifiedSeal({ className = '' }) {
  const box = useRef(null)
  const card = useRef(null)
  useEffect(() => {
    const el = box.current
    if (!el || el.querySelector('iframe')) return
    const f = document.createElement('iframe')
    f.className = 'sbc-seal-frame'
    f.src = `${BASE}/seal?token=${encodeURIComponent(TOKEN)}&lang=ar&pos=top`
    f.title = 'متجر موثّق لدى منصة الأعمال'
    f.loading = 'lazy'
    f.setAttribute('scrolling', 'no')
    Object.assign(f.style, { border: '0', width: '120px', height: '44px', maxWidth: '100%', transition: 'width .18s ease,height .18s ease' })
    el.appendChild(f)
  }, [])
  // while this card is on screen the floating badge steps aside (it would cover the footer's contact lines)
  useEffect(() => {
    const el = card.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => document.documentElement.toggleAttribute('data-seal-footer', e.isIntersecting))
    io.observe(el)
    return () => { io.disconnect(); document.documentElement.removeAttribute('data-seal-footer') }
  }, [])
  return (
    <div ref={card} className={`grid justify-items-center gap-2.5 rounded-2xl bg-white/[0.05] px-5 py-4 ring-1 ring-white/10 lg:justify-items-start ${className}`}>
      <span className="text-[12px] font-semibold text-on-inverse/60">موثّق لدى</span>
      <img src={`${BASE}/assets/sbc-logo.svg`} alt="المركز السعودي للتنافسية والأعمال" width="220" height="55" loading="lazy" className="h-10 w-auto [filter:brightness(0)_invert(1)]" />
      <div ref={box} className="min-h-[44px]" />
    </div>
  )
}
