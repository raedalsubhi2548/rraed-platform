-- Raed store — blog managed from the dashboard (October 2026).
-- Run once in Supabase → SQL Editor, AFTER staff-2026-10.sql. Safe to run again.
-- The owner (and staff with the «المدونة» area) write articles in لوحة التحكم ← المدونة; published ones
-- show on the site and in the sitemap after the automatic rebuild. The 16 built-in articles stay in the code
-- and can be edited from the dashboard too: saving one stores a copy here that replaces it on the site.

-- 1) Articles
create table if not exists public.blog_posts (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(title) between 1 and 200),
  seo_title text not null default '' check (length(seo_title) <= 120),
  description text not null default '' check (length(description) <= 400),
  keywords text not null default '' check (length(keywords) <= 600),
  category text not null default 'design' check (category in ('design', 'marketing', 'legal')),
  minutes int not null default 3 check (minutes between 1 and 120),
  body text not null default '' check (length(body) <= 200000),
  faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array' and pg_column_size(faq) < 40000),
  services text[] not null default '{}' check (cardinality(services) <= 20),
  published boolean not null default false,
  date date not null default current_date,
  updated date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;
drop policy if exists "blog public read" on public.blog_posts;
create policy "blog public read" on public.blog_posts for select using (published or (select public.has_perm('blog')));
drop policy if exists "blog admin write" on public.blog_posts;
create policy "blog admin write" on public.blog_posts for all using ((select public.has_perm('blog'))) with check ((select public.has_perm('blog')));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;

-- 2) «المدونة» becomes one of the areas a staff member can be given
do $$
declare c text;
begin
  if to_regclass('public.staff') is null then return; end if;
  for c in select conname from pg_constraint where conrelid = 'public.staff'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%perms%' loop
    execute format('alter table public.staff drop constraint %I', c);
  end loop;
  alter table public.staff add constraint staff_perms_check
    check (perms <@ array['orders', 'reports', 'products', 'categories', 'customers', 'coupons', 'design', 'blog']::text[]);
end $$;

create or replace function public.my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when not public.strong_session() then jsonb_build_object('owner', false, 'role', '', 'perms', '[]'::jsonb, 'strong', false)
    when exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      then jsonb_build_object('owner', true, 'role', 'المالك', 'perms', to_jsonb(array['orders', 'reports', 'products', 'categories', 'customers', 'coupons', 'design', 'blog', 'team']), 'strong', true)
    else coalesce((select jsonb_build_object('owner', false, 'role', s.role, 'perms', to_jsonb(s.perms), 'strong', true)
                     from public.staff s join auth.users u on lower(u.email) = s.email where u.id = auth.uid()),
                  jsonb_build_object('owner', false, 'role', '', 'perms', '[]'::jsonb, 'strong', true))
  end
$$;
revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- should show the table and the new staff rule
select (select count(*) from public.blog_posts) as "عدد المقالات",
       exists (select 1 from pg_constraint where conname = 'staff_perms_check' and pg_get_constraintdef(oid) like '%blog%') as "صلاحية المدونة";
