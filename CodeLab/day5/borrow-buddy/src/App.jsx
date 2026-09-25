import { useLayoutEffect, useState } from 'react'
import './App.css'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import SearchBox from './components/SearchBox.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { toIsoDate } from './lib/dateFormat.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from './lib/loanRules.js'
import { loadLoans, saveLoans } from './lib/storage.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

function App() {
  // โหลดครั้งเดียวตอนเปิดหน้า (อ่านอย่างเดียว ไม่เขียนทับข้อมูลเดิม)
  const [initial] = useState(loadLoans)
  const [loans, setLoans] = useState(initial.loans)
  const [warning, setWarning] = useState(initial.warning)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  const today = toIsoDate(new Date())
  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null
  const visibleLoans = filterLoansByFriend(loans, query)

  // ทุกการเปลี่ยน Loan ต้องผ่านฟังก์ชันนี้ เพื่อบันทึกทุกครั้งที่เปลี่ยน
  // ไม่ใช้ useEffect เพราะจะเขียนรายการว่างทับข้อมูลเดิมที่อ่านไม่ได้ตอนเปิดหน้า
  const changeLoans = (nextLoans) => {
    setLoans(nextLoans)
    setWarning(saveLoans(nextLoans))
  }

  // Loan ที่ยังไม่มี id คือเพิ่มใหม่ ถ้ามี id คือแก้ไขรายการเดิม
  const handleSave = (loan) => {
    if (loan.id) {
      changeLoans(loans.map((l) => (l.id === loan.id ? loan : l)))
    } else {
      changeLoans([...loans, { ...loan, id: createId() }])
    }
    setEditingId(null)
  }

  const replaceLoan = (target, update) =>
    changeLoans(loans.map((l) => (l.id === target.id ? update(l) : l)))

  const handleMarkReturned = (loan, returnedDate) =>
    replaceLoan(loan, (l) => markReturned(l, today, returnedDate))

  const handleUnmarkReturned = (loan) => replaceLoan(loan, unmarkReturned)

  return (
    <main>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
      </header>
      {warning && <p role="alert">{warning}</p>}
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      <LoanList
        loans={visibleLoans}
        today={today}
        onMarkReturned={handleMarkReturned}
        onUnmarkReturned={handleUnmarkReturned}
        onEdit={(loan) => setEditingId(loan.id)}
      />
    </main>
  )
}

export default App
