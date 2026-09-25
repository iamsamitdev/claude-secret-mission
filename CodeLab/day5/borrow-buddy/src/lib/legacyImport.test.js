import { describe, expect, it } from 'vitest'
import {
  IMPORTED_FLAG_KEY,
  LEGACY_READ_WARNING,
  isLegacyImported,
  markLegacyImported,
  readLegacyLoans,
} from './legacyImport.js'
import { STORAGE_KEY } from './storage.js'

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
  }
}

const good = {
  id: 'old-1',
  friendName: ' มด ',
  itemName: 'หนังสือ',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-10',
  returnedDate: null,
}
const withData = (value) => fakeStorage({ [STORAGE_KEY]: JSON.stringify(value) })

describe('readLegacyLoans', () => {
  it('ไม่มีข้อมูลเดิม: รายการว่าง ไม่มีคำเตือน', () => {
    expect(readLegacyLoans(fakeStorage())).toEqual({ loans: [], skipped: [], warning: null })
  })

  it('แปลง Loan ที่ถูกต้อง: ตัดช่องว่าง ตัด id เดิมทิ้ง', () => {
    const { loans, skipped, warning } = readLegacyLoans(withData([good]))
    expect(loans).toEqual([
      {
        friendName: 'มด',
        itemName: 'หนังสือ',
        borrowedDate: '2026-09-01',
        dueDate: '2026-09-10',
        returnedDate: null,
      },
    ])
    expect(skipped).toEqual([])
    expect(warning).toBeNull()
  })

  it('คงวันที่คืนจริงของรายการที่คืนแล้ว', () => {
    const { loans } = readLegacyLoans(withData([{ ...good, returnedDate: '2026-09-05' }]))
    expect(loans[0].returnedDate).toBe('2026-09-05')
  })

  it('JSON เสีย: คำเตือนภาษาไทย ไม่พัง ไม่แตะข้อมูลเดิม', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{not json' })
    const result = readLegacyLoans(storage)
    expect(result).toEqual({ loans: [], skipped: [], warning: LEGACY_READ_WARNING })
    expect(storage.data[STORAGE_KEY]).toBe('{not json')
  })

  it('ข้อมูลไม่ใช่อาร์เรย์: คำเตือน', () => {
    expect(readLegacyLoans(withData({ a: 1 })).warning).toBe(LEGACY_READ_WARNING)
  })

  it('อ่าน storage ไม่ได้ (exception): คำเตือน', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readLegacyLoans(storage).warning).toBe(LEGACY_READ_WARNING)
  })

  it('ข้ามรายการที่ไม่ผ่านการตรวจ พร้อมเหตุผลไทย และนำเข้ารายการที่เหลือ', () => {
    const { loans, skipped } = readLegacyLoans(
      withData([
        good,
        { ...good, friendName: '  ' },
        { ...good, dueDate: '2026-08-01' },
        { ...good, borrowedDate: '01/09/2026' },
        { ...good, dueDate: '2026-02-31' },
        { ...good, itemName: 42 },
        null,
        'x',
      ]),
    )
    expect(loans).toHaveLength(1)
    expect(skipped.map((s) => s.index)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(skipped[0].errors).toContain('กรุณากรอกชื่อเพื่อน')
    expect(skipped[1].errors).toContain('กำหนดคืนต้องไม่ก่อนวันที่ยืม')
    expect(skipped[2].errors).toEqual(['รูปแบบวันที่ไม่ถูกต้อง'])
    expect(skipped[3].errors).toEqual(['รูปแบบวันที่ไม่ถูกต้อง'])
    expect(skipped[5].label).toBe('รายการที่ 7')
    expect(skipped[6].label).toBe('รายการที่ 8')
  })

  it('ข้ามรายการที่วันที่คืนจริงก่อนวันที่ยืม', () => {
    const { loans, skipped } = readLegacyLoans(withData([{ ...good, returnedDate: '2026-08-31' }]))
    expect(loans).toEqual([])
    expect(skipped[0].errors).toContain('วันที่คืนจริงต้องไม่ก่อนวันที่ยืม')
  })

  it('ไม่แก้หรือลบข้อมูลเดิมใน storage', () => {
    const storage = withData([good])
    const before = storage.data[STORAGE_KEY]
    readLegacyLoans(storage)
    expect(storage.data[STORAGE_KEY]).toBe(before)
  })
})

describe('ธงย้ายข้อมูลแล้ว', () => {
  it('เริ่มต้นยังไม่ย้าย และทำเครื่องหมายได้โดยไม่แตะข้อมูล Loan เดิม', () => {
    const storage = withData([good])
    const before = storage.data[STORAGE_KEY]
    expect(isLegacyImported(storage)).toBe(false)
    expect(markLegacyImported(storage)).toBe(true)
    expect(isLegacyImported(storage)).toBe(true)
    expect(storage.data[IMPORTED_FLAG_KEY]).toBe('1')
    expect(storage.data[STORAGE_KEY]).toBe(before)
  })

  it('เขียน storage ไม่ได้: คืน false ไม่พัง', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(markLegacyImported(storage)).toBe(false)
  })
})
