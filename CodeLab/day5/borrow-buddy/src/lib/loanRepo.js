import { getSupabase } from './supabaseClient.js'

// แปลงระหว่างแถวในตาราง loans (snake_case) กับ Loan ในแอป (camelCase)
export function rowToLoan(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    friendName: row.friend_name,
    itemName: row.item_name,
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date,
    returnedDate: row.returned_date ?? null,
  }
}

// ไม่ส่ง id และ owner_id: id สร้างที่ฐานข้อมูล, owner_id ตั้งเป็น auth.uid() อัตโนมัติและห้ามแก้
export function loanToRow(loan) {
  return {
    friend_name: loan.friendName,
    item_name: loan.itemName,
    borrowed_date: loan.borrowedDate,
    due_date: loan.dueDate,
    returned_date: loan.returnedDate ?? null,
  }
}

export const LOAD_ERROR_MESSAGE = 'โหลดรายการยืมไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'
export const SAVE_ERROR_MESSAGE = 'บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่ ข้อมูลที่กรอกยังอยู่'
export const SESSION_EXPIRED_MESSAGE = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'

// session หมดอายุ/ไม่มีสิทธิ์ (JWT หมดอายุ, 401/403, RLS ปฏิเสธ)
function isAuthError(error) {
  return (
    error.status === 401 ||
    error.status === 403 ||
    error.code === 'PGRST301' ||
    error.code === '42501'
  )
}

function toResult(error, fallbackMessage) {
  const sessionExpired = isAuthError(error)
  return { error: sessionExpired ? SESSION_EXPIRED_MESSAGE : fallbackMessage, sessionExpired }
}

// client รับเป็นพารามิเตอร์ เพื่อให้ทดสอบด้วย client จำลองได้
// ทุกฟังก์ชันคืน { ..., error, sessionExpired } โดย error เป็นข้อความภาษาไทยหรือ null
// ไม่มีฟังก์ชันลบ Loan โดยตั้งใจ (RLS ก็ไม่เปิดสิทธิ์ลบ)
export async function fetchLoans(client = getSupabase()) {
  try {
    const { data, error } = await client.from('loans').select('*')
    if (error) return { loans: [], ...toResult(error, LOAD_ERROR_MESSAGE) }
    return { loans: data.map(rowToLoan), error: null, sessionExpired: false }
  } catch {
    return { loans: [], error: LOAD_ERROR_MESSAGE, sessionExpired: false }
  }
}

export async function createLoan(loan, client = getSupabase()) {
  try {
    const { data, error } = await client.from('loans').insert(loanToRow(loan)).select().single()
    if (error) return { loan: null, ...toResult(error, SAVE_ERROR_MESSAGE) }
    return { loan: rowToLoan(data), error: null, sessionExpired: false }
  } catch {
    return { loan: null, error: SAVE_ERROR_MESSAGE, sessionExpired: false }
  }
}

// ใช้แก้ไขทุกอย่างรวมถึงกดคืนแล้ว/ยกเลิกการคืน (ส่ง Loan ทั้งก้อนที่ปรับแล้ว)
export async function updateLoan(loan, client = getSupabase()) {
  try {
    const { data, error } = await client
      .from('loans')
      .update(loanToRow(loan))
      .eq('id', loan.id)
      .select()
      .single()
    if (error) return { loan: null, ...toResult(error, SAVE_ERROR_MESSAGE) }
    return { loan: rowToLoan(data), error: null, sessionExpired: false }
  } catch {
    return { loan: null, error: SAVE_ERROR_MESSAGE, sessionExpired: false }
  }
}

// เพิ่มหลาย Loan ในคำสั่งเดียว (ใช้ตอนย้ายข้อมูลเดิม) สำเร็จทั้งหมดหรือไม่สำเร็จเลย
export async function createLoans(loans, client = getSupabase()) {
  if (loans.length === 0) return { loans: [], error: null, sessionExpired: false }
  try {
    const { data, error } = await client.from('loans').insert(loans.map(loanToRow)).select()
    if (error) return { loans: [], ...toResult(error, SAVE_ERROR_MESSAGE) }
    return { loans: data.map(rowToLoan), error: null, sessionExpired: false }
  } catch {
    return { loans: [], error: SAVE_ERROR_MESSAGE, sessionExpired: false }
  }
}
