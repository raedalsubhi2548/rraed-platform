-- Raed store — sign-in code from an authenticator app (TOTP) for the dashboard, November 2026.
-- Run once in Supabase → SQL Editor, AFTER audit-fixes-2026-11.sql. Safe to run again.
-- Each dashboard account (owner or staff) may turn it on from لوحة التحكم ← الأمان. From then on that account's
-- dashboard opens only after: password → emailed code → the app's code. Accounts that have not turned it on sign in
-- as before. Customers are not affected.
--
-- Lost phone: a staff member's app is removed by the owner from الفريق والصلاحيات. For the owner's own account, in
-- Supabase → Authentication → Users → open the account → remove its MFA factor (or, here in the SQL Editor:
--   delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'the owner email');
-- ), then sign in again with the password and the emailed code.

-- 1) Has this account turned the app code on?
create or replace function public.has_totp() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.mfa_factors f
                  where f.user_id = auth.uid() and f.status::text = 'verified' and f.factor_type::text = 'totp')
$$;

-- 2) The two steps as before (password recorded by the server, then the emailed code). The app's code is a later
--    step of the same session, so its time is left out when looking for the recorded password.
create or replace function public.two_step_session() returns boolean
language sql stable security definer set search_path = public as $$
  with s as (
    select coalesce(auth.jwt() -> 'amr', '[]'::jsonb) as amr
  ), t as (
    select to_timestamp(max((m ->> 'timestamp')::bigint) filter (where m ->> 'method' <> 'totp' and m ->> 'method' not like 'mfa%')) as signed_in,
           bool_or(m ->> 'method' = 'password') as by_password
    from s, jsonb_array_elements(s.amr) m
  )
  select auth.uid() is not null
     and coalesce((select not by_password from t), false)
     and exists (
       select 1 from public.login_checks c, t
       where c.user_id = auth.uid()
         and c.at between t.signed_in - interval '15 minutes' and t.signed_in + interval '1 minute'
     )
$$;

-- 3) What every dashboard check uses: the two steps, plus the app's code when the account has turned it on
create or replace function public.strong_session() returns boolean
language sql stable security definer set search_path = public as $$
  select public.two_step_session()
     and (not public.has_totp() or coalesce(auth.jwt() ->> 'aal', '') = 'aal2')
$$;

-- 4) What the signed-in person may open, and whether the app's code is on / still needed for this session
create or replace function public.my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select (case
    when not public.strong_session() then jsonb_build_object('owner', false, 'role', '', 'perms', '[]'::jsonb, 'strong', false)
    when exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      then jsonb_build_object('owner', true, 'role', 'المالك', 'perms', to_jsonb(array['orders', 'reports', 'products', 'categories', 'customers', 'coupons', 'design', 'blog', 'reviews', 'team']), 'strong', true)
    else coalesce((select jsonb_build_object('owner', false, 'role', s.role, 'perms', to_jsonb(s.perms), 'strong', true)
                     from public.staff s join auth.users u on lower(u.email) = s.email where u.id = auth.uid()),
                  jsonb_build_object('owner', false, 'role', '', 'perms', '[]'::jsonb, 'strong', true))
  end) || jsonb_build_object(
    'totp', public.has_totp(),
    'need_totp', public.two_step_session() and public.has_totp() and coalesce(auth.jwt() ->> 'aal', '') <> 'aal2')
$$;

revoke execute on function public.has_totp(), public.two_step_session(), public.strong_session() from public;
revoke execute on function public.my_access() from public, anon;
grant execute on function public.has_totp(), public.two_step_session(), public.strong_session() to anon, authenticated;
grant execute on function public.my_access() to authenticated;

-- should show: true
select exists (select 1 from pg_proc where proname = 'has_totp') as "رمز التطبيق جاهز";
