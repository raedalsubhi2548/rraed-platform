import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, ShieldCheck, ShieldOff, X } from 'lucide-react'
import { api } from '@/lib/api.js'
import { useApp } from '@/state.jsx'
import { Button } from '@/components/ui/button'
import { Field, Input, Panel, Skeleton } from '@/components/ui/kit.jsx'
import { AdminHead, useConfirm } from '@/components/admin/ui.jsx'

/** Each dashboard account turns the authenticator-app code on or off for itself (supabase/totp-2026-11.sql). */
export default function Security() {
  const { notify } = useApp()
  const confirm = useConfirm()
  const [on, setOn] = useState(null) // null: loading · undefined: not available yet
  const [setup, setSetup] = useState(null) // { id, qr, secret } while turning it on
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { api.myAccess().then((a) => setOn(a.totp)).catch(() => setOn(undefined)) }, [])

  if (on === undefined) return <Navigate to="/admin" replace />

  const start = async () => {
    setErr(''); setBusy(true)
    try { setSetup(await api.totpStart()); setCode('') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const finish = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await api.totpVerify(code, setup.id); setSetup(null); setOn(true); notify('تم تفعيل رمز التطبيق') } catch (e2) { setErr(e2.message); setCode('') } finally { setBusy(false) }
  }
  const off = async () => {
    if (!(await confirm({ title: 'إيقاف رمز التطبيق لهذا الحساب؟', ok: 'إيقاف' }))) return
    setErr(''); setBusy(true)
    try { await api.totpOff(); setOn(false); notify('تم إيقاف رمز التطبيق') } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <>
      <AdminHead title="الأمان" />
      <Panel title="رمز تطبيق التحقق" className="max-w-xl">
        {on === null ? <Skeleton className="h-24" /> : setup ? (
          <form onSubmit={finish} className="grid gap-5">
            <div className="grid justify-items-center gap-3">
              {setup.qr && <img src={setup.qr} alt="رمز QR لتطبيق التحقق" width="200" height="200" className="size-[200px] rounded-lg bg-white p-2 ring-1 ring-border" />}
              <code dir="ltr" className="select-all break-all rounded-md bg-sunken px-3 py-2 text-center text-sm font-semibold tracking-wider text-primary">{setup.secret}</code>
            </div>
            <Field label="الرمز من التطبيق" className="sm:max-w-xs">
              <Input required dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-xl tracking-[0.4em]" placeholder="••••••" />
            </Field>
            {err && <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || code.length < 6}><Check className="size-4" />تأكيد</Button>
              <Button type="button" variant="outline" onClick={() => { setSetup(null); setErr('') }}><X className="size-4" />إلغاء</Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={on ? 'flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm font-bold text-success' : 'flex items-center gap-2 rounded-full bg-sunken px-3 py-1 text-sm font-bold text-muted-foreground'}>
                {on ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}{on ? 'مفعّل' : 'غير مفعّل'}
              </span>
              {on ? <Button type="button" variant="outline" disabled={busy} onClick={off}><ShieldOff className="size-4" />إيقاف</Button>
                : <Button type="button" disabled={busy} onClick={start}><ShieldCheck className="size-4" />تفعيل</Button>}
            </div>
            {err && <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{err}</p>}
          </div>
        )}
      </Panel>
    </>
  )
}
