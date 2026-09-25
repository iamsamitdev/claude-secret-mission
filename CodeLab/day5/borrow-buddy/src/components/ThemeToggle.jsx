import { THEME } from '../lib/theme.js'

// ปุ่มสลับโหมดมืด/สว่าง ข้อความบอกสิ่งที่จะเกิดเมื่อกด
export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button type="button" onClick={onToggle}>
      {theme === THEME.DARK ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
    </button>
  )
}
