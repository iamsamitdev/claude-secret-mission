// ช่องค้นหาตามชื่อเพื่อน (controlled: ค่าและการกรองอยู่ที่ผู้เรียก)
export default function SearchBox({ value, onChange }) {
  return (
    <label>
      ค้นหาตามชื่อเพื่อน
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="พิมพ์ชื่อเพื่อน"
      />
    </label>
  )
}
