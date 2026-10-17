# STORE BLUEPRINT: building a custom-coded store like منصة رائد

> **لرائد:** هذا الملف يشرح النظام كامل: كيف ينبني المتجر الخاص، وأجزاؤه، وليش كل قرار. ارفعه في أي محادثة تبي تبني فيها متجر جديد لعميل، واكتب نشاط العميل وهويته. كلاودي بيبني من الصفر بنفس النظام، مو نسخ ولصق.
>
> **For the assistant:** this is a system blueprint, not a codebase to clone. It describes the architecture, the data model, the security model, the payment flows and the admin features of a production store (rraed.com) that is proven to work. Build each new store fresh for its own brand, catalog and language, following these patterns. Don't copy the reference store's content, texts, images or IDs.
> Owner rules always apply: reply to Raed in Saudi Arabic, never invent facts, prices or durations (ask), and never ask for secrets in chat (give env var names and the owner enters the values).

---

## 1. What "custom store" means (what the client is buying)
- A store the client owns, under their own domain. No platform subscription, no plan limits, no locked features.
- **A storefront:**
  - Branded design, fast, mobile first, RTL Arabic.
  - Prerendered for SEO.
- **An admin dashboard on a subdomain** (for example `admin.client.com`). Same app, switched by host:
  - Orders, products, categories, customers, coupons and reports.
  - A visual store designer with design backups.
  - Team permissions.
- **Payments:**
  - Card / mada / Apple Pay through a hosted gateway (Tap).
  - Optional BNPL (Tamara).
- **Marketing:** GA4, ad pixels (Snap, TikTok, Meta) with purchase events, a server-side Conversions API, a blog, sitemap and structured data.
- **Email:** transactional emails at every order stage, a copy to the owner, and PDF invoices.

## 2. Architecture
```
Browser (React SPA, hydrated) ── static prerendered HTML on Vercel CDN
      │  anon key + user JWT
      ▼
Supabase (Postgres + RLS + SECURITY DEFINER RPCs, Auth, Storage)
      ▲  service-role key (server only)
      │
Vercel serverless functions /api/*  (payments, webhooks, email, invoices, rebuild, analytics hits, staff)
```
- **Frontend:** React 18 + Vite, Tailwind v4, Radix (dialogs and sheets), lucide icons. Arabic fonts self-hosted through @fontsource.
- **Prerender:** at build time, render every public route to HTML with React's `renderToString` and `StaticRouter`. Embed the catalog and settings JSON in the page, then `hydrateRoot` on the client.
  - Benefit: real HTML for Google and for link previews, and an instant first paint.
  - Rule: anything that differs between server and client (cart, dates, signed-in user) loads after hydration.
  - Because settings and catalog are baked in, a publish in the designer triggers a **Vercel deploy hook** to rebuild.
- **Backend:** Supabase. The DB is the source of truth for prices and totals. The browser never computes what the customer pays.
- **Serverless:** only for what needs secrets or must not be trusted to the browser: payment creation and confirmation, webhooks, sending email, PDFs, privileged admin actions (creating auth users), and rebuild.
  - **Vercel Hobby allows 12 functions.** Group endpoints as `?op=` inside one file. Files starting with `_` are shared helpers, not functions.
- **Demo mode:** with no Supabase env, a localStorage backend with the same interface runs, so the UI can be developed and tested offline. One `api` object picks the real or demo backend.

## 3. Data model (Postgres)
| table | purpose | key points |
|---|---|---|
| `profiles` | one row per auth user | `role` is `customer` or `admin`; created by a trigger on `auth.users` insert; users may update only name and phone |
| `categories` | catalog groups | slug id, sort, icon/image |
| `products` | services/products | slug id, price, sale_price, category_id, image, badge, featured, sort, summary, description (simple markdown), active, digital, `options` jsonb (option groups → values with extra price, radio/checkbox, required) |
| `product_files` | private download paths for digital products | never readable by customers directly |
| `orders` | orders | `number` sequence, user_id, `customer` jsonb (sanitized by trigger; email forced from auth), `items` jsonb snapshot (name, unit price incl. options, qty, options chosen), subtotal/discount/total, coupon, status, payment_method, payment_ref, `history` jsonb (status, time, note), `notified` text[] (emails already sent) |
| `coupons` | discounts | percent or fixed, active, expires_at, max_uses/used |
| `site_settings` | one row `main`, jsonb | everything the designer controls, size-capped |
| `settings_versions` | design backups | trigger copies every changed save; owner-only RPCs to list and restore |
| `staff` | team members | email, role name, perms[] |
| `login_checks` | two-step login proof | written by the server when the password was correct |
| `visits` | first-party analytics | path, source, device, city…; bots filtered on write |

**Order statuses:** `pending → paid → in_progress → review → completed`, plus `cancelled`. A paid order can never go back to pending.

## 4. Security model (the part that matters most)
- **RLS on every table.**
  - Customers read only their own orders, profile and wishlist.
  - `anon` gets nothing except the public catalog.
- **Privileged actions go only through SECURITY DEFINER RPCs.** Each one checks permission first:
  - `place_order` re-prices from the DB, validates options and coupon limits, and rate-limits orders per user.
  - `set_order_status`, the admin lists, the reports.
- **Permissions:**
  - `is_admin()` means owner role **and** a strong session.
  - `has_perm(area)` means owner, or staff with that area.
  - Areas: orders, reports, products, categories, customers, coupons, design, plus team (owner only).
  - The same check runs on the server (`adminFromRequest(req, area)`) **and** in the DB. The UI hiding a button is never the protection.
- **Two-step admin login:**
  1. The password is checked on the server (never in the browser).
  2. The server records a `login_checks` row and emails a one-time code.
  3. The browser signs in only with the code.
  4. A session counts as strong only if it is a code session within 15 minutes of a recorded password check (read from the JWT `amr`).
- **Destructive actions are owner-only**, with a confirm dialog: delete order, delete customer, restore design.
- **Secrets live only in Vercel env vars.** The service-role key is used only in `/api`.
- **Strict headers in `vercel.json`:** CSP allowlist (add every third-party script, frame or connect host on purpose), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Settings sanitizing:** every designer value passes one `mergeSettings()` function (URL allowlist, colors, text length caps, link checks) before it reaches the page. Raw settings are never rendered.
- **Every DB change is a new idempotent SQL file**, tested on a local Postgres 16 with a stubbed `auth.uid()` / `auth.jwt()`, and run by the owner in the Supabase SQL editor.

## 5. Payments
**Card through a hosted gateway (Tap)**
1. `POST /api/tap-charge` with the order id. The server checks the order belongs to the user and is pending, then creates the charge with `src_all` (mada, Visa, Mastercard, Apple Pay). The redirect goes back to `/order/:id`.
   - The charge is reused on retry.
   - A 100% coupon order is marked paid without a charge.
2. The redirect back and the webhook both call `confirmCharge(id)`. It **re-fetches the charge from Tap** (never trusts the redirect), checks it is CAPTURED and that amount and currency match, and moves the order pending → paid exactly once (`update … where status='pending'`).
3. Only the call that actually flipped the order sends the receipt, the invoice and the pixel purchase event.
4. Edge cases send an owner alert:
   - Payment arrived on a cancelled order.
   - A duplicate charge.

**BNPL (Tamara) — one function with `?op=config|start|notify|verify`**
- **`start`** creates a checkout session:
  - Amounts as `{amount, currency}`.
  - Items, consumer (phone as `9665XXXXXXXX`), and a shipping address (use the store city for online services).
  - `merchant_url` (success, failure, cancel, notification) and `risk_assessment`.
  - Returns the redirect to `checkout_url`.
- **`notify`** is the webhook. It verifies `tamaraToken` (a JWT, HS256, signed with the notification token, sent as a query param or Bearer header).
- **Confirmation:** read the Tamara order (`GET /merchants/orders/{id}`), match `order_reference_id` and the amount, **authorise**, flip the order to paid once, then **capture** (needs `shipping_info`). Uncaptured orders aren't settled.
  - If the order was already paid another way, cancel the Tamara order.
- **Owner rules** live in settings (min, max, coupons allowed, excluded categories). One pure module is used by both the pages and the server.
  - Below the minimum the option is greyed and no badge shows.
  - Show the exact instalment amount.
- **Rollout:** sandbox keys first → live behind a team-only flag → open to customers.

## 6. Storefront pages
- **Home:** made of **blocks** controlled by the designer: hero, promises, product rows (picked or by category), image + text (with optional price of a product), categories, testimonials, FAQ, banner, text.
- **Shop:** all services, with filters.
- **Category page.**
- **Service page:** price, option picker with live total, note field, add to cart, related items, rating if real.
- **Cart.**
- **Checkout:**
  - Contact details and payment method.
  - Coupon, validated on the server.
  - Mandatory terms checkbox.
  - A full-screen "redirecting…" hold while leaving to the gateway.
- **Order page:** tracker, history, pay-now for pending orders, invoice download, digital downloads after payment.
- **Account:** orders and wishlist.
- **Other pages:** blog, work/portfolio, reviews, contact, policies.
- **Login:** two-step for admins.
- **SEO per route:** title, description, canonical, JSON-LD (Organization, BreadcrumbList, Product with Offer, shippingDetails with deliveryTime, return policy), sitemap.xml, robots, llms.txt.
  - **No fake reviews or ratings.**
- **Speed and UX:** responsive images (webp), lazy loading, mobile-first, 16px side gutters, no horizontal scroll.
  - Grid children need `min-w-0`, or use `grid-cols-1`, or fixed-width content overflows on phones.

## 7. Admin dashboard
- **Overview:** KPIs.
- **Orders:**
  - Filter and search, open the detail sheet.
  - Change status, which emails the customer.
  - Create a manual order (existing or new customer, catalog items priced by the DB, custom lines, discount, pending or paid), with a copyable pay link.
  - Delete (owner only).
- **Products:**
  - CRUD with an option builder.
  - Images to public storage; digital files to private storage.
- **Categories.**
- **Customers:** every account with a label (owner, staff, customer); add a customer; delete customers only.
- **Coupons:** percent or fixed, expiry, max uses.
- **Reports:**
  - Visitors, views, sessions, bounce, sources, campaigns, devices, cities, pages, hours.
  - Revenue, orders, coupons, top products, live visitors.
  - All from first-party hits (bots filtered, the owner excluded with `?notrack=1`).
- **Store designer:**
  - Blocks (add, reorder, hide, edit), brand (logos, colors, fonts, radius, background), header and footer links, store info and social links, payment rules.
  - **Live preview iframe** that receives the unsaved draft by `postMessage`, and scales to fit the phone.
  - Publish saves, then rebuilds.
  - **Backups list** (owner only), with dates and one-click restore.
- **Team & permissions:** add staff by email with ready roles or chosen areas. The new staff member gets an invite email.
- **UI rule:** clean, no instructional text inside the dashboard.

## 8. Emails, invoices, tracking
- One mail helper sends with nodemailer SMTP.
  - Customer emails for created, paid, in progress, review, completed and cancelled, each sent once (the `notified` array).
  - Owner copies go to `ORDER_NOTIFY_TO`, else the admin emails, else the store email.
  - Branded HTML with a preheader.
- **PDF invoice** with PDFKit, Arabic font embedded, generated on demand.
- **GA4 and pixels:** page view, view content, add to cart, begin checkout, purchase. Purchase fires only after server confirmation.
- **Server-side CAPI** (Snap) on the paid flip, deduplicated by order id.

## 9. Setup checklist for a new client store
1. **Accounts in the client's name:** domain, Vercel, Supabase, SMTP mailbox, Tap merchant (needs a commercial registration / freelance certificate and IBAN), Tamara (optional), GA4, ad pixels.
2. **Brand inputs from the client:** logo (light and dark), colors, fonts, the catalog with real prices and options, policies text, contact numbers, delivery times. **Never invent any of these.**
3. **Repo:** fresh project with the same architecture.
4. **Supabase:** run the schema SQL files in order, then make the owner `role='admin'`.
5. **Vercel env vars** (names to give the owner): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, `TAP_SECRET_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ORDER_NOTIFY_TO`, `VERCEL_DEPLOY_HOOK`, plus pixel/CAPI tokens and Tamara keys if used.
6. **Domain:** apex for the store, `admin.` subdomain for the dashboard, both on the same Vercel project.
7. **Supabase auth:** email templates, SMTP, and redirect URLs for both hosts.
8. **Payment test:** a real small card payment end to end (redirect and webhook), the emails, the invoice, the pixel purchase.
9. **Search Console:** verify, submit the sitemap, request indexing of the key pages.
10. **Handover:** a project memory file (`CLAUDE.md`) in the repo with decisions, the SQL order, env names, and the rules that broke things.

## 10. Build order (so each step is testable)
1. Schema, RLS and RPCs → seed catalog → demo backend.
2. Storefront: catalog, service page, cart, checkout (demo) → prerender and SEO.
3. Auth (customer) → real `place_order` → Tap charge, confirm, webhook → emails and invoice.
4. Admin: orders → products/categories → customers/coupons → reports → designer and backups → team, permissions and two-step login.
5. Pixels and CAPI → blog → hardening pass (CSP, RLS review, rate limits) → BNPL.

## 11. Pitfalls that already cost time
- Ambiguous column names inside `RETURNS TABLE` plpgsql functions: qualify every column (`p.email`, `s.email`).
- Changing an RPC's return columns needs `drop function` first.
- A password session must never count as admin. Check `amr` and the recorded password check.
- Env var changes need a **Redeploy**. A sandbox flag left on makes live keys fail ("Merchant is not found").
- Keys pasted with spaces or "Bearer ": trim them on the server.
- Third-party embedded widgets may render empty in a strict-CSP SPA. Drawing the message yourself is safer.
- iOS iframe preview: scale it to the container, and set `overflow-x: hidden` inside.
- Sticky headers inside sheets can cover the close button. Give it a higher z-index.
- Prerendered pages need a redeploy after catalog rows change in the DB.
- The cloud dev container usually can't reach the live site or third-party APIs. Test logic with mocks and local Postgres, and let the owner do the live check.
