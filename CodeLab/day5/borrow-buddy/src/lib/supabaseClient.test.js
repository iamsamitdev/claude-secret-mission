import { describe, expect, it } from 'vitest'
import { ENV_MISSING_MESSAGE, createSupabaseClient } from './supabaseClient.js'

describe('createSupabaseClient', () => {
  it('แจ้งข้อผิดพลาดชัดเจนเมื่อขาด URL', () => {
    expect(() => createSupabaseClient({ VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toThrow(
      ENV_MISSING_MESSAGE,
    )
  })

  it('แจ้งข้อผิดพลาดชัดเจนเมื่อขาด key', () => {
    expect(() => createSupabaseClient({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toThrow(
      ENV_MISSING_MESSAGE,
    )
  })

  it('สร้าง client ได้เมื่อมีค่าครบ', () => {
    const client = createSupabaseClient({
      VITE_SUPABASE_URL: 'https://x.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    })
    expect(typeof client.from).toBe('function')
    expect(typeof client.auth.signInWithPassword).toBe('function')
  })
})
