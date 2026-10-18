# HANDOVER — منصة رائد (rraed.com)

> **للمالك (رائد):** ارفع هذا الملف في أول رسالة بأي محادثة جديدة، واكتب تحته طلبك. فيه كل شي عن المتجر، فما تحتاج تشرح من جديد.
>
> **For the assistant:** this file is the full context of Raed's custom store. Read it fully before doing anything. If you have repo access, `CLAUDE.md` in the repo root is the live, always-updated project memory. Read it too, and if the two disagree, `CLAUDE.md` wins. Last updated: 19 Oct 2026.

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
- **SEO is his main marketing channel.** Look at every change through an SEO lens (title ≤ 60, description 70–158, one H1 with the keyword, internal links, JSON-LD, real 404s, speed). After a new page or article, offer to request indexing in Search Console (he must approve; Google allows only ~10–12 manual requests a day).
- Before installing any skill/package he sends: download to an isolated folder, read every file and script, then install. Never run code from a download unread.

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
  - `moyasar` (GET config, POST verify) — added 19 Oct
  - `tap-charge`, `tap-verify` (`tap-webhook` was merged into `tap-verify` on 19 Oct; a `vercel.json` rewrite keeps `/api/tap-webhook` working)
  - **Never add a 13th.** Merge new endpoints into an existing function with `?op=` or `?kind=`.
- Demo mode runs when there is no Supabase env: `src/lib/local.js` (localStorage). Real mode: `src/lib/supa.js`. `src/lib/api.js` picks one. Both must expose the same methods.
- Email goes through nodemailer SMTP (Hostinger) from `api/_mail.js`. PDF invoices use PDFKit (`api/_invoice.js`).

## 3. Deploy and test
1. `npm run build` must pass.
2. Commit, push `main` (Vercel auto-deploys `main`), and keep `redesign` equal to `main`: `git branch -f redesign main && git push -f origin redesign`.
3. Check the deploy status: `gh api repos/raedalsubhi2548/rraed-platform/commits/<sha>/status --jq .state`. If gh says access isn't enabled, call the add_repo tool for `raedalsubhi2548/rraed-platform` with push access.
4. As of 19 Oct 2026 `main` is the source of truth (recent work was pushed straight to `main`); `redesign` may lag behind.
5. The cloud container usually **can't reach rraed.com** (egress allowlist). Raed checks the live site from his phone.

Local testing:
- **DB:** Postgres 16 at `/usr/lib/postgresql/16/bin`, with a stub `auth` schema (`auth.uid()` reads GUC `test.uid`, `auth.jwt()` reads `test.jwt`) and a stub `storage` schema. Load all SQL files in order, then the new file. Admin RPCs need a `login_checks` row from within 15 minutes and a jwt amr that is not "password".
- **UI:** Playwright with Chromium at `/opt/pw-browsers/...`, running against a static server on `dist/`, in demo mode.
  - Demo admin: localStorage `raed:users` holds `[{id:'u_admin',role:'admin',...}]`, plus `raed:session` set to `"u_admin"`.
  - Give every user a `createdAt`, or the date formatting throws.

## 4. Database: SQL files Raed runs himself in the SQL Editor (never us)
Order:
1. `schema` → `seed` → `options` → `hardening` → `designer` → `security-2026-10` → `reports`
2. `login-code-2026-10` → `login-2fa-2026-10` → `staff-2026-10` → `login-grants-2026-10`
3. `owner-tools-2026-10` → `customers-fix-2026-10` → `customers-all-2026-10` → `custom-store-product-2026-10` → `custom-store-sale-2026-10`
4. `freelance-terms-2026-10` (freelance document service text: terms + notes) → `blog-2026-10` (dashboard blog table + `blog` staff area)

Status as of 17 Oct:
- **Confirmed run:** everything up to `customers-all-2026-10`, plus `freelance-terms-2026-10` (re-run 18 Oct after the fees card was removed; checked in the DB) and `blog-2026-10` (checked from outside: table readable, anon cannot write).
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
- Moyasar: `MOYASAR_SECRET_KEY`, `MOYASAR_PUBLISHABLE_KEY` — test keys (sk_test/pk_test); as of 19 Oct Raed was asked to add them and Redeploy (not confirmed yet). **Live keys switch every customer from Tap to Moyasar — never without Raed's go-ahead and a webhook.**

## 6. Features (what exists, and where)
**Store**
- Services live at top-level slugs (`/salla-store-design`). Categories: `design-services`, `marketing-services`, `subscriptions`, `government-services`.
- Cart, checkout, and an order page.
- Card / Apple Pay through Tap's hosted page. Tap is the only place money is confirmed, by re-fetching the charge. Totals are computed only in the DB (`place_order`).
- Blog: 16 built-in articles in code (`src/data/blog/`) + articles written in the dashboard (table `blog_posts`). Facts come only from help.salla.sa, official text Raed provides, or our own service pages; articles sell benefits, not tutorials. Service pages list their articles («مقالات تفيدك») and articles link to services and each other.
- Service FAQ with FAQPage JSON-LD: `src/data/serviceFaq.js` (freelance document has 6 Qs). Keyword H1s per service/section: `SEO_H1` in `src/lib/seo.js` (cards/cart keep the product name).
- Saudi Business Center trust seal «متجر موثّق» (`index.html`, floating bottom-left; hidden on the dashboard host and while any dialog is open; CSP allows eauthenticate.saudibusiness.gov.sa).
- Payment badges (`src/components/brand/PayIcons.jsx`): Tamara, Apple Pay, Visa, Mastercard, mada (mada = own file `public/brand/pay/mada.webp`, CC0 from Wikimedia).
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
- **Team & permissions:** roles and areas, enforced in the DB with `has_perm` and on the server with `adminFromRequest`. Areas include `blog`; ready roles include «كاتب محتوى».
- **Blog (المدونة):** list + editor (tools, live preview, SEO title/description counters, FAQ, linked services, publish/draft). Built-in articles open in the same editor; saving stores a copy that replaces them; «استرجاع الأصلي» deletes the copy. Saving triggers a site rebuild so the article gets a prerendered page and a sitemap entry.
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

## 10. SEO work (18–19 Oct 2026)
- Search Console (sc-domain:rraed.com) is open in the built-in browser with Raed's Google account. Baseline 28 days: 46 impressions, 2 clicks, avg position 22, all branded queries.
- Done: real 404s (catch-all rewrite removed; dashboard catalog changes rebuild the site), titles ≤ 60 (store name only when it fits), fuller descriptions, keyword H1s, 6 new high-intent articles (store design cost, best platform in Saudi, choosing a Salla designer, custom domain, Snapchat ads for stores, Tabby vs Tamara), two-way internal links, `llms.txt` updated, freelance-document FAQ schema.
- Indexing requested for all new articles and the freelance page; the quota ran out on the last one (`/blog/freelance-document-vs-commercial-registration`).
- Google Business Profile «منصة رائد» created and **verified** (category: Website designer, service area: Saudi Arabia); linked in JSON-LD (`sameAs`/`hasMap` = maps?cid=13261550770911996180 in `SITE`). Raed was asked to add logo, photos, services, socials, and to request reviews.
- Still open: Raed's social profile URLs for `SITE.sameAs`; backlinks (client stores footer credit «تصميم: منصة رائد», LinkedIn/Behance, Saudi directories — never buy links); next articles from the plan (logo design, Salla themes, free vs pro store, opening an e-store in Saudi, TikTok ads, landing page vs store, e-commercial registration, raising Salla sales).
- The full plan is a page: https://claude.ai/artifact/KMBYnh1evafiRVddSFN9Wk
- Brand-name note: «منصة رائد» collides with the government freelance platform «رائد» and others in Google; the business profile and long-tail keywords are how we stand apart.

## 11. Moyasar (مُيسّر) trial — 19 Oct 2026, owner only
- Goal: Raed decides whether to subscribe. Customers still pay with Tap.
- Code: `src/components/MoyasarPay.jsx` (official moyasar-payment-form 2.3.0, MIT, self-hosted in `public/vendor/moyasar/2.3.0/`, loaded only when shown), brand styles at the end of `src/index.css` (their utilities are `!important` under `div#mysr`, so ours use `.rr-pay div#mysr` + `!important`), `api/moyasar.js` (config + server-side check of status, amount in halalas, currency, `metadata.order_id`; test mode = owner's own orders only, kept out of Snap). Checkout sends the owner's card orders to `/order/<id>?new=1&pay=moyasar`; return URL `/order/<id>?moyasar=1&id=…`.
- Methods: card (mada/Visa/Mastercard), Apple Pay (web, via Moyasar's own merchant validation — no Apple Developer account), STC Pay. Apple Pay label must be English ("Raed").
- Apple Pay domain file is live at `/.well-known/apple-developer-merchantid-domain-association` (byte-identical; protected by `.gitattributes`). Raed must click Validate + Register for rraed.com in Moyasar → Settings → Apple Pay Domains.
- Tested locally end to end with Moyasar's published test card → 3DS emulator → back with status=paid. The server check needs the secret key in Vercel (pending).
- Test cards: Visa 4111 1111 1111 1111, mada 4201 3201 1111 1010 (any 2-word name, future date, any CVC). Apple Pay test: real card in Wallet, amount 200–300 SAR (other amounts fail in test mode).
- The form reads expiry/CVC on **keyup** only (automated typing that pastes text fails validation; real typing works).
- Before going live: webhook endpoint (merge into `api/moyasar.js` with `?op=`), live keys, decide Tap vs Moyasar. Offer (Moyasar Offer V4, preliminary): setup 450 SAR; mada 1% capped at 200 SAR; local cards 2.75%; international cards 3.75%; 1 SAR per successful transaction (fraud management) and per refund; Apple/Samsung Pay priced as the underlying card; tokenization 0.05 SAR; dashboard and payment links free; standard weekly settlement free, on-request transfer 10 SAR, daily settlement 4 SAR each; Amex/STC Pay +250 SAR setup each and % on request; prices exclude VAT; offer valid 30 days; contract via Nafath after final approval; setup fees non-refundable.

## 12. Skills installed globally (~/.claude/skills) for this machine
- `brag`, `brag-slim` (launch videos; FFmpeg installed via winget)
- `seo` + 32 `seo-*` sub-skills (claude-seo v2.4.2; `/seo audit https://rraed.com` etc.)
- `design-dna`, `motion-design`, `gsap-*` (8), `threejs-*` (10), Genjutsu `cast` / `paint` / `bunshin` + `_jutsu`. **Never run `bunshin` on the live store** (it rebuilds whole sites). Heavy animation/3D must not slow the mobile pages (SEO).

## 13. Local helpers (git-ignored)
- `.tmp-build.sh`: full build against the live catalog (reads the public publishable key from the live bundle). Use it before deploying anything that touches prerender/SEO.
- `.env.local`: `VITE_MOYASAR_TEST_PK` (public test key) so the demo server can show the Moyasar form.
- Windows: Python works via `py -3`; edit CRLF files with small node scripts; long paths break `git clone` into the scratch folder (clone to a short path).

## 14. Possible next steps (only when Raed asks)
- Moyasar: confirm the two Vercel variables + Redeploy, Apple Pay domain Validate/Register, Raed's test; then decide.
- Request indexing for `/blog/freelance-document-vs-commercial-registration` (quota ran out on 18 Oct).
- Add Raed's social links to `SITE.sameAs`; write the next planned articles.
- Open Tamara to everyone after his live test (remove `TAMARA_TEAM_ONLY`).
- In Search Console, click "Validate fix" for the deliveryTime issue (it's already fixed in code).
- Upgrade react-router to v7 (moderate advisories; this is a breaking upgrade).

## 15. Tools Raed has (MCP links shared before)
- Perplexity, Playwright, Firecrawl and Glyph MCPs were suggested to him.
- Salla MCP is connected for his other Salla stores. It is **not** related to this custom store.
