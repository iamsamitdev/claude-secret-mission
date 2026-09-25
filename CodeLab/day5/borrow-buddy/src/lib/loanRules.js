export const STATUS = {
  OUTSTANDING: 'outstanding',
  OVERDUE: 'overdue',
  RETURNED: 'returned',
}

// ข้อความสถานะภาษาไทยสำหรับแสดงผล (ตรงกับ CONTEXT.md)
export const STATUS_LABEL = {
  [STATUS.OUTSTANDING]: 'ยังไม่คืน',
  [STATUS.OVERDUE]: 'เกินกำหนด',
  [STATUS.RETURNED]: 'คืนแล้ว',
}

// วันที่เป็น 'YYYY-MM-DD' เทียบเป็นสตริงได้ตรงตามลำดับเวลา
// today รับเป็นพารามิเตอร์ เพื่อให้ทดสอบได้แน่นอน
export function getLoanStatus(loan, today) {
  if (loan.returnedDate) return STATUS.RETURNED
  return today > loan.dueDate ? STATUS.OVERDUE : STATUS.OUTSTANDING
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toUtcMs(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// จำนวนวันตั้งแต่กำหนดคืนถึงวันนี้ ใช้เฉพาะ Loan ที่เป็น Overdue นอกนั้นคืน 0
export function getDaysOverdue(loan, today) {
  if (getLoanStatus(loan, today) !== STATUS.OVERDUE) return 0
  return Math.round((toUtcMs(today) - toUtcMs(loan.dueDate)) / MS_PER_DAY)
}

// คืนรายการข้อความผิดพลาดภาษาไทย ว่าง = ถูกต้อง
export function validateLoan(loan) {
  const errors = []
  if (!loan.friendName?.trim()) errors.push('กรุณากรอกชื่อเพื่อน')
  if (!loan.itemName?.trim()) errors.push('กรุณากรอกชื่อของ')
  if (!loan.borrowedDate) errors.push('กรุณาระบุวันที่ยืม')
  if (!loan.dueDate) errors.push('กรุณาระบุกำหนดคืน')
  if (loan.borrowedDate && loan.dueDate && loan.dueDate < loan.borrowedDate) {
    errors.push('กำหนดคืนต้องไม่ก่อนวันที่ยืม')
  }
  if (loan.borrowedDate && loan.returnedDate && loan.returnedDate < loan.borrowedDate) {
    errors.push('วันที่คืนจริงต้องไม่ก่อนวันที่ยืม')
  }
  return errors
}

// จัดกลุ่มตามสถานะ แต่ละกลุ่มเรียงกำหนดคืนใกล้สุดก่อน (ไม่แก้อาร์เรย์เดิม)
export function groupLoans(loans, today) {
  const groups = { overdue: [], outstanding: [], returned: [] }
  for (const loan of loans) groups[getLoanStatus(loan, today)].push(loan)
  for (const list of Object.values(groups)) {
    list.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
  }
  return groups
}

// กรองตามชื่อเพื่อน (ตรงบางส่วน ไม่สนตัวพิมพ์เล็กใหญ่) คำค้นว่างคืนทุกรายการ
export function filterLoansByFriend(loans, query) {
  const q = query.trim().toLowerCase()
  if (!q) return loans
  return loans.filter((loan) => loan.friendName.toLowerCase().includes(q))
}

// กดคืนแล้ว: วันที่คืนจริงค่าเริ่มต้นคือวันนี้ ระบุย้อนหลังได้ คืน Loan ใหม่ ไม่แก้ตัวเดิม
export function markReturned(loan, today, returnedDate = today) {
  return { ...loan, returnedDate }
}

// ยกเลิกการคืน: ตั้งวันที่คืนจริงกลับเป็น null
export function unmarkReturned(loan) {
  return { ...loan, returnedDate: null }
}
