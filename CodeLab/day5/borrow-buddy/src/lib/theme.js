export const THEME_KEY = 'borrow-buddy:theme'

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
}

const isTheme = (value) => value === THEME.LIGHT || value === THEME.DARK

// ค่าที่จำไว้มาก่อน ถ้าไม่มี/อ่านไม่ได้ ใช้ตามค่าของระบบ (prefersDark)
export function getInitialTheme(storage = globalThis.localStorage, prefersDark = false) {
  try {
    const saved = storage.getItem(THEME_KEY)
    if (isTheme(saved)) return saved
  } catch {
    // อ่านไม่ได้ ใช้ค่าตามระบบ
  }
  return prefersDark ? THEME.DARK : THEME.LIGHT
}

// บันทึกไม่ได้ก็ไม่เป็นไร แค่ไม่จำค่า ไม่ให้แอปล้ม
export function saveTheme(theme, storage = globalThis.localStorage) {
  try {
    storage.setItem(THEME_KEY, theme)
  } catch {
    // ไม่จำค่า
  }
}

export function toggleTheme(theme) {
  return theme === THEME.DARK ? THEME.LIGHT : THEME.DARK
}
