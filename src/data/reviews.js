// Customer reviews published on Raed's earlier Salla store (testimonials + product ratings).
// Pulled from the Salla reviews API, Oct 2026. All published reviews are 5 stars.
// Text is verbatim. Do not edit wording or add reviews that aren't on Salla.
const RAW_REVIEWS = [
  { name: 'Hussin Judeeba', city: 'الخفجي', date: '2026-01', text: 'من أفضل المتاجر المتخصصة في تصاميم المتاجر الإلكترونية. ذوق عالي، احترافية في العمل، ودعم متعاون. النتيجة فاقت التوقعات 👌✨' },
  { name: 'طريفة الشويعر', city: 'المدينة المنورة', date: '2025-11', text: 'بدون مبالغة من افضل المتاجر الرقمية اللي تعاملت معاها .. تعاملهم ودقة التنفيذ ولا غلطة ماشاءالله تبارك الله' },
  { name: 'ياسر', city: 'الرياض', date: '2025-11', text: 'والله من تجربه متجري تغير 180% + ثقه تستاهل كل خير' },
  { name: 'متجر برهه', city: 'هروب', date: '2026-04', text: 'ما شاء الله تبارك الله، حقيقه تصميم ولا غلطه الله يسلم يدك. شكرا لتفهمك وصبرك علي. والله تصاميم قمه في الروعة ومتجر غايه في الجمال ما ندمت على كل ريال دفعته شكرا لك' },
  { name: 'طلال', city: 'الرياض', date: '2026-01', text: 'ماشاءالله الاسلوب والرد بالوقت وتعامل جداا سريع كنت اتوقع ان شغلي بياخذ يومين م كمل ٣ساعات الا وهو جاهز شكراا والله' },
  { name: 'محمد فواز', city: 'الكويت', date: '2026-06', text: 'للامنه والصراحه جدا راقيين بالرد وسرعه الرد والشغل والتصميم ممتاز سويت عندهم متجر كامل وم قصرو والشغل كان ممتاز الله يعطيكم العافيه' },
  { name: 'Kiffah', city: 'الرياض', date: '2025-11', text: 'سويت متجر سله عندهم شغل خيالي وفي وقت قصير يعطيكم العافيه 😍🤍🤍🤍' },
  { name: 'مشعل عبدالله', city: 'حائل', date: '2025-11', text: 'لأكثر من مره أتعامل معكم للامانه متعاونين ومحترفين ومتفهمين لكل طلب واهم شي السرعه والإنجاز بالتوفيق لهم يارب 🙏🏻' },
  { name: 'تركي البجيس', city: 'الهفوف', date: '2025-12', text: 'شغل جميييل من متجر اقل من عادي الى احترافي👍🏼 تصميم جميل والتعامل احلى واحلى شكراً لكم انصح فيه وبقوه' },
  { name: 'turki alsharif', city: 'مكة المكرمة', date: '2025-11', text: 'للأمانة كلمة حق تُقال التعاون في الرد على الاستفسارات والرفع لغرض اصدار الوثيقة كان التجاوب سريعا ً نحن معكم في التوسع لمجالات اخرى كلمة شكر لو توفيكم وجزيتم خيرا' },
  { name: 'ميار القحطاني', city: 'الرياض', date: '2025-11', text: 'افضل متجر تعاملت معه سلسين ف التعامل والتصميم جميله جداً تسلمون على كل شي ومو اخر تعامل باذن الله' },
  { name: 'تغريد القفاري', city: 'الرياض', date: '2026-01', text: 'خدمه رائعه وانجاز بوقت قياسي وتواصل سريع الله يبارك لكم ويوفقكم' },
  { name: 'أمينة المطيري', city: 'الرياض', date: '2026-04', text: 'تصميم جميل ومميز، يتميز بتناسق الألوان وترتيب العناصر بشكل واضح وجذاب، مما يسهل فهم الفكرة ويعكس ذوقًا عاليًا.' },
  { name: 'تركي السبيعي', city: 'الغريف', date: '2026-05', text: 'متعاونين ومجتهدين وواضحين صراحة اعجز عن وصف وتقييم تجربتي معهم وعسى الله يوفقهم' },
  { name: 'سعد المسهر', city: 'الرياض', date: '2025-12', text: 'ممممتاااز يعطيكم الف الف عافيه الصراحه رقيه في التعامل و محترمين جداً جداً جداً الله يوفقكم يارب' },
  { name: 'دانه المطيري', city: 'المجمعة', date: '2025-12', text: 'والله جبارين متجري مرتب وحلووو الله يسعدكمممم فوققق التقيييم' },
  { name: 'تركي متعب', city: 'حائل', date: '2025-10', text: 'ترتيب الموقع بشكل ممتاز والتصاميم جدا رائعة، اتمنى لكم التوفيق' },
  { name: 'Ahmed Alzahrani', city: 'الرياض', date: '2026-02', text: 'والله ماقصرت ترد بسرعه والشكل النهائي نفس اللي ببالي واحسن' },
  { name: 'اسامة المطيري', city: 'الرياض', date: '2026-07', text: 'من افضل المتاجر بسرعة الرد وجودة الخدمة انصح وبقوة بالتعامل معهم' },
  { name: 'نجلاء', city: 'حائل', date: '2025-11', text: 'سرعه واسلوب وتعامل والله يستاهلون كل ريااااال' },
  { name: 'missa asiri', city: 'خميس مشيط', date: '2025-11', text: 'سويت بنر واحد وحرفياً ابداااع تبارك الله وامانه بالشغل ✨' },
  { name: 'عبدالرحمن الحميدي', city: 'الرياض', date: '2025-12', text: 'عمل بكل امانه واجتهاد جبار ، الله يجزاكم خير' },
  { name: 'زهور محمد', city: '', date: '2026-02', text: 'سلاسه وسهوله بالتعامل وجدا متعاونين وشغلهم ولااروع' },
  { name: 'Mohammed', city: 'صفوى', date: '2025-11', text: 'تصاميم جميلة و تعامل رائع و أسعار مناسبة.' },
  { name: 'عبدالله محمد', city: 'مكة المكرمة', date: '2025-10', text: 'خدمة سريعة وتعامل اكثر من رائع👍' },
  { name: 'منذر', city: 'المبرز', date: '2026-04', text: 'متعاون و سريع، يستاهل افضل من 5 نجوم 👍🏻' },
  { name: 'محمد الحربي', city: 'بريدة', date: '2025-11', text: 'شغل احترافي وسريع ❤️' },
  { name: 'أمينه', city: 'تبوك', date: '2026-02', text: 'يعطيك العافيه المتجر جدا جميل' },
  { name: 'رافع العنزي', city: 'الرياض', date: '2026-01', text: 'شغل ممتاز 👍' },
  { name: 'Saud Saeed', city: 'الرياض', text: 'من أول تواصل كان فيه وضوح وتنظيم، وكل خطوة كانت محسوبة. التنفيذ كان سريع، التفاصيل مضبوطة، والتعامل جدًا راقي ومحترم. اشتغلوا على المتجر وكأنه مشروعهم، وتابعوا معنا كل ملاحظة لين طلع بالشكل المطلوب.' },
  { name: 'Njood', city: 'الرياض', text: 'ماشاء الله شغل احترافي سعدت بالتعامل معكم وبوقت سريع ماشاء الله وجودة عالية' },
  { name: 'عبدالعزيز بسام', city: 'الرياض', text: 'الخدمة ممتازة وسريعة، التصميم طلع احترافي جدًا. 👌🏼' },
  { name: 'عبدالله الرشيدي', city: 'المدينة المنورة', text: 'ماشاءالله تبارك الله ابداع والله وفوق الابداع' },
  { name: 'Shafi Alanzi', city: 'الرياض', text: 'الله يسعدكم من افضل المتاجر والله وتعامل سريع بالتوفيق يارب' },
  { name: 'حامد', city: 'الجموم', text: 'شكرا على التعامل المميز والراقي من افضل التجارب العمل معكم جميل 👍🏻' },
]

// Reviews that named the earlier store, or addressed the designer as a woman (the store is Raed's), are left out.
// The wording of the rest is untouched.
export const ALL_REVIEWS = RAW_REVIEWS

const byName = (n) => ALL_REVIEWS.find((r) => r.name === n)
// Homepage: one featured review + four short ones.
export const FEATURED_REVIEW = byName('Hussin Judeeba')
export const HOME_REVIEWS = ['طريفة الشويعر', 'ياسر', 'محمد فواز', 'مشعل عبدالله'].map(byName)

// Per-service ratings from the Salla store (products API, Oct 2026): every rating there is 5 stars.
// `count` is Salla's own rating count for that product. `reviews` are written ratings whose order had only this
// service, so they belong to it for sure. Text is verbatim. Shown on the service page and in its Product schema.
export const SERVICE_RATINGS = {
  'salla-store-design': { count: 25, reviews: [
    { name: 'لجين الهجيني', date: '2026-07-28', text: 'خدمة رائعه خمسه نجوم من جد أنصحكم فيه' },
    { name: 'طريفة الشويعر', date: '2025-11-09', text: 'دقة العمل والاسلوب يدرّسون ماشاءالله 👍🏼' },
    { name: 'هديل الغامدي', date: '2025-11-08', text: 'كل شي حلو والتعامل احلى ورااااقي' },
    { name: 'ياسر', date: '2025-11-01', text: 'جدا جميل التصميم' },
    { name: 'Mohammed', date: '2025-11-01', text: 'تصميم جميل و تعامل رائع' },
  ] },
  'pixel-integration': { count: 6, reviews: [] },
  'google-tools-integration': { count: 6, reviews: [] },
  'logo-design': { count: 4, reviews: [] },
  'tabby-registration': { count: 3, reviews: [] },
  'tmara-registration': { count: 2, reviews: [] },
  'freelance-certificate-family-platform': { count: 2, reviews: [
    { name: 'هدى الحارثي', date: '2025-11-06', text: 'عسسسل وبسرعه انحزت' },
  ] },
  'tiktok-ads-creation': { count: 1, reviews: [] },
  'banner-design': { count: 1, reviews: [] },
  'add-products': { count: 1, reviews: [] },
}

// The three core services Raed wants up front (store design is also the #1 seller on Salla).
export const CORE_SERVICES = ['salla-store-design', 'landing-page-design', 'google-tools-integration']
