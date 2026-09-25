import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import LegacyImport from './components/LegacyImport.jsx'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import LoginForm from './components/LoginForm.jsx'
import SearchBox from './components/SearchBox.jsx'
import TabBar from './components/TabBar.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { onSessionChange, signIn, signOut } from './lib/auth.js'
import { toIsoDate } from './lib/dateFormat.js'
import { isLegacyImported, markLegacyImported, readLegacyLoans } from './lib/legacyImport.js'
import {
  SESSION_EXPIRED_MESSAGE,
  createLoan,
  createLoans,
  fetchLoans,
  updateLoan,
} from './lib/loanRepo.js'
import {
  STATUS,
  STATUS_LABEL,
  filterLoansByFriend,
  getLoanStatus,
  groupLoans,
  markReturned,
  unmarkReturned,
} from './lib/loanRules.js'
import { ADD_TAB, getEmptyMessage, pickDefaultTab } from './lib/loanTabs.js'
import { getSupabase } from './lib/supabaseClient.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

// หน้า Loan ของเจ้าที่เข้าสู่ระบบแล้ว เก็บ state ของ Loan
// ข้อมูลอยู่ที่ Supabase: อัปเดตหน้าจอเมื่อเขียนสำเร็จเท่านั้น ถ้าไม่สำเร็จแจ้งเป็นภาษาไทยและไม่ทิ้งข้อมูลในฟอร์ม
function LoanManager({ onSessionExpired }) {
  const [loans, setLoans] = useState([])
  const [loadState, setLoadState] = useState('loading') // loading | ready | error
  const [message, setMessage] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState(null) // null = ใช้แท็บเริ่มต้น (แท็บแรกที่มี Loan) จนกว่าเจ้าของจะเลือกเอง
  const [returnTab, setReturnTab] = useState(null) // แท็บที่ดูอยู่ก่อนกดแก้ไข ใช้กลับมาเมื่อยกเลิก
  const [legacy, setLegacy] = useState(null) // ข้อมูลเดิมที่รอเจ้าของตัดสินใจนำเข้า
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchLoans().then(({ loans: fetched, error, sessionExpired }) => {
      if (cancelled) return
      if (sessionExpired) {
        onSessionExpired()
        return
      }
      if (error) {
        setMessage(error)
        setLoadState('error')
        return
      }
      setMessage(null)
      setLoans(fetched)
      setLoadState('ready')
      // ถามย้ายข้อมูลเดิมเฉพาะเมื่อบัญชีนี้ยังไม่มี Loan และยังไม่เคยตัดสินใจ
      if (fetched.length === 0 && !isLegacyImported()) {
        const found = readLegacyLoans()
        if (found.loans.length > 0 || found.skipped.length > 0 || found.warning) setLegacy(found)
      }
    })
    return () => {
      cancelled = true
    }
  }, [reloadKey, onSessionExpired])

  const handleRetry = () => {
    setLoadState('loading')
    setReloadKey((k) => k + 1)
  }

  const today = toIsoDate(new Date())
  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null
  const visibleLoans = filterLoansByFriend(loans, query)
  const groups = groupLoans(visibleLoans, today)
  const activeTab = tab ?? pickDefaultTab(groups)

  // คืน Loan ที่บันทึกแล้ว หรือ null เมื่อไม่สำเร็จ ผลลัพธ์จาก loanRepo ทุกตัวผ่านฟังก์ชันนี้
  const applyResult = (result) => {
    if (result.sessionExpired) {
      onSessionExpired()
      return null
    }
    if (result.error) {
      setMessage(result.error)
      return null
    }
    setMessage(null)
    const saved = result.loan
    setLoans((prev) =>
      prev.some((l) => l.id === saved.id)
        ? prev.map((l) => (l.id === saved.id ? saved : l))
        : [...prev, saved],
    )
    return saved
  }

  // Loan ที่ยังไม่มี id คือเพิ่มใหม่ ถ้ามี id คือแก้ไขรายการเดิม
  // สำเร็จแล้วไปแท็บตามสถานะของ Loan ที่บันทึก คืน true/false ให้ฟอร์มรู้ว่าล้างข้อมูลได้หรือไม่
  const handleSave = async (loan) => {
    const saved = applyResult(loan.id ? await updateLoan(loan) : await createLoan(loan))
    if (!saved) return false
    setEditingId(null)
    setReturnTab(null)
    setTab(getLoanStatus(saved, today))
    return true
  }

  const handleEdit = (loan) => {
    setReturnTab(activeTab)
    setEditingId(loan.id)
    setTab(ADD_TAB)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTab(returnTab)
    setReturnTab(null)
  }

  const handleMarkReturned = async (loan, returnedDate) => {
    applyResult(await updateLoan(markReturned(loan, today, returnedDate)))
  }

  const handleUnmarkReturned = async (loan) => {
    applyResult(await updateLoan(unmarkReturned(loan)))
  }

  const handleImport = async () => {
    setImporting(true)
    setImportError(null)
    const result = await createLoans(legacy.loans)
    setImporting(false)
    if (result.sessionExpired) {
      onSessionExpired()
      return
    }
    if (result.error) {
      // นำเข้าไม่สำเร็จ: ไม่ทำเครื่องหมายว่าย้ายแล้ว ข้อมูลเดิมยังอยู่ครบและลองใหม่ได้
      setImportError(result.error)
      return
    }
    markLegacyImported()
    setLoans((prev) => [...prev, ...result.loans])
    setImportResult({ imported: result.loans.length, skipped: legacy.skipped })
    setLegacy(null)
  }

  // ไม่นำเข้า/ปิดแผง: ทำเครื่องหมายว่าตัดสินใจแล้ว จะไม่ถามอีก (ข้อมูลเดิมในเบราว์เซอร์ไม่ถูกลบ)
  const handleDismissImport = () => {
    markLegacyImported()
    setLegacy(null)
    setImportResult(null)
    setImportError(null)
  }

  if (loadState === 'loading') return <p>กำลังโหลดรายการ...</p>

  if (loadState === 'error') {
    return (
      <>
        <p role="alert">{message}</p>
        <div className="form-actions">
          <button type="button" onClick={handleRetry}>
            ลองใหม่
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {message && <p role="alert">{message}</p>}
      <LegacyImport
        legacy={legacy}
        result={importResult}
        busy={importing}
        error={importError}
        onImport={handleImport}
        onDismiss={handleDismissImport}
      />
      <TabBar
        tabs={[
          ...[STATUS.OVERDUE, STATUS.OUTSTANDING, STATUS.RETURNED].map((status) => ({
            key: status,
            label: STATUS_LABEL[status],
            tone: status,
            count: groups[status].length,
          })),
          { key: ADD_TAB, label: editingLoan ? 'แก้ไขการยืม' : 'เพิ่มการยืม', tone: 'add' },
        ]}
        active={activeTab}
        onChange={setTab}
      />
      <div role="tabpanel" id="tab-panel" aria-labelledby={`tab-${activeTab}`} className="tab-panel">
        {activeTab === ADD_TAB ? (
          <LoanForm
            key={editingLoan?.id ?? 'new'}
            today={today}
            editingLoan={editingLoan}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <>
            <SearchBox value={query} onChange={setQuery} />
            <LoanList
              loans={visibleLoans}
              status={activeTab}
              today={today}
              emptyMessage={getEmptyMessage(activeTab, query.trim() !== '')}
              onMarkReturned={handleMarkReturned}
              onUnmarkReturned={handleUnmarkReturned}
              onEdit={handleEdit}
            />
          </>
        )}
      </div>
    </>
  )
}

function readConfigError() {
  try {
    getSupabase()
    return null
  } catch (e) {
    return e.message
  }
}

function App() {
  const [configError] = useState(readConfigError)
  // session: undefined = กำลังตรวจสอบ, null = ยังไม่เข้าสู่ระบบ, object = เข้าสู่ระบบแล้ว
  const [session, setSession] = useState(configError ? null : undefined)
  const [notice, setNotice] = useState(null)
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // ติดตามสถานะ session (ค่าเริ่มต้นตอนเปิดหน้า, เข้า/ออกจากระบบ, session หมดอายุ)
  useEffect(() => {
    if (configError) return undefined
    return onSessionChange(setSession)
  }, [configError])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  // คืนข้อความผิดพลาดภาษาไทย หรือ null เมื่อสำเร็จ (session จะอัปเดตผ่าน onSessionChange)
  const handleSignIn = async (email, password) => {
    setNotice(null)
    const { error } = await signIn(email, password)
    return error
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) setNotice(error)
  }

  // session หมดอายุ/ไม่มีสิทธิ์: กลับหน้าเข้าสู่ระบบพร้อมแจ้งเตือน
  const handleSessionExpired = useCallback(async () => {
    setNotice(SESSION_EXPIRED_MESSAGE)
    await signOut()
    setSession(null)
  }, [])

  return (
    <main>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <div className="header-actions">
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
          {session && (
            <button type="button" onClick={handleSignOut}>
              ออกจากระบบ
            </button>
          )}
        </div>
      </header>
      {configError && <p role="alert">{configError}</p>}
      {notice && <p role="alert">{notice}</p>}
      {!configError && session === undefined && <p>กำลังตรวจสอบการเข้าสู่ระบบ...</p>}
      {!configError && session === null && <LoginForm onSignIn={handleSignIn} />}
      {session && <LoanManager key={session.user.id} onSessionExpired={handleSessionExpired} />}
    </main>
  )
}

export default App
