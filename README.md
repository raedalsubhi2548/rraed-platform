# منصة رائد — rraed-platform

منصة رائد (rraed.com) ببرمجة مخصصة: واجهة متجر، حساب للعميل (طلباته وأمنياته وبياناته)، ولوحة تحكم كاملة للإدارة. المنتجات والتصنيفات منقولة من متجر رائد في سلة.

**التقنيات:** React + Vite للواجهة، Supabase لقاعدة البيانات والدخول وتخزين الصور، Tap Payments للدفع، والاستضافة على Vercel.

---

## يشتغل على وضعين

| الوضع | متى | وين تنحفظ البيانات |
|---|---|---|
| **وضع العرض** | ما فيه مفاتيح Supabase | في متصفح الزائر فقط — للتجربة والمعاينة |
| **الوضع الحقيقي** | بعد إضافة مفاتيح Supabase في Vercel | في قاعدة بيانات Supabase لكل العملاء |

في وضع العرض، دخول الإدارة: `admin@rraed.com` / `raed2026` (يظهر في صفحة الدخول).

---

## خطوات التشغيل الحقيقي

### 1) Supabase
1. أنشئ مشروع جديد في [supabase.com](https://supabase.com).
2. افتح **SQL Editor** وشغّل محتوى `supabase/schema.sql` ثم `supabase/seed.sql`.
3. من **Authentication → URL Configuration** حط رابط موقعك في **Site URL**.
4. سجّل حساب من الموقع، ثم شغّل في SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'بريدك@هنا';
   ```
5. لإرسال إيميلات التفعيل من بريدك (raed@rraed.com) اربط SMTP من **Authentication → Emails → SMTP** (مثل Resend).

### 2) Vercel
1. **Add New → Project** واختر مستودع `rraed-platform`. الإعدادات تنكشف تلقائياً (Vite).
2. في **Settings → Environment Variables** أضف:

| المتغير | القيمة | ملاحظة |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | من Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | anon public key | من نفس الصفحة |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **سري** — للسيرفر فقط |
| `TAP_SECRET_KEY` | `sk_live_...` أو `sk_test_...` | من لوحة Tap → goSell → API Keys |
| `SITE_URL` | `https://rraed.com` | رابط موقعك بدون / في الآخر |
| `VITE_BANK_INFO` | اسم البنك والآيبان | اختياري — يظهر للعميل عند اختيار التحويل البنكي |

3. **Redeploy** بعد إضافة المتغيرات.

### 3) Tap Payments
- في لوحة Tap أضف رابط الـ Webhook: `https://موقعك/api/tap-webhook`
- جرّب أولاً بمفتاح `sk_test_` وبطاقة تجريبية، وبعدها بدّله بـ `sk_live_`.
- الدفع آمن: السعر يُحسب داخل قاعدة البيانات (`place_order`)، والطلب يتحول «مدفوع» فقط بعد ما السيرفر يتأكد من Tap مباشرة أن المبلغ وصل وأنه يطابق الطلب.

### 4) الدومين
من Vercel → **Settings → Domains** أضف دومينك، وعدّل `SITE_URL` و Site URL في Supabase.

---

## المنتجات الرقمية (مثل الدليل)
1. ارفع الملف في Supabase → **Storage → downloads** (مخزن خاص).
2. في لوحة التحكم افتح المنتج، فعّل «منتج رقمي»، واكتب مسار الملف (مثل `guide.pdf`).
3. العميل يشوف زر «تحميل الملف» في صفحة طلبه بعد الدفع، والرابط صالح 10 دقائق فقط.

---

## التشغيل على جهازك
```bash
npm install
cp .env.example .env   # اتركه فاضي لوضع العرض
npm run dev
```

## هيكل المشروع
```
src/
  data/seed.js        المنتجات والتصنيفات المنقولة من سلة
  lib/api.js          يختار Supabase أو وضع العرض تلقائياً
  lib/supa.js         الاتصال بـ Supabase
  lib/local.js        وضع العرض (بيانات المتصفح)
  pages/              صفحات المتجر
  pages/account/      حساب العميل
  pages/admin/        لوحة التحكم
api/                  دوال Vercel: الدفع عبر Tap وروابط التحميل
supabase/             schema.sql و seed.sql
scripts/seed-sql.mjs  يعيد توليد seed.sql من seed.js
```

## الشعار الرسمي
ارفع ملف الشعار في `public/logo.svg` وأضف المتغير `VITE_LOGO_URL=/logo.svg`.
