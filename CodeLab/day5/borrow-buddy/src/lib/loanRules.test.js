import { describe, expect, it } from 'vitest'
import {
  STATUS,
  getDaysOverdue,
  getLoanStatus,
  markReturned,
  filterLoansByFriend,
  groupLoans,
  unmarkReturned,
  validateLoan,
} from './loanRules.js'

const loan = (overrides = {}) => ({
  id: '1',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
  ...overrides,
})

describe('getLoanStatus', () => {
  it('ยังไม่ถึงกำหนดคืน = ยังไม่คืน', () => {
    expect(getLoanStatus(loan(), '2026-09-10')).toBe(STATUS.OUTSTANDING)
  })

  it('ถึงกำหนดคืนวันนี้พอดี ยังไม่นับว่าเกินกำหนด', () => {
    expect(getLoanStatus(loan(), '2026-09-24')).toBe(STATUS.OUTSTANDING)
  })

  it('เลยกำหนดคืนไปหนึ่งวัน = เกินกำหนด', () => {
    expect(getLoanStatus(loan(), '2026-09-25')).toBe(STATUS.OVERDUE)
  })

  it('มีวันที่คืนจริงแล้ว = คืนแล้ว แม้เลยกำหนดไปแล้ว', () => {
    const returned = loan({ returnedDate: '2026-09-30' })
    expect(getLoanStatus(returned, '2026-10-15')).toBe(STATUS.RETURNED)
  })

  it('ข้ามเดือนและข้ามปีเทียบวันที่ได้ถูกต้อง', () => {
    const l = loan({ borrowedDate: '2026-12-20', dueDate: '2026-12-31' })
    expect(getLoanStatus(l, '2026-12-31')).toBe(STATUS.OUTSTANDING)
    expect(getLoanStatus(l, '2027-01-01')).toBe(STATUS.OVERDUE)
  })
})

describe('getDaysOverdue', () => {
  it('เลยกำหนดคืนหนึ่งวัน = 1', () => {
    expect(getDaysOverdue(loan(), '2026-09-25')).toBe(1)
  })

  it('เลยกำหนดคืนหลายวัน นับตามจำนวนวันจริง', () => {
    expect(getDaysOverdue(loan(), '2026-10-04')).toBe(10)
  })

  it('ถึงกำหนดคืนวันนี้พอดี = 0', () => {
    expect(getDaysOverdue(loan(), '2026-09-24')).toBe(0)
  })

  it('ยังไม่ถึงกำหนดคืน = 0', () => {
    expect(getDaysOverdue(loan(), '2026-09-10')).toBe(0)
  })

  it('คืนแล้ว = 0 แม้เลยกำหนดไปแล้ว', () => {
    const returned = loan({ returnedDate: '2026-09-30' })
    expect(getDaysOverdue(returned, '2026-10-15')).toBe(0)
  })

  it('ข้ามเดือน ข้ามปี และปีอธิกสุรทินนับถูกต้อง', () => {
    const l = loan({ dueDate: '2027-12-30' })
    expect(getDaysOverdue(l, '2028-01-02')).toBe(3)
    const leap = loan({ dueDate: '2028-02-28' })
    expect(getDaysOverdue(leap, '2028-03-01')).toBe(2)
  })
})

describe('validateLoan', () => {
  it('Loan ที่ถูกต้อง = ไม่มีข้อผิดพลาด', () => {
    expect(validateLoan(loan())).toEqual([])
  })

  it('กำหนดคืนตรงกับวันที่ยืมได้', () => {
    expect(validateLoan(loan({ dueDate: '2026-09-01' }))).toEqual([])
  })

  it('คืนจริงตรงกับวันที่ยืมได้', () => {
    expect(validateLoan(loan({ returnedDate: '2026-09-01' }))).toEqual([])
  })

  it('ชื่อเพื่อนว่าง = ผิด', () => {
    expect(validateLoan(loan({ friendName: '' }))).toEqual(['กรุณากรอกชื่อเพื่อน'])
  })

  it('ชื่อเพื่อนเป็นช่องว่างล้วน = ผิด', () => {
    expect(validateLoan(loan({ friendName: '   ' }))).toEqual(['กรุณากรอกชื่อเพื่อน'])
  })

  it('ชื่อของว่าง = ผิด', () => {
    expect(validateLoan(loan({ itemName: '' }))).toEqual(['กรุณากรอกชื่อของ'])
  })

  it('ชื่อของเป็นช่องว่างล้วน = ผิด', () => {
    expect(validateLoan(loan({ itemName: '  ' }))).toEqual(['กรุณากรอกชื่อของ'])
  })

  it('ไม่ระบุวันที่ยืม = ผิด', () => {
    expect(validateLoan(loan({ borrowedDate: '' }))).toEqual(['กรุณาระบุวันที่ยืม'])
  })

  it('ไม่ระบุกำหนดคืน = ผิด', () => {
    expect(validateLoan(loan({ dueDate: '' }))).toEqual(['กรุณาระบุกำหนดคืน'])
  })

  it('กำหนดคืนก่อนวันที่ยืม = ผิด', () => {
    expect(validateLoan(loan({ dueDate: '2026-08-31' }))).toEqual([
      'กำหนดคืนต้องไม่ก่อนวันที่ยืม',
    ])
  })

  it('วันที่คืนจริงก่อนวันที่ยืม = ผิด', () => {
    expect(validateLoan(loan({ returnedDate: '2026-08-31' }))).toEqual([
      'วันที่คืนจริงต้องไม่ก่อนวันที่ยืม',
    ])
  })

  it('ผิดหลายข้อพร้อมกัน คืนข้อความครบทุกข้อ', () => {
    const errors = validateLoan(
      loan({ friendName: '', itemName: '', dueDate: '2026-08-01', returnedDate: '2026-08-02' }),
    )
    expect(errors).toEqual([
      'กรุณากรอกชื่อเพื่อน',
      'กรุณากรอกชื่อของ',
      'กำหนดคืนต้องไม่ก่อนวันที่ยืม',
      'วันที่คืนจริงต้องไม่ก่อนวันที่ยืม',
    ])
  })
})

describe('groupLoans', () => {
  const today = '2026-09-24'
  const ids = (loans) => loans.map((l) => l.id)

  it('รายการว่าง = ทุกกลุ่มว่าง', () => {
    expect(groupLoans([], today)).toEqual({ overdue: [], outstanding: [], returned: [] })
  })

  it('แยกเป็นเกินกำหนด / ยังไม่คืน / คืนแล้ว', () => {
    const loans = [
      loan({ id: 'a', dueDate: '2026-09-30' }),
      loan({ id: 'b', dueDate: '2026-09-20' }),
      loan({ id: 'c', dueDate: '2026-09-10', returnedDate: '2026-09-12' }),
      loan({ id: 'd', dueDate: '2026-09-24' }),
    ]
    const g = groupLoans(loans, today)
    expect(ids(g.overdue)).toEqual(['b'])
    expect(ids(g.outstanding)).toEqual(['d', 'a'])
    expect(ids(g.returned)).toEqual(['c'])
  })

  it('เรียงตามกำหนดคืนใกล้สุดก่อนในแต่ละกลุ่ม', () => {
    const loans = [
      loan({ id: 'o3', dueDate: '2026-10-30' }),
      loan({ id: 'o1', dueDate: '2026-09-25' }),
      loan({ id: 'o2', dueDate: '2026-10-05' }),
      loan({ id: 'v2', dueDate: '2026-09-20' }),
      loan({ id: 'v1', dueDate: '2026-09-01' }),
      loan({ id: 'r2', dueDate: '2026-09-15', returnedDate: '2026-09-15' }),
      loan({ id: 'r1', dueDate: '2026-09-05', returnedDate: '2026-09-06' }),
    ]
    const g = groupLoans(loans, today)
    expect(ids(g.overdue)).toEqual(['v1', 'v2'])
    expect(ids(g.outstanding)).toEqual(['o1', 'o2', 'o3'])
    expect(ids(g.returned)).toEqual(['r1', 'r2'])
  })

  it('กำหนดคืนเท่ากัน คงลำดับเดิม', () => {
    const loans = [
      loan({ id: 'x', dueDate: '2026-09-30' }),
      loan({ id: 'y', dueDate: '2026-09-30' }),
    ]
    expect(ids(groupLoans(loans, today).outstanding)).toEqual(['x', 'y'])
  })

  it('ไม่แก้ไขอาร์เรย์เดิม', () => {
    const loans = [
      loan({ id: 'a', dueDate: '2026-10-30' }),
      loan({ id: 'b', dueDate: '2026-09-25' }),
    ]
    groupLoans(loans, today)
    expect(ids(loans)).toEqual(['a', 'b'])
  })
})

describe('filterLoansByFriend', () => {
  const loans = [
    loan({ id: '1', friendName: 'ต้น' }),
    loan({ id: '2', friendName: 'ต้นกล้า' }),
    loan({ id: '3', friendName: 'Ploy' }),
    loan({ id: '4', friendName: 'มะลิ' }),
  ]
  const ids = (list) => list.map((l) => l.id)

  it('คำค้นว่าง = คืนทุกรายการ', () => {
    expect(ids(filterLoansByFriend(loans, ''))).toEqual(['1', '2', '3', '4'])
  })

  it('คำค้นเป็นช่องว่างล้วน = คืนทุกรายการ', () => {
    expect(ids(filterLoansByFriend(loans, '   '))).toEqual(['1', '2', '3', '4'])
  })

  it('ตรงบางส่วนของชื่อเพื่อน', () => {
    expect(ids(filterLoansByFriend(loans, 'ต้น'))).toEqual(['1', '2'])
    expect(ids(filterLoansByFriend(loans, 'กล้า'))).toEqual(['2'])
  })

  it('ไม่สนตัวพิมพ์เล็กใหญ่', () => {
    expect(ids(filterLoansByFriend(loans, 'pLOy'))).toEqual(['3'])
  })

  it('ตัดช่องว่างหน้าหลังคำค้น', () => {
    expect(ids(filterLoansByFriend(loans, '  มะลิ '))).toEqual(['4'])
  })

  it('ไม่พบ = รายการว่าง', () => {
    expect(filterLoansByFriend(loans, 'สมชาย')).toEqual([])
  })

  it('ค้นตามชื่อเพื่อนเท่านั้น ไม่ค้นชื่อของ', () => {
    expect(filterLoansByFriend(loans, 'ร่ม')).toEqual([])
  })

  it('ไม่แก้ไขอาร์เรย์เดิม', () => {
    filterLoansByFriend(loans, 'ต้น')
    expect(loans).toHaveLength(4)
  })
})

describe('markReturned', () => {
  it('ไม่ระบุวันที่ = ใช้วันนี้เป็นวันที่คืนจริง', () => {
    expect(markReturned(loan(), '2026-09-20').returnedDate).toBe('2026-09-20')
  })

  it('ระบุวันที่ย้อนหลังได้', () => {
    expect(markReturned(loan(), '2026-09-20', '2026-09-15').returnedDate).toBe('2026-09-15')
  })

  it('หลังกดคืน สถานะเป็นคืนแล้ว แม้เกินกำหนด', () => {
    const l = loan({ dueDate: '2026-09-10' })
    expect(getLoanStatus(l, '2026-09-20')).toBe(STATUS.OVERDUE)
    expect(getLoanStatus(markReturned(l, '2026-09-20'), '2026-09-20')).toBe(STATUS.RETURNED)
  })

  it('ฟิลด์อื่นไม่เปลี่ยน และไม่แก้ Loan เดิม', () => {
    const original = loan()
    const result = markReturned(original, '2026-09-20')
    expect(result).toEqual({ ...original, returnedDate: '2026-09-20' })
    expect(original.returnedDate).toBeNull()
  })
})

describe('unmarkReturned', () => {
  it('ตั้งวันที่คืนจริงกลับเป็น null', () => {
    const returned = loan({ returnedDate: '2026-09-15' })
    expect(unmarkReturned(returned).returnedDate).toBeNull()
  })

  it('หลังยกเลิก สถานะกลับไปตามกำหนดคืน', () => {
    const returned = loan({ dueDate: '2026-09-10', returnedDate: '2026-09-09' })
    expect(getLoanStatus(unmarkReturned(returned), '2026-09-20')).toBe(STATUS.OVERDUE)
    expect(getLoanStatus(unmarkReturned(returned), '2026-09-10')).toBe(STATUS.OUTSTANDING)
  })

  it('ฟิลด์อื่นไม่เปลี่ยน และไม่แก้ Loan เดิม', () => {
    const original = loan({ returnedDate: '2026-09-15' })
    const result = unmarkReturned(original)
    expect(result).toEqual({ ...original, returnedDate: null })
    expect(original.returnedDate).toBe('2026-09-15')
  })
})
