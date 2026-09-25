import { createClient } from '@supabase/supabase-js'

export const ENV_MISSING_MESSAGE =
  'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase (ขาด VITE_SUPABASE_URL หรือ VITE_SUPABASE_PUBLISHABLE_KEY ใน .env)'

// env รับเป็นพารามิเตอร์ เพื่อให้ทดสอบได้ ใช้เฉพาะ publishable key เท่านั้น ห้ามใช้ service role key
export function createSupabaseClient(env = import.meta.env) {
  const url = env?.VITE_SUPABASE_URL
  const key = env?.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error(ENV_MISSING_MESSAGE)
  return createClient(url, key)
}

let client = null

// สร้างครั้งเดียวเมื่อเรียกใช้ครั้งแรก
export function getSupabase() {
  client ??= createSupabaseClient()
  return client
}
