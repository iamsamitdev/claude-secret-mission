import { describe, expect, it } from 'vitest'
import { LOAD_WARNING, SAVE_WARNING, STORAGE_KEY, loadLoans, saveLoans } from './storage.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const brokenStorage = () => ({
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
})

const loan = {
  id: '1',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

describe('loadLoans', () => {
  it('ยังไม่มีข้อมูล = รายการว่าง ไม่มีคำเตือน', () => {
    expect(loadLoans(memoryStorage())).toEqual({ loans: [], warning: null })
  })

  it('อ่าน Loan ที่บันทึกไว้ได้ครบ', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([loan]) })
    expect(loadLoans(storage)).toEqual({ loans: [loan], warning: null })
  })

  it('JSON เสีย = รายการว่างพร้อมคำเตือนภาษาไทย', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{เสีย' })
    expect(loadLoans(storage)).toEqual({ loans: [], warning: LOAD_WARNING })
  })

  it('JSON ถูกต้องแต่ไม่ใช่อาร์เรย์ = รายการว่างพร้อมคำเตือน', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"a":1}' })
    expect(loadLoans(storage)).toEqual({ loans: [], warning: LOAD_WARNING })
  })

  it('อ่าน storage ไม่ได้ = รายการว่างพร้อมคำเตือน', () => {
    expect(loadLoans(brokenStorage())).toEqual({ loans: [], warning: LOAD_WARNING })
  })

  it('ข้อมูลเสียต้องไม่ถูกเขียนทับตอนอ่าน', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{เสีย' })
    loadLoans(storage)
    expect(storage.data[STORAGE_KEY]).toBe('{เสีย')
  })
})

describe('saveLoans', () => {
  it('บันทึกเป็น JSON ใต้คีย์เดียว และอ่านกลับได้เหมือนเดิม', () => {
    const storage = memoryStorage()
    expect(saveLoans([loan], storage)).toBeNull()
    expect(Object.keys(storage.data)).toEqual([STORAGE_KEY])
    expect(loadLoans(storage).loans).toEqual([loan])
  })

  it('บันทึกรายการว่างได้', () => {
    const storage = memoryStorage()
    expect(saveLoans([], storage)).toBeNull()
    expect(loadLoans(storage)).toEqual({ loans: [], warning: null })
  })

  it('บันทึกไม่ได้ = คืนคำเตือนภาษาไทย ไม่โยนข้อผิดพลาด', () => {
    expect(saveLoans([loan], brokenStorage())).toBe(SAVE_WARNING)
  })
})
