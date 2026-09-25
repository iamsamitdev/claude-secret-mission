import { useState } from 'react'
import { formatThaiDate } from '../lib/dateFormat.js'
import {
  STATUS,
  STATUS_LABEL,
  getDaysOverdue,
  getLoanStatus,
  markReturned,
  validateLoan,
} from '../lib/loanRules.js'

// หนึ่งรายการ Loan พร้อมปุ่ม: คืนแล้ว (เฉพาะที่ยังไม่คืน), ยกเลิกการคืน (เฉพาะที่คืนแล้ว), แก้ไข
// ไม่มีปุ่มลบ
export default function LoanItem({ loan, today, onMarkReturned, onUnmarkReturned, onEdit }) {
  const status = getLoanStatus(loan, today)
  const daysOverdue = getDaysOverdue(loan, today)
  const isReturned = status === STATUS.RETURNED

  const [returnDate, setReturnDate] = useState(today)
  const [errors, setErrors] = useState([])

  const handleMarkReturned = () => {
    const found = validateLoan(markReturned(loan, today, returnDate))
    setErrors(found)
    if (found.length > 0) return
    onMarkReturned(loan, returnDate)
  }

  return (
    <li className={`loan-item loan-${status}`}>
      <strong>{loan.itemName}</strong>
      <p>เพื่อน: {loan.friendName}</p>
      <p>วันที่ยืม: {formatThaiDate(loan.borrowedDate)}</p>
      <p>กำหนดคืน: {formatThaiDate(loan.dueDate)}</p>
      <p>
        สถานะ: <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>
        {status === STATUS.OVERDUE && ` ${daysOverdue} วัน`}
      </p>
      {isReturned && <p>วันที่คืนจริง: {formatThaiDate(loan.returnedDate)}</p>}

      {!isReturned && (
        <div className="return-row">
          <label>
            วันที่คืนจริง
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </label>
          <button type="button" className="mark-returned" onClick={handleMarkReturned}>
            คืนแล้ว
          </button>
        </div>
      )}
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="loan-actions">
        {isReturned && (
          <button type="button" onClick={() => onUnmarkReturned(loan)}>
            ยกเลิกการคืน
          </button>
        )}
        <button type="button" onClick={() => onEdit(loan)}>
          แก้ไข
        </button>
      </div>
    </li>
  )
}
