import { describe, expect, it } from 'vitest'
import { STATUS } from './loanRules.js'
import {
  ADD_TAB,
  EMPTY_MESSAGE,
  LIST_TABS,
  NO_SEARCH_MATCH_MESSAGE,
  getEmptyMessage,
  pickDefaultTab,
} from './loanTabs.js'

const groups = (overdue = 0, outstanding = 0, returned = 0) => ({
  [STATUS.OVERDUE]: Array(overdue).fill({}),
  [STATUS.OUTSTANDING]: Array(outstanding).fill({}),
  [STATUS.RETURNED]: Array(returned).fill({}),
})

describe('LIST_TABS', () => {
  it('เรียง เกินกำหนด → ยังไม่คืน → คืนแล้ว และไม่ซ้ำกับแท็บเพิ่ม', () => {
    expect(LIST_TABS).toEqual([STATUS.OVERDUE, STATUS.OUTSTANDING, STATUS.RETURNED])
    expect(LIST_TABS).not.toContain(ADD_TAB)
  })
})

describe('pickDefaultTab', () => {
  it('มีเกินกำหนด: เริ่มที่เกินกำหนด แม้แท็บอื่นก็มีรายการ', () => {
    expect(pickDefaultTab(groups(1, 3, 2))).toBe(STATUS.OVERDUE)
  })

  it('ไม่มีเกินกำหนด: เริ่มที่ยังไม่คืน', () => {
    expect(pickDefaultTab(groups(0, 2, 5))).toBe(STATUS.OUTSTANDING)
  })

  it('มีแต่คืนแล้ว: เริ่มที่คืนแล้ว', () => {
    expect(pickDefaultTab(groups(0, 0, 4))).toBe(STATUS.RETURNED)
  })

  it('ไม่มี Loan เลย: เริ่มที่ยังไม่คืน', () => {
    expect(pickDefaultTab(groups())).toBe(STATUS.OUTSTANDING)
  })
})

describe('getEmptyMessage', () => {
  it('ไม่ค้นหา: ข้อความตามสถานะของแท็บ', () => {
    for (const status of LIST_TABS) {
      expect(getEmptyMessage(status, false)).toBe(EMPTY_MESSAGE[status])
    }
  })

  it('กำลังค้นหา: บอกว่าไม่พบตามคำค้น', () => {
    expect(getEmptyMessage(STATUS.OVERDUE, true)).toBe(NO_SEARCH_MATCH_MESSAGE)
  })
})
