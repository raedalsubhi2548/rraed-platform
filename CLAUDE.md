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
  Posts (17 Oct 2026): 10, incl. `custom-store-vs-ready-platform` (flagship), `landing-page-benefits`, `tamara-instalments-store`, `ai-store-management-salla` (sources = our own service pages). Keep internal links between posts.
  Raed's direction (Oct 2026): articles sell benefits and features to attract clients and rank on keywords — no step-by-step setup tutorials. Each one ends with the matching `[[service:…]]` cards.
- Copy protection: `Layout.jsx` adds `.no-copy` (no select/copy/right-click/image drag) on public pages; cart, checkout, order, account and login stay copyable. Admin is not affected.
- Unknown addresses: `vercel.json` sends only app routes and single-segment slugs to `200.html`; anything else gets `404.html` with a real 404 status.
- Old URLs Google still knows (from the Salla era and an older static site) are 308-redirected in `vercel.json`: `/en/…`, `/fr/…` etc. → same path, `privacy`/`terms` → `/policies`, `contact.html` → `/contact`, `orders(.html)` → `/account`. Vercel rejects `/?` in a redirect source (deploy fails) — use two rules.
- Search Console (sc-domain:rraed.com), 15 Oct 2026: validation started for 5xx, 404, 403 and the 3 merchant-listing issues; indexing requested for /blog, all 6 posts, /salla-store-design, /add-products. Product-snippet rating warnings remain on the 6 services with no Salla ratings (by design, no fake reviews).
- `vercel.json` — strict CSP (update it when adding any third-party script/frame), redirects, headers.
- `public/llms.txt` — keep in sync when adding pages.

## Database (Supabase) — SQL files, run by Raed in the SQL Editor (never by us)
Order: `schema.sql` → `seed.sql` → `options.sql` → `hardening.sql` → `designer.sql` → `security-2026-10.sql` → `reports.sql` → `login-code-2026-10.sql` → `login-2fa-2026-10.sql` → `staff-2026-10.sql` → `login-grants-2026-10.sql` → `owner-tools-2026-10.sql` → `customers-fix-2026-10.sql` → `custom-store-product-2026-10.sql` (flagship product row) → `custom-store-sale-2026-10.sql` (flagship 4999 → 3999) → `freelance-terms-2026-10.sql` (freelance document: fees and terms in the service text) → `blog-2026-10.sql` (blog managed from the dashboard) → `customers-all-2026-10.sql` (customers page lists every account with kind owner/staff/customer; delete only customers).
`reports.sql` is confirmed run on production; `security-2026-10.sql` was handed over but not confirmed — ask Raed before relying on it. Re-running `schema.sql` reopens weaker grants — if it is ever re-run, re-run `security-2026-10.sql` after it.
New DB changes = a new SQL file in `supabase/` that Raed runs; test it first on a local Postgres 16 (`/usr/lib/postgresql/16/bin`) with stubbed `auth.uid()`.

## Env vars (names only; values are in Vercel)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TAP_SECRET_KEY`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ORDER_NOTIFY_TO` (optional), `VERCEL_DEPLOY_HOOK`, `TAMARA_API_TOKEN`, `TAMARA_NOTIFICATION_TOKEN`, `TAMARA_PUBLIC_KEY`, `TAMARA_SANDBOX` (=1 while testing; remove for live), `TAMARA_TEAM_ONLY` (=1: live but visible only to owner and team; remove to open for customers).
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
- Blog from the dashboard (18 Oct 2026, Raed's request): لوحة التحكم ← المدونة (`src/pages/admin/Blog.jsx`, `BlogEditor.jsx`; table `public.blog_posts`, area `blog` for staff). The 16 built-in articles stay in `src/data/blog/` and open in the same editor: saving stores a copy that replaces them (`mergePosts`). Public lists carry no article text; each article page fetches its own (`getPostBody`), and the build embeds only its own text per page. Saving rebuilds the site (`republish`). SQL: `blog-2026-10.sql`.
- Moyasar (مُيسّر) trial was built on 19 Oct 2026 and REMOVED the same day at Raed's request (commit e2a2cfd has all of it; `git revert` the removal commit to bring it back: owner-only payment form, api/moyasar.js, self-hosted moyasar-payment-form 2.3.0, Apple Pay domain file, CSP hosts). Raed has Moyasar's offer (setup 450 SAR, mada 1% capped 200, cards 2.75%, +1 SAR per successful payment); HANDOVER.md section 11 has the numbers.
- Policies update (19 Oct 2026, for Moyasar's review): `src/data/terms.js` gained «بيانات مقدّم الخدمة», a clearer «الدفع» (card data goes straight to the licensed gateway, never touches or is stored by us; we keep only the payment reference) and a fuller «الخصوصية» that discloses Google Analytics and the Snap pixel + Conversions API (hashed email/phone, order value). Keep the privacy text in step with what `api/_snap.js` and analytics really send. `TERMS_VERSION` was not bumped on purpose (additions only; `place_order` hardcodes the version in SQL). Not shown yet: the freelance-document/commercial-register number (ask Raed; never invent). If Moyasar becomes live, edit the «الدفع» section (it names Tap).
- Owner tools (16 Oct 2026, Raed's request), SQL `owner-tools-2026-10.sql`:
  - Design backups: a trigger on `site_settings` keeps every published design in `settings_versions` (date, who, note; last 200). Owner only: مصمم المتجر ← «النسخ الاحتياطية» lists them and restores one with a click (`owner_restore_design`, then a rebuild). Staff designers never see it.
  - New order from the dashboard (`admin_create_order`, area orders; button needs customers too): store services priced by the database like checkout, plus free lines, discount, pending or paid (`payment_ref` 'manual'). Pending ones get the «created» email and a copyable pay link `/order/<id>`.
  - Delete order (`owner_delete_order`) and delete customer (`api/staff.js?kind=customer` DELETE, auth user deleted, orders kept with user_id null; refuses owner/staff accounts) are owner only. Add customer (`?kind=customer` POST) needs the customers area.
- Tamara instalments (17 Oct 2026; Tabby was rejected and removed from payment badges/terms, the «التسجيل في تابي» service stays): `api/tamara.js` (one function: `?op=config|start|notify|verify`; the 12th and last function on the Hobby plan — merge, don't add). Checkout and the pending order page offer «قسّمها على N دفعات بقيمة X» (store floor 300 SAR: below it the option is greyed and no Tamara badge shows anywhere, server refuses too; exact instalment e.g. 399/4 = 99.75; no city asked: Tamara address uses the store city «الرس»; plans and limits come from Tamara payment-types via `?op=config`; in sandbox the error shows Tamara’s raw reason); own Tamara line (badge + «قسّمها على N دفعات بقيمة X») under the price on service pages, cart and service cards (`TamaraMini`) — Tamara’s script widget was dropped (rendered empty) (`src/components/brand/Tamara.jsx`, hidden until `?op=config` says enabled; in sandbox mode config and start answer enabled only to the owner and team accounts, checked on the server with the session). An order is marked paid only after the server reads the Tamara order, the amount matches, and authorise succeeds; then capture right away. Tamara order id is stored as `payment_ref = 'tamara:<id>'` (payment_method stays 'card', no SQL). Webhook URL for the Tamara portal: `https://rraed.com/api/tamara?op=notify` (tamaraToken JWT HS256 with TAMARA_NOTIFICATION_TOKEN). CSP allows cdn.tamara.co / *.tamara.co.
- Tamara rules are owner-editable (17 Oct 2026): مصمم المتجر ← معلومات المتجر ← «التقسيط مع تمارا» (owner only): min (default 300), max (0 = none), whether coupon orders may use Tamara, excluded categories (default `subscriptions`). Stored in `site_settings.data.payments.tamara`, sanitized by `src/lib/payrules.js` (`tamaraRules`, `tamaraBlock`) which both mergeSettings and `api/tamara.js` use, so pages and server apply the same rules.
- Flagship service «تصميم متجر إلكتروني خاص بالبرمجة» (`custom-ecommerce-store`, price 4999 / sale 3999 SAR — any sale price shows in red with the old one struck through, on the service page, cards, home block and blog boxes, sort 0, featured, badge «الأقوى عندنا», image `public/brand/products/custom-ecommerce-store.webp` = real screenshots of our dashboard + storefront). Gift: domain + hosting free for the first year (Raed’s offer). Delivery 10–15 days (DELIVERY_DAYS override in seo.js). Home block `custom-store` (imageText, right after the hero) is added once to saved home pages by `withCustomStore` in theme.js; `added.customStore` keeps a removed block from coming back. Service-page descriptions render only `##` headings and `- ` bullets (no bold/quotes/tables). Row added by `supabase/custom-store-product-2026-10.sql`; redeploy after running it so the page is prerendered.
