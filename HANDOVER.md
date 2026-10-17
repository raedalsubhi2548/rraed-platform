# HANDOVER — منصة رائد (rraed.com)

> **للمالك (رائد):** ارفع هذا الملف في أول رسالة بأي محادثة جديدة، واكتب تحته طلبك. فيه كل شي عن المتجر، فما تحتاج تشرح من جديد.
>
> **For the assistant:** this file is the full context of Raed's custom store. Read it fully before doing anything. If you have repo access, `CLAUDE.md` in the repo root is the live, always-updated project memory. Read it too, and if the two disagree, `CLAUDE.md` wins. Last updated: 17 Oct 2026.

---

## 0. How to work with Raed (non-negotiable)
- **Reply in Arabic, Saudi dialect, always.** That includes progress updates and summaries. He gets angry at English replies.
- Short and direct. Do the work instead of explaining it, and finish with a short summary of what changed.
- **Never invent numbers, prices, facts or durations.** Leave a blank and ask.
- **Never ask for or paste secrets** (API keys, tokens, passwords) in chat or commits. Raed puts them in Vercel or Supabase himself. Give him the exact variable **names**, each in its own code block so he can copy them on his phone.
- **No instructional notes or hints inside the admin dashboard UI.** He wants a clean dashboard.
- Prompts written for coding agents are in English. The conversation with him stays in Arabic.
- He works from an **iPhone**. Give him direct links, short numbered steps, and copy-paste blocks. Send SQL as a GitHub link to the file **or** paste it inline in a ```sql block.
- Ask before anything irreversible or account-changing. Delete features exist but are owner-only and ask for confirmation.
- Legal and government content gets a "للتوضيح وليس استشارة قانونية" note.

## 1. What it is
- Custom-coded store selling Raed's services: Salla store design, landing pages, a custom-coded store, ads, pixels and Google tools, government paperwork, and so on.
- Brand: **منصة رائد**. Store WhatsApp: **0536090915** (966536090915). Store email: info@rraed.com.
- Store: https://rraed.com. Admin: https://admin.rraed.com (the same app, switched by host in `src/lib/host.js`).
- GitHub: `raedalsubhi2548/rraed-platform` (renamed from `waarfe-store`; the old remote URL still redirects).
- Vercel project: `raeds-projects-244625ce/waarfe-store`. Hobby plan, so a **12 serverless function limit, and 12 are used**.
  - Env vars: https://vercel.com/raeds-projects-244625ce/waarfe-store/settings/environment-variables
  - Deployments: https://vercel.com/raeds-projects-244625ce/waarfe-store/deployments
  - To redeploy: open the **Production** deployment, tap ⋯, then **Redeploy**.
- Supabase project: `dpjobithiiryniconytd`. SQL editor: https://supabase.com/dashboard/project/dpjobithiiryniconytd/sql/new
- Raed's own email: r1alsubhi@gmail.com. Git commits use `-c user.name=Raed -c user.email=r1alsubhi@gmail.com`.

## 2. Stack
- React 18 + Vite SPA, Tailwind v4, lucide icons, Radix.
- **Build-time prerender (SSR):** `npm run build` runs the client build, then `vite build --ssr src/entry-server.jsx`, then `scripts/prerender.mjs`.
  - Every public route and `sitemap.xml` are prerendered with the catalog and settings baked in (`#__catalog`). The client hydrates.
  - Anything that differs between the server render and the first client render must load after hydration.
- **Supabase:** auth, Postgres with RLS and SECURITY DEFINER RPCs, and storage (`products` is public, `downloads` is private).
- **Vercel functions in `api/`, all 12:**
  - `art`, `download`, `hit`, `invoice`, `login-start`, `order-email`, `rebuild`
  - `staff` (team, plus customers via `?kind=customer`)
  - `tamara` (`?op=config|start|notify|verify`)
  - `tap-charge`, `tap-verify`, `tap-webhook`
  - **Never add a 13th.** Merge new endpoints into an existing function with `?op=` or `?kind=`.
- Demo mode runs when there is no Supabase env: `src/lib/local.js` (localStorage). Real mode: `src/lib/supa.js`. `src/lib/api.js` picks one. Both must expose the same methods.
- Email goes through nodemailer SMTP (Hostinger) from `api/_mail.js`. PDF invoices use PDFKit (`api/_invoice.js`).

## 3. Deploy and test
1. `npm run build` must pass.
2. Commit, push `main` (Vercel auto-deploys `main`), and keep `redesign` equal to `main`: `git branch -f redesign main && git push -f origin redesign`.
3. Check the deploy status: `gh api repos/raedalsubhi2548/rraed-platform/commits/<sha>/status --jq .state`. If gh says access isn't enabled, call the add_repo tool for `raedalsubhi2548/rraed-platform` with push access.
4. The cloud container usually **can't reach rraed.com** (egress allowlist). Raed checks the live site from his phone.

Local testing:
- **DB:** Postgres 16 at `/usr/lib/postgresql/16/bin`, with a stub `auth` schema (`auth.uid()` reads GUC `test.uid`, `auth.jwt()` reads `test.jwt`) and a stub `storage` schema. Load all SQL files in order, then the new file. Admin RPCs need a `login_checks` row from within 15 minutes and a jwt amr that is not "password".
- **UI:** Playwright with Chromium at `/opt/pw-browsers/...`, running against a static server on `dist/`, in demo mode.
  - Demo admin: localStorage `raed:users` holds `[{id:'u_admin',role:'admin',...}]`, plus `raed:session` set to `"u_admin"`.
  - Give every user a `createdAt`, or the date formatting throws.

## 4. Database: SQL files Raed runs himself in the SQL Editor (never us)
Order:
1. `schema` → `seed` → `options` → `hardening` → `designer` → `security-2026-10` → `reports`
2. `login-code-2026-10` → `login-2fa-2026-10` → `staff-2026-10` → `login-grants-2026-10`
3. `owner-tools-2026-10` → `customers-fix-2026-10` → `customers-all-2026-10` → `custom-store-product-2026-10`

Status as of 17 Oct:
- **Confirmed run:** everything up to `customers-all-2026-10`.
- **Probably run, not confirmed:** `custom-store-product-2026-10`. Raed was asked to run it again after the 10–15 day delivery text was added, then Redeploy.
- **Rules for new SQL:** every DB change is a new file in `supabase/`. Make it idempotent, test it on local Postgres, and give Raed the GitHub link or the inline SQL.
- **Don't re-run** `schema.sql`. It reopens weaker grants; if it ever is re-run, re-run `security-2026-10.sql` after it.
- `customers-check-2026-10.sql` is a diagnostic. It lists every account and why it does or doesn't show.

## 5. Env var names (values live only in Vercel)
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Tap and site: `TAP_SECRET_KEY`, `SITE_URL`
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ORDER_NOTIFY_TO` (optional)
- Build and Snap: `VERCEL_DEPLOY_HOOK`, `SNAP_CAPI_TOKEN`
- Tamara: `TAMARA_API_TOKEN`, `TAMARA_NOTIFICATION_TOKEN`, `TAMARA_PUBLIC_KEY`
  - `TAMARA_SANDBOX=1` uses the sandbox API. Remove it for live.
  - `TAMARA_TEAM_ONLY=1` keeps live Tamara visible only to the owner and team. **Remove it to open Tamara to customers.**

## 6. Features (what exists, and where)
**Store**
- Services live at top-level slugs (`/salla-store-design`). Categories: `design-services`, `marketing-services`, `subscriptions`, `government-services`.
- Cart, checkout, and an order page.
- Card / Apple Pay through Tap's hosted page. Tap is the only place money is confirmed, by re-fetching the charge. Totals are computed only in the DB (`place_order`).
- Blog with 6 SEO articles (`src/data/blog/`). Facts come only from help.salla.sa or our own service pages, and the articles sell benefits rather than tutorials.
- SEO: titles and descriptions, JSON-LD, sitemap, `llms.txt`.
  - `shippingDetails.deliveryTime` defaults to 2–6 days; the custom store is 10–15 (`DELIVERY_DAYS` in `src/lib/seo.js`).
- Copy protection on public pages.

**Dashboard** (admin.rraed.com)
- **Overview** and **Orders:** change status (emails the customer), create an order manually with a pay link, and delete an order (owner only).
- **Products** and **Categories.**
- **Customers:** lists every account with a label (owner, staff role, customer). Add a customer; delete is for customers only, by the owner.
- **Coupons.**
- **Reports:** first-party visitor analytics.
- **Store designer:**
  - Home blocks, brand, header/footer, store info, with a live preview that fits the phone.
  - **Design backups** (owner only): every publish is saved with its date, and restoring takes one click.
  - **Tamara rules** panel (owner only).
- **Team & permissions:** roles and areas, enforced in the DB with `has_perm` and on the server with `adminFromRequest`.
- Two-step login: password, then an emailed code. The dashboard only accepts code sessions.

**Analytics**
- GA4 `G-CX5HXTP046`.
- Snap Pixel plus Conversions API. **Never remove these.**

**Email**
- The customer gets an email at every stage, with an emoji subject.
- The owner gets a copy of every order email, sent to `ORDER_NOTIFY_TO`, else the admin emails, else the store email.

## 7. Tamara (live since 17 Oct 2026, team-only for now)
- **Code:** `api/tamara.js` plus `src/components/brand/Tamara.jsx` plus `src/lib/payrules.js`. The rules module is shared by the pages and the server.
- **Flow:**
  1. The checkout option «قسّطها مع تمارا» (instalment text like «4 دفعات بقيمة 99.75 ر.س») calls `?op=start`, which creates a Tamara checkout and redirects (a full-screen hold shows meanwhile).
  2. The customer comes back to `/order/:id?tamara=success&orderId=…`, which calls `?op=verify`.
  3. Webhook `https://rraed.com/api/tamara?op=notify` checks the tamaraToken JWT (HS256 with the notification token).
  4. The order is marked paid only after reading the Tamara order, matching the amount, and a successful authorise. Capture happens right away.
  5. The Tamara order id is saved as `payment_ref='tamara:<id>'`; `payment_method` stays `card`.
- **Owner rules:** Designer → معلومات المتجر → «التقسيط مع تمارا». Saved in `site_settings.data.payments.tamara`:
  - `min`: default 300. Below it, the checkout option is greyed and no badge shows anywhere.
  - `max`: 0 means no upper limit.
  - `coupons`: whether coupon orders may use Tamara.
  - `exclude`: categories, default `['subscriptions']`.
- **Display:** our own badge line under prices (service page, cart) and on service cards (`TamaraMini`). Tamara's script widget was dropped because it rendered empty.
- **No city field.** The address uses the store city «الرس».
- **Errors:** in team-only or sandbox mode, the error shows Tamara's raw reason plus `[live]` or `[sandbox]`.
- **Tamara portal:** a webhook is registered (type Order, events Approved and Authorised).
- **Open items:**
  - Raed was told to regenerate the live Merchant Key, because part of it was exposed in a screenshot.
  - After a successful real test order, remove `TAMARA_TEAM_ONLY` and redeploy.
- **Tabby was rejected.** It was removed from payment badges and terms. The «التسجيل في تابي» service still exists.

## 8. Flagship product: «تصميم متجر إلكتروني خاص بالبرمجة»
- Slug `custom-ecommerce-store`, **3999 SAR**, category design, sort 0, featured, badge «الأقوى عندنا».
- Includes Tamara. Gift: **domain + hosting free for the first year**. Delivery: **10–15 days**.
- Image: `public/brand/products/custom-ecommerce-store.webp`, built from real screenshots of our dashboard and storefront.
- Home block `custom-store` (imageText, right after the hero) with image `public/brand/ai/raed-custom-store.webp`.
  - `withCustomStore()` in `src/lib/theme.js` inserts it once into saved home pages.
  - The `added.customStore` flag stops a deleted block from coming back.
- The description lives in the DB (`supabase/custom-store-product-2026-10.sql`) and in `src/data/seed.js` for demo. Service pages render **only `##` headings and `- ` bullets**: no bold, quotes or tables.

## 9. Rules that broke things before
- Don't break checkout, Tap or Supabase flows. After touching them, test the demo checkout.
- Settings reach the page **only** through `mergeSettings` in `src/lib/theme.js`. Add new settings there, with sanitizing.
- Published design settings are baked into the prerendered HTML, so Publish triggers a rebuild (`api/rebuild.js`).
- `admin_customers()` return columns: `id, name, email, phone, "createdAt", orders, spent, kind, "staffRole"`. Qualify column names, because ambiguous `email` broke it once.
- The CSP in `vercel.json` is strict. Update it when adding any third-party script, frame or connect host (Tamara is already there).
- The embedded Tap card SDK was tried and reverted. Don't re-add it.
- A luxury "night route" redesign was rejected. It lives on branch `luxury`.
- Sheets on mobile: the close (X) button sits above sticky headers (z-20). The backups window is a centered dialog.

## 10. Possible next steps (only when Raed asks)
- Open Tamara to everyone after his live test (remove `TAMARA_TEAM_ONLY`).
- In Search Console, click "Validate fix" for the deliveryTime issue (it's already fixed in code).
- Upgrade react-router to v7 (moderate advisories; this is a breaking upgrade).

## 11. Tools Raed has (MCP links shared before)
- Perplexity, Playwright, Firecrawl and Glyph MCPs were suggested to him.
- Salla MCP is connected for his other Salla stores. It is **not** related to this custom store.
