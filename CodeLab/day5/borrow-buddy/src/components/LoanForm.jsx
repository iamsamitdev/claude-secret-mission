import { useState } from 'react'
import { validateLoan } from '../lib/loanRules.js'

// ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ไข
// editingLoan = null คือเพิ่มใหม่ ผู้เรียกควรใส่ key ให้ฟอร์มรีเซ็ตเมื่อเปลี่ยนรายการที่แก้
export default function LoanForm({ today, editingLoan, onSave, onCancelEdit }) {
  const [friendName, setFriendName] = useState(editingLoan?.friendName ?? '')
  const [itemName, setItemName] = useState(editingLoan?.itemName ?? '')
  const [borrowedDate, setBorrowedDate] = useState(editingLoan?.borrowedDate ?? today)
  const [dueDate, setDueDate] = useState(editingLoan?.dueDate ?? '')
  const [errors, setErrors] = useState([])

  const handleSubmit = (e) => {
    e.preventDefault()
    const draft = {
      ...(editingLoan ?? { returnedDate: null }),
      friendName: friendName.trim(),
      itemName: itemName.trim(),
      borrowedDate,
      dueDate,
    }
    const found = validateLoan(draft)
    setErrors(found)
    if (found.length > 0) return

    onSave(draft)
    if (!editingLoan) {
      setFriendName('')
      setItemName('')
      setBorrowedDate(today)
      setDueDate('')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>{editingLoan ? 'แก้ไขการยืม' : 'เพิ่มการยืม'}</h2>

      <label>
        เพื่อน
        <input
          type="text"
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
        />
      </label>

      <label>
        ของ
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </label>

      <label>
        วันที่ยืม
        <input
          type="date"
          value={borrowedDate}
          onChange={(e) => setBorrowedDate(e.target.value)}
        />
      </label>

      <label>
        กำหนดคืน
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>

      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="form-actions">
        <button type="submit">{editingLoan ? 'บันทึกการแก้ไข' : 'เพิ่ม'}</button>
        {editingLoan && (
          <button type="button" onClick={onCancelEdit}>
            ยกเลิกการแก้ไข
          </button>
        )}
      </div>
    </form>
  )
}
