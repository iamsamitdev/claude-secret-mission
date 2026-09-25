import { describe, expect, it } from 'vitest'
import { formatThaiDate, toIsoDate } from './dateFormat.js'

describe('formatThaiDate', () => {
  it('แปลง ISO ค.ศ. เป็น พ.ศ. แบบย่อ', () => {
    expect(formatThaiDate('2026-09-24')).toBe('24 ก.ย. 2569')
  })

  it('ไม่เติมศูนย์หน้าวันที่', () => {
    expect(formatThaiDate('2026-01-05')).toBe('5 ม.ค. 2569')
  })

  it('ครอบคลุมทั้ง 12 เดือน', () => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    months.forEach((name, i) => {
      const mm = String(i + 1).padStart(2, '0')
      expect(formatThaiDate(`2026-${mm}-01`)).toBe(`1 ${name} 2569`)
    })
  })

  it('คืนสตริงว่างเมื่อไม่มีค่า', () => {
    expect(formatThaiDate(null)).toBe('')
    expect(formatThaiDate('')).toBe('')
  })

  it('คืนสตริงว่างเมื่อรูปแบบไม่ถูกต้อง', () => {
    expect(formatThaiDate('24/09/2026')).toBe('')
    expect(formatThaiDate('2026-13-01')).toBe('')
  })
})

describe('toIsoDate', () => {
  it('แปลง Date เป็น YYYY-MM-DD และเติมศูนย์หน้าเดือน/วัน', () => {
    expect(toIsoDate(new Date(2026, 8, 5))).toBe('2026-09-05')
    expect(toIsoDate(new Date(2026, 11, 25))).toBe('2026-12-25')
  })

  it('ใช้วันที่ท้องถิ่น ไม่เลื่อนวันตามเขตเวลา UTC', () => {
    expect(toIsoDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
    expect(toIsoDate(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01')
  })

  it('ผลลัพธ์ส่งเข้า formatThaiDate ได้', () => {
    expect(formatThaiDate(toIsoDate(new Date(2026, 8, 24)))).toBe('24 ก.ย. 2569')
  })
})
