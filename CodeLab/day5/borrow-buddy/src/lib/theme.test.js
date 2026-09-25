import { describe, expect, it } from 'vitest'
import { THEME, THEME_KEY, getInitialTheme, saveTheme, toggleTheme } from './theme.js'

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

describe('getInitialTheme', () => {
  it('ยังไม่เคยเลือก ใช้ตามระบบ: สว่าง', () => {
    expect(getInitialTheme(memoryStorage(), false)).toBe(THEME.LIGHT)
  })

  it('ยังไม่เคยเลือก ใช้ตามระบบ: มืด', () => {
    expect(getInitialTheme(memoryStorage(), true)).toBe(THEME.DARK)
  })

  it('ค่าที่จำไว้ชนะค่าของระบบ', () => {
    expect(getInitialTheme(memoryStorage({ [THEME_KEY]: 'light' }), true)).toBe(THEME.LIGHT)
    expect(getInitialTheme(memoryStorage({ [THEME_KEY]: 'dark' }), false)).toBe(THEME.DARK)
  })

  it('ค่าที่จำไว้ไม่ถูกต้อง ใช้ตามระบบ', () => {
    expect(getInitialTheme(memoryStorage({ [THEME_KEY]: 'blue' }), true)).toBe(THEME.DARK)
  })

  it('อ่าน storage ไม่ได้ ใช้ตามระบบ ไม่โยนข้อผิดพลาด', () => {
    expect(getInitialTheme(brokenStorage(), true)).toBe(THEME.DARK)
    expect(getInitialTheme(brokenStorage(), false)).toBe(THEME.LIGHT)
  })
})

describe('saveTheme', () => {
  it('บันทึกแล้วอ่านกลับได้', () => {
    const storage = memoryStorage()
    saveTheme(THEME.DARK, storage)
    expect(getInitialTheme(storage, false)).toBe(THEME.DARK)
  })

  it('บันทึกไม่ได้ ไม่โยนข้อผิดพลาด', () => {
    expect(() => saveTheme(THEME.DARK, brokenStorage())).not.toThrow()
  })
})

describe('toggleTheme', () => {
  it('สลับสว่างกับมืด', () => {
    expect(toggleTheme(THEME.LIGHT)).toBe(THEME.DARK)
    expect(toggleTheme(THEME.DARK)).toBe(THEME.LIGHT)
  })
})
