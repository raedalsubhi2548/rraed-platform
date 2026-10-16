import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock, Mail, KeyRound, ShieldCheck, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api.js'
import { useApp } from '@/state.jsx'
import HumanCheck, { TURNSTILE_KEY } from '@/components/HumanCheck.jsx'
import { STORE_ORIGIN } from '@/lib/host.js'

/** The owner's own sign-in for the dashboard — no store header, no store look. */
export default function AdminLogin() {
  const { user, authReady, applyUser } = useApp()
  const [form, setForm] = useState({ email: '', code: '' })
  const [sent, setSent] = useState(false) // the code is on its way: the second step asks for it
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const human = useRef(null)

  useEffect(() => {
    document.title = 'تسجيل الدخول | لوحة تحكم منصة رائد'
    let m = document.querySelector('meta[name="robots"]'); if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m) }
    m.content = 'noindex,nofollow'
  }, [])

  if (authReady && user) return <Navigate to="/admin" replace />

  // sign-in is always an email code: step 1 sends it (to an existing account only), step 2 checks it
  const send = async () => {
    if (TURNSTILE_KEY && !captcha) { setErr('انتظر لين يكتمل التحقق'); return }
    setBusy(true)
    try { await api.sendLoginCode(form.email, {}, captcha); setSent(true); setForm((x) => ({ ...x, code: '' })) } catch (e2) { setErr(/ما عندنا حساب/.test(e2.message) ? 'هذا البريد ما له حساب في لوحة التحكم' : e2.message) } finally { setBusy(false); human.current?.reset() }
  }
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!sent) return send()
    setBusy(true)
    try { applyUser(await api.verifyLoginCode(form.email, form.code)) } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const field = 'h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-left text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/40 focus:bg-white/[0.09]'

  return (
    <div dir="rtl" className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0b1322] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_80%_0%,#24406d_0%,transparent_60%),radial-gradient(60%_50%_at_0%_100%,#1b2b44_0%,transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden="true" />

      <main className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo-white.png" alt="منصة رائد" width="458" height="248" className="h-16 w-auto" />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75 ring-1 ring-white/15">لوحة التحكم</span>
        </div>

        <form onSubmit={submit} className="grid gap-4 rounded-[22px] bg-white/[0.04] p-6 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
          <div>
            <h1 className="text-2xl font-bold">دخول المالك</h1>
            <p className="mt-1 text-sm text-white/55">{sent ? <>أرسلنا رمز الدخول إلى <span dir="ltr">{form.email.trim()}</span></> : 'اكتب بريدك ونرسل لك رمز دخول.'}</p>
          </div>

          {!sent && <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-white/80">البريد الإلكتروني</span>
            <span className="relative"><Mail className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/40" />
              <input type="email" required dir="ltr" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} placeholder="name@rraed.com" /></span>
          </label>}
          {sent && <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-white/80">رمز الدخول</span>
            <span className="relative"><KeyRound className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/40" />
              <input required dir="ltr" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8} autoFocus value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/D/g, '').slice(0, 8) })} className={field + ' text-center text-2xl tracking-[0.5em]'} placeholder="••••••" /></span>
          </label>}

          {TURNSTILE_KEY && <div className="rounded-xl bg-white p-1 text-foreground"><HumanCheck ref={human} onToken={setCaptcha} /></div>}
          {err && <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30" role="alert">{err}</p>}

          <button disabled={busy} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-bold text-[#0b1322] transition hover:bg-[#e6ecf4] disabled:opacity-60">
            <Lock className="size-4" />{busy ? 'لحظة…' : sent ? 'دخول للوحة التحكم' : 'أرسل رمز الدخول'}
          </button>
          {sent && <div className="flex justify-between text-sm text-white/55">
            <button type="button" onClick={() => { setSent(false); setErr('') }} className="underline-offset-4 hover:text-white hover:underline">غيّر البريد</button>
            <button type="button" disabled={busy} onClick={() => { setErr(''); send() }} className="underline-offset-4 hover:text-white hover:underline">أرسل رمز جديد</button>
          </div>}
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-white/40">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" />اتصال مشفّر ومحمي</span>
          <a href={STORE_ORIGIN} className="flex items-center gap-1.5 hover:text-white/80"><ExternalLink className="size-3.5" />rraed.com</a>
        </div>
      </main>
    </div>
  )
}
