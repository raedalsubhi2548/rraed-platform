// Reads the customers export Salla sends (Excel .xlsx, first sheet) in the browser, so the file goes from Raed's
// device straight to his database (owner_import_salla_customers) and never through GitHub or a chat.
// Columns used, by their header in Salla's export: ID, Full_Name, Mobile, Email, City, Gender, Created_At,
// Order_Count, Total_Spent, Last_Purchase_Date. Anything else in the file is ignored.
import { unzipSync, strFromU8 } from 'fflate'

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const colOf = (ref) => ref.replace(/\d+$/, '')

function readSheet(files) {
  const xml = (name) => (files[name] ? new DOMParser().parseFromString(strFromU8(files[name]), 'application/xml') : null)
  const shared = [...(xml('xl/sharedStrings.xml')?.getElementsByTagNameNS(NS, 'si') || [])].map((si) => [...si.getElementsByTagNameNS(NS, 't')].map((t) => t.textContent).join(''))
  const sheetName = Object.keys(files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0]
  if (!sheetName) throw new Error('الملف ما فيه ورقة بيانات')
  return [...xml(sheetName).getElementsByTagNameNS(NS, 'row')].map((row) => {
    const out = {}
    for (const c of row.getElementsByTagNameNS(NS, 'c')) {
      const t = c.getAttribute('t'), v = c.getElementsByTagNameNS(NS, 'v')[0]?.textContent ?? ''
      out[colOf(c.getAttribute('r'))] = t === 's' ? shared[Number(v)] ?? '' : t === 'inlineStr' ? [...c.getElementsByTagNameNS(NS, 't')].map((x) => x.textContent).join('') : v
    }
    return out
  })
}

/** File → rows ready for importSallaCustomers. Throws an Arabic message when the file isn't Salla's export. */
export async function readSallaCustomers(file) {
  if (file.size > 15e6) throw new Error('الملف كبير جداً')
  let files
  try { files = unzipSync(new Uint8Array(await file.arrayBuffer())) } catch { throw new Error('ارفع ملف Excel (.xlsx) اللي أرسلته سلة') }
  const [head, ...rows] = readSheet(files)
  const col = Object.fromEntries(Object.entries(head || {}).map(([c, h]) => [String(h).trim(), c]))
  if (!col.ID || !col.Mobile) throw new Error('الملف ما فيه أعمدة عملاء سلة (ID وMobile)')
  const get = (r, h) => String((col[h] && r[col[h]]) ?? '').trim()
  return rows
    .map((r) => ({
      id: get(r, 'ID'),
      name: get(r, 'Full_Name'),
      mobile: get(r, 'Mobile').replace(/[^\d+]/g, ''),
      email: get(r, 'Email').toLowerCase(),
      city: get(r, 'City'),
      gender: get(r, 'Gender'),
      joinedAt: get(r, 'Created_At').replace(' ', 'T'),
      orders: Number(get(r, 'Order_Count')) || 0,
      spent: Number(get(r, 'Total_Spent')) || 0,
      lastOrder: get(r, 'Last_Purchase_Date').slice(0, 10),
    }))
    .filter((r) => r.id)
}

/** A CSV that opens correctly in Excel (UTF-8 with BOM), for an email or SMS tool. */
export function downloadCsv(name, header, rows) {
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  const blob = new Blob(['﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
