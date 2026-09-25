import { getSupabase } from './supabaseClient.js'

export const INVALID_LOGIN_MESSAGE = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
export const LOGIN_FAILED_MESSAGE = 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'
export const SIGN_OUT_FAILED_MESSAGE = 'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'

// ไม่บอกว่า email หรือ password ผิดข้อใด (ตาม design.md ข้อ 6)
function toLoginMessage(error) {
  if (error.code === 'invalid_credentials' || error.status === 400) return INVALID_LOGIN_MESSAGE
  return LOGIN_FAILED_MESSAGE
}

// client รับเป็นพารามิเตอร์ เพื่อให้ทดสอบด้วย client จำลองได้
// คืน { error } โดย error เป็นข้อความภาษาไทย หรือ null เมื่อสำเร็จ
export async function signIn(email, password, client = getSupabase()) {
  try {
    const { error } = await client.auth.signInWithPassword({ email, password })
    return { error: error ? toLoginMessage(error) : null }
  } catch {
    return { error: LOGIN_FAILED_MESSAGE }
  }
}

export async function signOut(client = getSupabase()) {
  try {
    const { error } = await client.auth.signOut()
    return { error: error ? SIGN_OUT_FAILED_MESSAGE : null }
  } catch {
    return { error: SIGN_OUT_FAILED_MESSAGE }
  }
}

// คืน session ปัจจุบัน หรือ null ถ้ายังไม่ได้เข้าสู่ระบบ/อ่านไม่ได้
export async function getSession(client = getSupabase()) {
  try {
    const { data, error } = await client.auth.getSession()
    return error ? null : (data.session ?? null)
  } catch {
    return null
  }
}

// เรียก callback(session) ทุกครั้งที่สถานะเปลี่ยน (รวมค่าเริ่มต้นตอนเปิดหน้า, ออกจากระบบ, session หมดอายุ)
// คืนฟังก์ชันสำหรับเลิกติดตาม ไม่มีฟังก์ชันสมัครสมาชิกในไฟล์นี้โดยตั้งใจ
export function onSessionChange(callback, client = getSupabase()) {
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session ?? null))
  return () => data.subscription.unsubscribe()
}
