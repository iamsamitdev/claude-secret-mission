import { groupLoans } from '../lib/loanRules.js'
import LoanItem from './LoanItem.jsx'

// แสดงรายการของสถานะที่เลือก (แท็บ) เรียงกำหนดคืนใกล้สุดก่อนจาก groupLoans
export default function LoanList({
  loans,
  status,
  today,
  emptyMessage,
  onMarkReturned,
  onUnmarkReturned,
  onEdit,
}) {
  const items = groupLoans(loans, today)[status]

  if (items.length === 0) return <p className="empty-state">{emptyMessage}</p>

  return (
    <ul className="loan-list">
      {items.map((loan) => (
        <LoanItem
          key={loan.id}
          loan={loan}
          today={today}
          onMarkReturned={onMarkReturned}
          onUnmarkReturned={onUnmarkReturned}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}
