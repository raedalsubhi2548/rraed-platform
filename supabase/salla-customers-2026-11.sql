-- Raed store — customers from the old Salla store (November 2026).
-- Raed exported them from Salla (Excel) and uploads the file in لوحة التحكم ← العملاء ← «عملاء سلة».
-- They are contacts, not site accounts: no login is created for them and nothing is sent to them.
-- The table is closed to everyone; it is read and written only through the functions below.
-- Run after staff-2026-10.sql (needs public.has_perm and public.is_admin).

create table if not exists public.salla_customers (
  salla_id    text primary key,
  name        text not null default '',
  mobile      text not null default '',
  email       text,
  city        text,
  gender      text,
  joined_at   timestamptz,
  orders      integer not null default 0,
  spent       numeric(12, 2) not null default 0,
  last_order  date,
  opted_out   boolean not null default false, -- asked not to receive marketing
  imported_at timestamptz not null default now()
);
alter table public.salla_customers enable row level security;
revoke all on public.salla_customers from public, anon, authenticated;

-- the list, for anyone with the customers area
drop function if exists public.admin_salla_customers();
create function public.admin_salla_customers() returns table (
  id text, name text, mobile text, email text, city text, gender text,
  "joinedAt" timestamptz, orders integer, spent numeric, "lastOrder" date, "optedOut" boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_perm('customers') then raise exception 'هذه العملية للإدارة فقط'; end if;
  return query
    select c.salla_id, c.name, c.mobile, c.email, c.city, c.gender, c.joined_at, c.orders, c.spent, c.last_order, c.opted_out
      from public.salla_customers c
     order by c.spent desc, c.joined_at desc nulls last;
end $$;

-- upload (owner only): adds new rows and refreshes existing ones by their Salla id; a customer's
-- «لا يستقبل تسويق» choice is never overwritten by a new upload
drop function if exists public.owner_import_salla_customers(jsonb);
create function public.owner_import_salla_customers(p_rows jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not public.is_admin() then raise exception 'هذه العملية للمالك فقط'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'الملف غير صالح'; end if;
  if jsonb_array_length(p_rows) > 20000 then raise exception 'الملف كبير جداً'; end if;
  insert into public.salla_customers as c (salla_id, name, mobile, email, city, gender, joined_at, orders, spent, last_order)
  select left(r->>'id', 40),
         left(coalesce(r->>'name', ''), 200),
         left(coalesce(r->>'mobile', ''), 30),
         nullif(left(lower(trim(coalesce(r->>'email', ''))), 200), ''),
         nullif(left(coalesce(r->>'city', ''), 100), ''),
         nullif(left(coalesce(r->>'gender', ''), 20), ''),
         case when r->>'joinedAt' ~ '^\d{4}-\d{2}-\d{2}' then (r->>'joinedAt')::timestamptz end,
         greatest(0, least(100000, coalesce(nullif(r->>'orders', '')::numeric, 0)))::integer,
         greatest(0, least(100000000, coalesce(nullif(r->>'spent', '')::numeric, 0))),
         case when r->>'lastOrder' ~ '^\d{4}-\d{2}-\d{2}$' then (r->>'lastOrder')::date end
    from jsonb_array_elements(p_rows) r
   where coalesce(r->>'id', '') ~ '^[A-Za-z0-9_-]{1,40}$'
  on conflict (salla_id) do update set
    name = excluded.name, mobile = excluded.mobile, email = excluded.email, city = excluded.city,
    gender = excluded.gender, joined_at = excluded.joined_at, orders = excluded.orders,
    spent = excluded.spent, last_order = excluded.last_order, imported_at = now();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- mark a customer who asked not to receive marketing (or undo it)
drop function if exists public.admin_salla_opt_out(text, boolean);
create function public.admin_salla_opt_out(p_id text, p_out boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('customers') then raise exception 'هذه العملية للإدارة فقط'; end if;
  update public.salla_customers set opted_out = coalesce(p_out, false) where salla_id = p_id;
end $$;

revoke execute on function public.admin_salla_customers(), public.owner_import_salla_customers(jsonb), public.admin_salla_opt_out(text, boolean) from public, anon;
grant execute on function public.admin_salla_customers(), public.owner_import_salla_customers(jsonb), public.admin_salla_opt_out(text, boolean) to authenticated;
