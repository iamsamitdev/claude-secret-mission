import { describe, expect, it, vi } from 'vitest'
import * as auth from './auth.js'
import {
  INVALID_LOGIN_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  SIGN_OUT_FAILED_MESSAGE,
  getSession,
  onSessionChange,
  signIn,
  signOut,
} from './auth.js'

const clientWith = (authApi) => ({ auth: authApi })

describe('signIn', () => {
  it('ส่ง email/password ให้ signInWithPassword และคืน error เป็น null เมื่อสำเร็จ', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null })
    const result = await signIn('a@b.co', 'pw', clientWith({ signInWithPassword }))
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' })
    expect(result).toEqual({ error: null })
  })

  it('รหัสผ่านผิด: ข้อความกลางๆ ไม่บอกว่าผิดข้อใด', async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400 } })
    const result = await signIn('a@b.co', 'x', clientWith({ signInWithPassword }))
    expect(result.error).toBe(INVALID_LOGIN_MESSAGE)
  })

  it('ข้อผิดพลาดอื่น (เช่น เครือข่าย) ได้ข้อความเข้าสู่ระบบไม่สำเร็จ', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: { status: 0 } })
    const result = await signIn('a@b.co', 'x', clientWith({ signInWithPassword }))
    expect(result.error).toBe(LOGIN_FAILED_MESSAGE)
  })

  it('เมื่อเรียกแล้วเกิด exception ไม่พัง คืนข้อความภาษาไทย', async () => {
    const signInWithPassword = vi.fn().mockRejectedValue(new Error('network'))
    const result = await signIn('a@b.co', 'x', clientWith({ signInWithPassword }))
    expect(result.error).toBe(LOGIN_FAILED_MESSAGE)
  })
})

describe('signOut', () => {
  it('สำเร็จคืน error เป็น null', async () => {
    const result = await signOut(clientWith({ signOut: vi.fn().mockResolvedValue({ error: null }) }))
    expect(result).toEqual({ error: null })
  })

  it('ล้มเหลวคืนข้อความภาษาไทย', async () => {
    const result = await signOut(
      clientWith({ signOut: vi.fn().mockResolvedValue({ error: { message: 'x' } }) }),
    )
    expect(result.error).toBe(SIGN_OUT_FAILED_MESSAGE)
  })
})

describe('getSession', () => {
  it('คืน session เมื่อมี', async () => {
    const session = { access_token: 't' }
    const client = clientWith({
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    })
    expect(await getSession(client)).toBe(session)
  })

  it('คืน null เมื่อยังไม่เข้าสู่ระบบหรืออ่านไม่ได้', async () => {
    expect(
      await getSession(
        clientWith({ getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) }),
      ),
    ).toBeNull()
    expect(
      await getSession(clientWith({ getSession: vi.fn().mockRejectedValue(new Error('x')) })),
    ).toBeNull()
  })
})

describe('onSessionChange', () => {
  it('ส่ง session ให้ callback และเลิกติดตามได้', () => {
    const unsubscribe = vi.fn()
    let handler
    const client = clientWith({
      onAuthStateChange: vi.fn((h) => {
        handler = h
        return { data: { subscription: { unsubscribe } } }
      }),
    })
    const callback = vi.fn()
    const stop = onSessionChange(callback, client)

    handler('SIGNED_IN', { access_token: 't' })
    handler('SIGNED_OUT', null)
    expect(callback).toHaveBeenNthCalledWith(1, { access_token: 't' })
    expect(callback).toHaveBeenNthCalledWith(2, null)

    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('ไม่มีการสมัครสมาชิก', () => {
  it('ไม่มี export ที่เกี่ยวกับ signUp', () => {
    expect(Object.keys(auth).some((name) => /sign.?up|register/i.test(name))).toBe(false)
  })
})
