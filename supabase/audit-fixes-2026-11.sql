-- Raed store — fixes from the November 2026 audit. Run once in Supabase → SQL Editor, AFTER salla-customers-2026-11.sql.
-- Safe to run again.
--  1) «كيف عرفتنا؟» from checkout is kept on the order (it was dropped before saving).
--  2) One shared counter for limits (sign-in tries, rebuilds, questions), instead of one per server instance.
--  3) Service questions: 5 an hour from one address, so one visitor can't use up everyone's share.
--  4) Tamara rules inside the store settings can be changed by the owner only (staff designers keep everything else).
--  5) The products image store no longer accepts SVG files.

-- 1) keep customer.heard (a short id like "chatgpt"); everything else as before
create or replace function public.orders_sanitize() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.customer := jsonb_build_object(
    'name',  left(coalesce(new.customer->>'name', ''), 120),
    'phone', left(coalesce(new.customer->>'phone', ''), 20),
    'email', coalesce((select u.email from auth.users u where u.id = new.user_id), left(coalesce(new.customer->>'email', ''), 160))
  ) || case when coalesce(new.customer->>'heard', '') ~ '^[a-z0-9_-]{1,30}$'
            then jsonb_build_object('heard', new.customer->>'heard') else '{}'::jsonb end;
  new.notes := left(new.notes, 2000);
  if jsonb_array_length(coalesce(new.items, '[]'::jsonb)) > 50 then
    raise exception 'too many items';
  end if;
  return new;
end $$;

-- 2) shared limits: rate_ok('key', max, seconds) is true while the key stays under max in the window
create table if not exists public.rate_hits (
  k  text not null,
  at timestamptz not null default now()
);
create index if not exists rate_hits_k_at_idx on public.rate_hits (k, at);
create index if not exists rate_hits_at_idx on public.rate_hits (at);
alter table public.rate_hits enable row level security; -- no policies: only the function below touches it
revoke all on public.rate_hits from public, anon, authenticated;
grant all on public.rate_hits to service_role;

create or replace function public.rate_ok(p_key text, p_max int, p_seconds int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare v_k text := md5(coalesce(p_key, '')); v_n int;
begin
  delete from public.rate_hits where at < now() - interval '1 day';
  select count(*) into v_n from public.rate_hits
   where k = v_k and at > now() - make_interval(secs => greatest(1, least(86400, coalesce(p_seconds, 60))));
  if v_n >= greatest(1, coalesce(p_max, 1)) then return false; end if;
  insert into public.rate_hits (k) values (v_k);
  return true;
end $$;
revoke execute on function public.rate_ok(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_ok(text, int, int) to service_role;

-- 3) questions: 5 an hour per address (the store-wide 60 an hour stays as a second guard)
create or replace function public.ask_question(p_product text, p_name text, p_contact text, p_question text) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare v_q text := trim(coalesce(p_question, '')); v_name text := left(trim(coalesce(p_name, '')), 60);
        v_ip text := coalesce(nullif(trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
begin
  if not exists (select 1 from public.products where id = p_product and active) then raise exception 'الخدمة غير موجودة'; end if;
  if length(v_q) < 3 then raise exception 'اكتب سؤالك'; end if;
  if v_name = '' then raise exception 'اكتب اسمك'; end if;
  if (select count(*) from public.questions where created_at > now() - interval '1 hour') >= 60 then raise exception 'حاول بعد شوي'; end if;
  if v_ip <> 'unknown' and not public.rate_ok('question:' || v_ip, 5, 3600) then raise exception 'حاول بعد شوي'; end if;
  insert into public.questions (product_id, name, contact, question) values (p_product, v_name, left(trim(coalesce(p_contact, '')), 120), left(v_q, 600));
  return true;
end $$;
revoke execute on function public.ask_question(text, text, text, text) from public;
grant execute on function public.ask_question(text, text, text, text) to anon, authenticated;

-- 4) payment rules (data.payments) change only when the owner saves; anyone else's save keeps the stored ones
create or replace function public.settings_protect_payments() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if; -- SQL editor, service role, owner
  if tg_op = 'UPDATE' and old.data ? 'payments' then
    new.data := jsonb_set(new.data, '{payments}', old.data->'payments');
  else
    new.data := new.data - 'payments';
  end if;
  return new;
end $$;
drop trigger if exists site_settings_protect_payments on public.site_settings;
create trigger site_settings_protect_payments before insert or update on public.site_settings
  for each row execute function public.settings_protect_payments();

-- 5) images only
update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
 where id = 'products';

-- should show: true, true, and the image types without svg
select exists (select 1 from pg_proc where proname = 'rate_ok') as "العدّاد المشترك",
       exists (select 1 from pg_trigger where tgname = 'site_settings_protect_payments') as "حماية قواعد تمارا",
       (select allowed_mime_types from storage.buckets where id = 'products') as "أنواع الصور";
