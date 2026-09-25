import { STATUS } from './loanRules.js'

// แท็บรายการใช้คีย์เดียวกับสถานะ (ตามลำดับที่แสดง: เกินกำหนด → ยังไม่คืน → คืนแล้ว) และมีแท็บเพิ่มการยืมต่อท้าย
export const LIST_TABS = [STATUS.OVERDUE, STATUS.OUTSTANDING, STATUS.RETURNED]
export const ADD_TAB = 'add'

// groups คือผลจาก groupLoans: แท็บเริ่มต้นคือแท็บแรกที่มี Loan ถ้าไม่มีเลยเป็น ยังไม่คืน
export function pickDefaultTab(groups) {
  return LIST_TABS.find((status) => groups[status]?.length > 0) ?? STATUS.OUTSTANDING
}

export const EMPTY_MESSAGE = {
  [STATUS.OVERDUE]: 'ไม่มีรายการที่เกินกำหนด',
  [STATUS.OUTSTANDING]: 'ไม่มีรายการที่ยังไม่คืน',
  [STATUS.RETURNED]: 'ยังไม่มีรายการที่คืนแล้ว',
}

export const NO_SEARCH_MATCH_MESSAGE = 'ไม่พบรายการที่ตรงกับชื่อเพื่อนที่ค้นหา'

// ข้อความเมื่อแท็บว่าง: ถ้ากำลังค้นหาอยู่ให้บอกว่าไม่พบตามคำค้น
export function getEmptyMessage(status, hasQuery) {
  return hasQuery ? NO_SEARCH_MATCH_MESSAGE : EMPTY_MESSAGE[status]
}
