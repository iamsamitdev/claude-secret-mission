import { STATUS, STATUS_LABEL, groupLoans } from '../lib/loanRules.js'
import LoanItem from './LoanItem.jsx'

// ลำดับกลุ่ม: เกินกำหนด → ยังไม่คืน → คืนแล้ว (แต่ละกลุ่มเรียงจาก groupLoans แล้ว)
const GROUP_ORDER = [STATUS.OVERDUE, STATUS.OUTSTANDING, STATUS.RETURNED]

export default function LoanList({ loans, today, onMarkReturned, onUnmarkReturned, onEdit }) {
  if (loans.length === 0) return <p>ไม่มีรายการ</p>

  const groups = groupLoans(loans, today)

  return (
    <div>
      {GROUP_ORDER.filter((status) => groups[status].length > 0).map((status) => (
        <section key={status}>
          <h2>
            {STATUS_LABEL[status]} ({groups[status].length})
          </h2>
          <ul>
            {groups[status].map((loan) => (
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
        </section>
      ))}
    </div>
  )
}
