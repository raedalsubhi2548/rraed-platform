# CLAUDE.md — منصة رائد (rraed.com)

Project memory for Claude Code. Read this before any change.

## Talking to the owner (Raed)
- Reply in Arabic, Saudi dialect. Short, direct, do the work instead of explaining it.
- Never invent numbers, prices or facts. Leave a blank and ask.
- Never paste or ask for secrets (API keys, tokens, passwords) in chat or commits. Secrets live only in Vercel / Supabase settings, and Raed enters them himself.
- No instructional notes/hints inside the admin dashboard UI — he is the owner and asked for a clean dashboard.
- Legal/government content gets a "for clarification, not legal advice" note.
- Ask before: downloads, form submissions, account/setting changes, anything irreversible. Never hard-delete data.

## What this is
Custom-coded store for Raed's services (Salla store design, landing pages, pixels/Google tools, government paperwork…).
- Store: https://rraed.com — Admin: https://admin.rraed.com (same app, host-switched in `src/lib/host.js`).
- Repo: `raedalsubhi2548/rraed-platform`. Work on branch `redesign`; deploy = merge into `main` and push (Vercel auto-deploys `main`).

## Stack
- React 18 + Vite SPA, Tailwind v4, lucide icons, Radix.
- Build-time SSR prerender: `npm run build` = client build + `vite build --ssr src/entry-server.jsx` + `scripts/prerender.mjs`
  (renderToString with StaticRouter, embeds `#__catalog` JSON, client uses hydrateRoot). Every public route + sitemap.xml are prerendered.
- Supabase (project `dpjobithiiryniconytd`): auth, Postgres with RLS + SECURITY DEFINER RPCs, storage (`products` public, `downloads` private).
- Vercel serverless functions in `api/` (Tap payments, email via nodemailer SMTP, PDF invoices via PDFKit, rebuild hook, visitor hits).
- Payments: Tap hosted page (`api/tap-charge.js` → `src_all`), confirmation by re-fetching the charge from Tap (`api/_shared.js confirmCharge`), webhook `api/tap-webhook.js`. A 100% coupon order is marked paid without Tap.
- Demo mode: no Supabase env → `src/lib/local.js` (localStorage). Real mode → `src/lib/supa.js`. `src/lib/api.js` picks one.

## Key places
- `src/lib/theme.js` — store designer settings: defaults, `mergeSettings` (sanitizes everything: URLs, links, colors, text caps), `themeCss`. One `site_settings` row (id `main`).
- `src/pages/admin/Designer.jsx` — «مصمم المتجر» (home blocks, brand, header/footer, store info) with live preview iframe (`/admin/preview`). Publishing triggers a rebuild through `api/rebuild.js` (Vercel deploy hook) because settings are baked into the prerendered HTML.
- `src/pages/admin/Reports.jsx` + `supabase/reports.sql` (`admin_report` RPC) + `api/hit.js` — first-party visitor analytics (bots filtered; owner excluded via `?notrack=1`, set automatically by the «عرض المتجر» link).
- `src/lib/seo.js` — titles, descriptions, canonical, JSON-LD for every route (used at runtime and at prerender).
- `src/lib/slug.js` — products/categories live at top level (`/salla-store-design`); `RESERVED` names; old `/p/` `/c/` paths 301 in `vercel.json`.
- Blog: `src/data/blog/index.js` (meta + FAQ + sources), `src/data/blog/posts/<slug>.js` (custom markdown: `##`, `###`, `- `, `1. `, `> `, `| a | b |`, `**bold**`, `[text](url)`, `[[service:product-id]]`), rendered by `src/components/blog/Rich.jsx`. Articles must only use facts from Salla help center (help.salla.sa) or our own service pages, and cite them in `sources`.
  Raed's direction (Oct 2026): articles sell benefits and features to attract clients and rank on keywords — no step-by-step setup tutorials. Each one ends with the matching `[[service:…]]` cards.
- Copy protection: `Layout.jsx` adds `.no-copy` (no select/copy/right-click/image drag) on public pages; cart, checkout, order, account and login stay copyable. Admin is not affected.
- Unknown addresses: `vercel.json` sends only app routes and single-segment slugs to `200.html`; anything else gets `404.html` with a real 404 status.
- Old URLs Google still knows (from the Salla era and an older static site) are 308-redirected in `vercel.json`: `/en/…`, `/fr/…` etc. → same path, `privacy`/`terms` → `/policies`, `contact.html` → `/contact`, `orders(.html)` → `/account`. Vercel rejects `/?` in a redirect source (deploy fails) — use two rules.
- Search Console (sc-domain:rraed.com), 15 Oct 2026: validation started for 5xx, 404, 403 and the 3 merchant-listing issues; indexing requested for /blog, all 6 posts, /salla-store-design, /add-products. Product-snippet rating warnings remain on the 6 services with no Salla ratings (by design, no fake reviews).
- `vercel.json` — strict CSP (update it when adding any third-party script/frame), redirects, headers.
- `public/llms.txt` — keep in sync when adding pages.

## Database (Supabase) — SQL files, run by Raed in the SQL Editor (never by us)
Order: `schema.sql` → `seed.sql` → `options.sql` → `hardening.sql` → `designer.sql` → `security-2026-10.sql` → `reports.sql` → `login-code-2026-10.sql` → `login-2fa-2026-10.sql` → `staff-2026-10.sql`.
`reports.sql` is confirmed run on production; `security-2026-10.sql` was handed over but not confirmed — ask Raed before relying on it. Re-running `schema.sql` reopens weaker grants — if it is ever re-run, re-run `security-2026-10.sql` after it.
New DB changes = a new SQL file in `supabase/` that Raed runs; test it first on a local Postgres 16 (`/usr/lib/postgresql/16/bin`) with stubbed `auth.uid()`.

## Env vars (names only; values are in Vercel)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TAP_SECRET_KEY`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ORDER_NOTIFY_TO` (optional), `VERCEL_DEPLOY_HOOK`.
The owner's order copies go to ORDER_NOTIFY_TO, else every admin account's email, else the store email.

## Rules that broke things before
- Don't break checkout, Tap or Supabase flows. After any change touching them, test the demo checkout and keep the server as the only place prices/totals are computed (`place_order`).
- Hydration: anything that differs between server and first client render (cart, dates, settings changes) must load after hydration or use `suppressHydrationWarning`.
- Keep `mergeSettings` as the only way settings reach the page; never render raw settings.
- The embedded Tap card SDK was tried and reverted (key was bound to another domain). Don't re-add without a domain-registered key.
- Contact numbers: store WhatsApp 0536090915. Brand name «منصة رائد».

## Deploy checklist
1. `npm run build` (must pass; prerender throws on bad slugs/addresses).
2. Commit on `redesign`, push, merge into `main`, push, back to `redesign`.
3. Wait for Vercel (`gh api repos/raedalsubhi2548/rraed-platform/commits/main/status`), then check the live page.

## Decisions (Oct 2026)
- Snap Pixel `affec170-…` is in `src/lib/analytics.js` (PAGE_VIEW, VIEW_CONTENT, ADD_CART, START_CHECKOUT, PURCHASE) and the Conversions API in `api/_snap.js` (PURCHASE when an order is marked paid, deduplicated by order id). Token only in Vercel: `SNAP_CAPI_TOKEN` (Raed added it). CSP allows sc-static.net and tr.snapchat.com. Never remove these.
- A full "night route" luxury redesign was built and rejected by Raed on 16 Oct 2026; it lives on branch `luxury` only. The live design is the earlier one (backup tag `backup-2026-10-16-before-luxury`).
- Security audit 16 Oct 2026: no secrets in git history or client bundles; anon role denied on orders/profiles/coupons/visits/wishlists/product_files and on the RPCs (security-2026-10.sql confirmed applied); headers strict. Open item: react-router 6.x has moderate advisories fixed only in v7 (breaking); the login `next` redirect is validated as a defence.
- Sign-in is two steps (16 Oct 2026, Raed's request): email + password are checked on the server (`api/login-start.js`), which records the check in `login_checks` and emails a code (generateLink + our SMTP); the browser signs in only with that code (`verifyLoginCode`). The dashboard (`is_admin()`, `adminFromRequest`) accepts only a code session that follows a recorded password within 15 minutes. SQL: `login-code-2026-10.sql` (wiped old passwords) then `login-2fa-2026-10.sql`.
- Staff & permissions (16 Oct 2026, Raed's request): the owner adds staff by email in لوحة التحكم ← الفريق والصلاحيات (`src/pages/admin/Team.jsx`, `api/staff.js`, table `public.staff`), with ready roles (مدير عام، مصمم، مسؤول الطلبات، مسوّق) or hand-picked areas (`src/lib/perms.js`). Every area is enforced in the database (`has_perm(area)` in RLS and the admin RPCs) and on the server (`adminFromRequest(req, area)`); `is_admin()` stays owner-only (two-step session + role admin). Staff sign in the same two steps. The team page itself is owner-only. SQL: `staff-2026-10.sql`.
