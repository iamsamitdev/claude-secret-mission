// แถบแท็บ (controlled) แต่ละแท็บ: { key, label, tone, count? }
// tone ใช้กำหนดสีประจำแท็บใน CSS; ตัวเลข count กำกับเสมอ ไม่พึ่งสีอย่างเดียว
// เนื้อหาของแท็บที่เลือกต้องห่อด้วย role="tabpanel" id="tab-panel" ที่ฝั่งผู้เรียก
export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tab-bar" role="tablist" aria-label="หมวดรายการยืม">
      {tabs.map((tab) => {
        const selected = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={selected}
            aria-controls="tab-panel"
            className={`tab tab-${tab.tone}${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
