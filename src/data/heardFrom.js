// «كيف عرفتنا؟» at checkout (optional). Saved as customer.heard on the order and shown on the order in the dashboard,
// so Raed sees which channel brings paying clients (ChatGPT, Google, ads, Khamsat…). Ids stay stable; labels may change.
export const HEARD_FROM = [
  { id: 'ai', label: 'ChatGPT أو أداة ذكاء اصطناعي' },
  { id: 'google', label: 'بحث قوقل' },
  { id: 'google-ads', label: 'إعلان في قوقل' },
  { id: 'snapchat', label: 'سناب شات' },
  { id: 'tiktok', label: 'تيك توك' },
  { id: 'instagram', label: 'إنستغرام' },
  { id: 'x', label: 'X (تويتر)' },
  { id: 'khamsat', label: 'خمسات' },
  { id: 'salla', label: 'سلة' },
  { id: 'friend', label: 'صديق أو عميل سابق' },
  { id: 'other', label: 'غير ذلك' },
]

export const heardLabel = (id) => HEARD_FROM.find((h) => h.id === id)?.label || ''
