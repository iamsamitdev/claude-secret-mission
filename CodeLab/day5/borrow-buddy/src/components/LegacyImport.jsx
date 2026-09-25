// แผงถามย้ายข้อมูลเดิมจาก localStorage (เวอร์ชัน 1) ขึ้นบัญชีเจ้าของ ทำครั้งเดียวโดยเจ้าของยืนยัน
// - legacy: ผลจาก readLegacyLoans (loans, skipped, warning) ใช้ตอนรอการตัดสินใจ
// - result: { imported, skipped } หลังนำเข้าสำเร็จ (แสดงสรุปจนกว่าจะกดตกลง)
// ไม่ลบข้อมูลเดิมในเบราว์เซอร์ไม่ว่ากรณีใด
function SkippedList({ skipped }) {
  if (skipped.length === 0) return null
  return (
    <>
      <p>ข้ามรายการที่ไม่ถูกต้อง {skipped.length} รายการ:</p>
      <ul>
        {skipped.map((item) => (
          <li key={item.index}>
            {item.label}: {item.errors.join(', ')}
          </li>
        ))}
      </ul>
    </>
  )
}

export default function LegacyImport({ legacy, result, busy, error, onImport, onDismiss }) {
  if (result) {
    return (
      <section className="legacy-import">
        <h2>ย้ายข้อมูลเดิมเสร็จแล้ว</h2>
        <p>นำเข้า {result.imported} รายการ ข้อมูลเดิมในเบราว์เซอร์นี้ยังอยู่ ไม่ถูกลบ</p>
        <SkippedList skipped={result.skipped} />
        <div className="form-actions">
          <button type="button" onClick={onDismiss}>
            ตกลง
          </button>
        </div>
      </section>
    )
  }

  if (!legacy) return null

  if (legacy.warning) {
    return (
      <section className="legacy-import">
        <h2>ย้ายข้อมูลเดิม</h2>
        <p role="alert">{legacy.warning}</p>
        <div className="form-actions">
          <button type="button" onClick={onDismiss}>
            ปิด
          </button>
        </div>
      </section>
    )
  }

  const count = legacy.loans.length
  return (
    <section className="legacy-import">
      <h2>ย้ายข้อมูลเดิม</h2>
      <p>
        พบข้อมูลการยืมเดิมที่เก็บในเบราว์เซอร์นี้ {count} รายการ
        ต้องการนำเข้าขึ้นบัญชีของคุณหรือไม่ (ทำครั้งเดียว และไม่ลบข้อมูลเดิม)
      </p>
      <SkippedList skipped={legacy.skipped} />
      {error && <p role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="mark-returned" disabled={busy || count === 0} onClick={onImport}>
          {busy ? 'กำลังนำเข้า...' : `นำเข้า ${count} รายการ`}
        </button>
        <button type="button" disabled={busy} onClick={onDismiss}>
          ไม่นำเข้า
        </button>
      </div>
    </section>
  )
}
