const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

// แปลง 'YYYY-MM-DD' (ค.ศ.) เป็นข้อความ พ.ศ. เช่น '24 ก.ย. 2569'
export function formatThaiDate(iso) {
  const match = ISO_DATE.exec(iso ?? '')
  if (!match) return ''
  const [, year, month, day] = match
  const monthName = THAI_MONTHS[Number(month) - 1]
  if (!monthName) return ''
  return `${Number(day)} ${monthName} ${Number(year) + 543}`
}

// แปลง Date เป็น 'YYYY-MM-DD' ตามวันที่ท้องถิ่น (ไม่ใช้ toISOString เพราะเป็น UTC)
export function toIsoDate(date) {
  const yyyy = String(date.getFullYear()).padStart(4, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
