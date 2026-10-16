// The team (owner only): GET → list · POST { email, name, role, perms } → add or change · DELETE ?email= → remove.
// A new email gets a store account (no password yet, they set one with «نسيت كلمة المرور؟») and an invite email.
// Staff sign in like the owner (password, then the emailed code) and see only the areas in their perms.
import { admin, adminFromRequest, PERMS } from './_shared.js'
import { sendStaffInviteEmail } from './_mail.js'

const EMAIL = /^[^\s@<>"]{1,120}@[^\s@<>"]{1,120}\.[a-z]{2,}$/i
const clean = (v, n) => String(v || '').replace(/[<>]/g, '').trim().slice(0, n)

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  const owner = await adminFromRequest(req) // no area given: the owner only
  if (!owner) return res.status(403).json({ error: 'إدارة الفريق للمالك فقط' })

  if (req.method === 'GET') {
    const { data, error } = await admin.from('staff').select('*').order('added_at')
    if (error) return res.status(500).json({ error: 'شغّل ملف supabase/staff-2026-10.sql في Supabase أولاً' })
    return res.status(200).json({ staff: data.map((s) => ({ email: s.email, name: s.name, role: s.role, perms: s.perms, addedAt: s.added_at })) })
  }

  if (req.method === 'POST') {
    const b = req.body || {}
    const email = String(b.email || '').trim().toLowerCase()
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'اكتب بريد صحيح' })
    if (email === (owner.email || '').toLowerCase()) return res.status(400).json({ error: 'هذا بريد المالك، عنده كل الصلاحيات' })
    const perms = [...new Set([].concat(b.perms || []))].filter((p) => PERMS.includes(p))
    if (!perms.length) return res.status(400).json({ error: 'اختر قسم واحد على الأقل' })
    const { data: prof } = await admin.from('profiles').select('role').ilike('email', email.replace(/[%_\\]/g, '\\$&')).maybeSingle()
    if (prof?.role === 'admin') return res.status(400).json({ error: 'هذا الحساب مالك، عنده كل الصلاحيات' })

    const { data: before } = await admin.from('staff').select('email').eq('email', email).maybeSingle()
    const row = { email, name: clean(b.name, 80), role: clean(b.role, 40), perms }
    const { error } = await admin.from('staff').upsert(row)
    if (error) return res.status(500).json({ error: 'تعذّر الحفظ: شغّل ملف supabase/staff-2026-10.sql في Supabase أولاً' })

    let invited = false
    if (!before) {
      // an account for the email if it has none yet (the trigger makes its profile)
      const { error: e2 } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name: row.name } })
      const isNew = !e2
      try { await sendStaffInviteEmail(email, { ...row, isNew }); invited = true } catch (err) { console.error('staff invite mail', err?.message) }
    }
    return res.status(200).json({ ok: true, invited, added: !before })
  }

  if (req.method === 'DELETE') {
    const email = String(req.query?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'البريد ناقص' })
    await admin.from('staff').delete().eq('email', email)
    // takes effect at once: every dashboard check reads the team live
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
