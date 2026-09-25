import { describe, expect, it, vi } from 'vitest'
import * as repo from './loanRepo.js'
import { loanToRow, rowToLoan } from './loanRepo.js'

const row = {
  id: '11111111-1111-1111-1111-111111111111',
  owner_id: '22222222-2222-2222-2222-222222222222',
  friend_name: 'มด',
  item_name: 'หนังสือ',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-10',
  returned_date: null,
  created_at: '2026-09-01T00:00:00Z',
}

describe('rowToLoan', () => {
  it('แปลง snake_case เป็น camelCase', () => {
    expect(rowToLoan(row)).toEqual({
      id: row.id,
      ownerId: row.owner_id,
      friendName: 'มด',
      itemName: 'หนังสือ',
      borrowedDate: '2026-09-01',
      dueDate: '2026-09-10',
      returnedDate: null,
    })
  })

  it('คงวันที่คืนจริงไว้เมื่อมีค่า', () => {
    expect(rowToLoan({ ...row, returned_date: '2026-09-05' }).returnedDate).toBe('2026-09-05')
  })

  it('แปลงค่าที่ไม่มี returned_date เป็น null', () => {
    const { returned_date: _omit, ...rest } = row
    expect(rowToLoan(rest).returnedDate).toBeNull()
  })
})

describe('loanToRow', () => {
  const loan = rowToLoan(row)

  it('แปลง camelCase เป็น snake_case', () => {
    expect(loanToRow(loan)).toEqual({
      friend_name: 'มด',
      item_name: 'หนังสือ',
      borrowed_date: '2026-09-01',
      due_date: '2026-09-10',
      returned_date: null,
    })
  })

  it('ไม่ส่ง id และ owner_id ไปฐานข้อมูล', () => {
    const out = loanToRow(loan)
    expect(out).not.toHaveProperty('id')
    expect(out).not.toHaveProperty('owner_id')
  })

  it('ยกเลิกการคืนส่ง returned_date เป็น null', () => {
    expect(loanToRow({ ...loan, returnedDate: undefined }).returned_date).toBeNull()
  })
})

// ---- ส่วนที่เรียก Supabase (ใช้ client จำลอง) ----
// query builder จำลอง: ทุกเมธอดคืนตัวเอง และ await ได้ผลลัพธ์ที่กำหนด
function fakeClient(result) {
  const calls = []
  const builder = {
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const name of ['select', 'insert', 'update', 'eq', 'single']) {
    builder[name] = vi.fn((...args) => {
      calls.push([name, args])
      return builder
    })
  }
  return { client: { from: vi.fn(() => builder) }, builder, calls }
}

describe('fetchLoans', () => {
  it('คืนรายการที่แปลงเป็น camelCase แล้ว', async () => {
    const { client } = fakeClient({ data: [row], error: null })
    const result = await repo.fetchLoans(client)
    expect(client.from).toHaveBeenCalledWith('loans')
    expect(result.loans).toEqual([rowToLoan(row)])
    expect(result.error).toBeNull()
  })

  it('ผิดพลาดทั่วไป: ข้อความไทย รายการว่าง ไม่ใช่ session หมดอายุ', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'boom' } })
    const result = await repo.fetchLoans(client)
    expect(result).toEqual({ loans: [], error: repo.LOAD_ERROR_MESSAGE, sessionExpired: false })
  })

  it('JWT หมดอายุ: แจ้งเซสชันหมดอายุ', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'PGRST301' } })
    const result = await repo.fetchLoans(client)
    expect(result.error).toBe(repo.SESSION_EXPIRED_MESSAGE)
    expect(result.sessionExpired).toBe(true)
  })

  it('เกิด exception ไม่พัง', async () => {
    const client = {
      from: () => {
        throw new Error('network')
      },
    }
    const result = await repo.fetchLoans(client)
    expect(result.error).toBe(repo.LOAD_ERROR_MESSAGE)
  })
})

describe('createLoan', () => {
  const draft = { ...rowToLoan(row), id: undefined, ownerId: undefined }

  it('ส่งเฉพาะฟิลด์ที่อนุญาต และคืน Loan ที่สร้าง', async () => {
    const { client, builder } = fakeClient({ data: row, error: null })
    const result = await repo.createLoan(draft, client)
    expect(builder.insert).toHaveBeenCalledWith(loanToRow(draft))
    expect(result.loan).toEqual(rowToLoan(row))
    expect(result.error).toBeNull()
  })

  it('บันทึกไม่ได้: ข้อความไทย loan เป็น null', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'x' } })
    const result = await repo.createLoan(draft, client)
    expect(result).toEqual({ loan: null, error: repo.SAVE_ERROR_MESSAGE, sessionExpired: false })
  })

  it('RLS ปฏิเสธ (42501): แจ้งเซสชันหมดอายุ', async () => {
    const { client } = fakeClient({ data: null, error: { code: '42501' } })
    const result = await repo.createLoan(draft, client)
    expect(result.sessionExpired).toBe(true)
  })
})

describe('updateLoan', () => {
  it('อัปเดตตาม id และคืน Loan ที่แก้แล้ว (รวมกดคืนแล้ว)', async () => {
    const returned = { ...rowToLoan(row), returnedDate: '2026-09-05' }
    const { client, builder } = fakeClient({ data: { ...row, returned_date: '2026-09-05' }, error: null })
    const result = await repo.updateLoan(returned, client)
    expect(builder.update).toHaveBeenCalledWith(loanToRow(returned))
    expect(builder.eq).toHaveBeenCalledWith('id', row.id)
    expect(result.loan.returnedDate).toBe('2026-09-05')
  })

  it('ไม่พบแถว/ผิดพลาด: ข้อความไทย', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'PGRST116' } })
    const result = await repo.updateLoan(rowToLoan(row), client)
    expect(result.error).toBe(repo.SAVE_ERROR_MESSAGE)
    expect(result.loan).toBeNull()
  })
})

describe('createLoans', () => {
  const drafts = [
    { ...rowToLoan(row), id: undefined, ownerId: undefined },
    { ...rowToLoan(row), id: undefined, ownerId: undefined, itemName: 'ร่ม' },
  ]

  it('เพิ่มหลายรายการในคำสั่งเดียวและคืนรายการที่สร้าง', async () => {
    const { client, builder } = fakeClient({ data: [row, { ...row, item_name: 'ร่ม' }], error: null })
    const result = await repo.createLoans(drafts, client)
    expect(builder.insert).toHaveBeenCalledTimes(1)
    expect(builder.insert).toHaveBeenCalledWith(drafts.map(loanToRow))
    expect(result.loans).toHaveLength(2)
    expect(result.error).toBeNull()
  })

  it('รายการว่าง: ไม่เรียกฐานข้อมูล', async () => {
    const { client } = fakeClient({ data: [], error: null })
    const result = await repo.createLoans([], client)
    expect(client.from).not.toHaveBeenCalled()
    expect(result).toEqual({ loans: [], error: null, sessionExpired: false })
  })

  it('ไม่สำเร็จ: ข้อความไทย ไม่มีรายการที่ถูกเพิ่ม', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'x' } })
    const result = await repo.createLoans(drafts, client)
    expect(result).toEqual({ loans: [], error: repo.SAVE_ERROR_MESSAGE, sessionExpired: false })
  })
})

describe('ไม่มีการลบ Loan', () => {
  it('ไม่มี export ที่เกี่ยวกับ delete/remove', () => {
    expect(Object.keys(repo).some((name) => /delete|remove|destroy/i.test(name))).toBe(false)
  })
})
