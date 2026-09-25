import { validateLoan } from './loanRules.js'
import { STORAGE_KEY } from './storage.js'

export const IMPORTED_FLAG_KEY = 'borrow-buddy:legacy-imported'

export const LEGACY_READ_WARNING =
  'อ่านข้อมูลเดิมในเบราว์เซอร์ไม่ได้ จึงไม่มีรายการให้ย้าย ข้อมูลเดิมไม่ถูกแก้ไข'
const INVALID_ENTRY_MESSAGE = 'ข้อมูลไม่อยู่ในรูปแบบรายการยืม'
const INVALID_DATE_MESSAGE = 'รูปแบบวันที่ไม่ถูกต้อง'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

// ตรวจเพิ่มจาก validateLoan: ชนิดข้อมูลและรูปแบบวันที่ (ฐานข้อมูลใช้ชนิด date จึงต้องเป็น YYYY-MM-DD จริง)
function checkEntry(entry) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return [INVALID_ENTRY_MESSAGE]
  }
  const { friendName, itemName, borrowedDate, dueDate, returnedDate } = entry
  const textOk = [friendName, itemName].every((v) => v === undefined || typeof v === 'string')
  if (!textOk) return [INVALID_ENTRY_MESSAGE]

  const dates = [borrowedDate, dueDate]
  if (returnedDate !== undefined && returnedDate !== null) dates.push(returnedDate)
  if (!dates.every((v) => v === undefined || v === '' || isValidIsoDate(v))) {
    return [INVALID_DATE_MESSAGE]
  }
  return validateLoan(entry)
}

// อ่านอย่างเดียว ไม่แก้/ลบข้อมูลเดิมใน localStorage
// คืน { loans, skipped, warning }
// - loans: Loan ที่ผ่านการตรวจ พร้อมนำเข้า (ไม่มี id/ownerId ให้ฐานข้อมูลสร้างเอง)
// - skipped: [{ index, label, errors }] รายการที่ไม่ผ่าน (index เริ่มที่ 1) ไม่หยุดทั้งชุด
// - warning: ข้อความไทยเมื่ออ่านไม่ได้/JSON เสีย
export function readLegacyLoans(storage = globalThis.localStorage) {
  let data
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return { loans: [], skipped: [], warning: null }
    data = JSON.parse(raw)
  } catch {
    return { loans: [], skipped: [], warning: LEGACY_READ_WARNING }
  }
  if (!Array.isArray(data)) return { loans: [], skipped: [], warning: LEGACY_READ_WARNING }

  const loans = []
  const skipped = []
  data.forEach((entry, i) => {
    const errors = checkEntry(entry)
    if (errors.length > 0) {
      const name = typeof entry?.itemName === 'string' ? entry.itemName.trim() : ''
      skipped.push({ index: i + 1, label: name || `รายการที่ ${i + 1}`, errors })
      return
    }
    loans.push({
      friendName: entry.friendName.trim(),
      itemName: entry.itemName.trim(),
      borrowedDate: entry.borrowedDate,
      dueDate: entry.dueDate,
      returnedDate: entry.returnedDate || null,
    })
  })
  return { loans, skipped, warning: null }
}

// ทำเครื่องหมายว่าย้ายแล้ว (เก็บเฉพาะธง ไม่แตะข้อมูล Loan เดิม) คืน true เมื่อสำเร็จ
export function markLegacyImported(storage = globalThis.localStorage) {
  try {
    storage.setItem(IMPORTED_FLAG_KEY, '1')
    return true
  } catch {
    return false
  }
}

export function isLegacyImported(storage = globalThis.localStorage) {
  try {
    return storage.getItem(IMPORTED_FLAG_KEY) === '1'
  } catch {
    return false
  }
}
