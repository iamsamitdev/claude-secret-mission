# คู่มือเชื่อม Borrow Buddy กับ Supabase และ Deploy ขึ้น Vercel

คู่มือนี้พาโปรเจ็กต์ `CodeLab/day4/borrow-buddy` (React + Vite, JavaScript) จากเวอร์ชันที่เก็บข้อมูลใน **localStorage** ไปเป็นเวอร์ชันที่

- เก็บข้อมูลบน **Supabase** (PostgreSQL บนคลาวด์)
- มี **ล็อกอินด้วย email + password** เพื่อให้ **เจ้าของ** เห็นและแก้ได้เฉพาะ Loan ของตัวเอง
- ป้องกันข้อมูลด้วย **Row Level Security (RLS)**
- **Deploy ขึ้น Vercel** อัตโนมัติทุกครั้งที่ `git push`

> ศัพท์ในคู่มือนี้ (เจ้าของ, เพื่อน, ของ, Loan, กำหนดคืน ฯลฯ) อ้างอิงจาก `borrow-buddy/CONTEXT.md`

---

## ภาพรวม

```
เบราว์เซอร์ (React + Vite)
   │  publishable key + session ของเจ้าของ
   ▼
Supabase ── Auth (email + password)
   │
   └── ตาราง loans  ← RLS: เห็น/แก้ได้เฉพาะแถวที่ owner_id = ผู้ที่ล็อกอิน
   
GitHub ──(git push)──► Vercel ──► https://borrow-buddy-xxx.vercel.app
```

| ขั้นตอน | สิ่งที่ทำ |
| --- | --- |
| 0 | ตัดสินใจเรื่องขอบเขต: เพิ่มล็อกอิน และปรับ `design.md` |
| 1 | เตรียมเครื่องและสมัครบัญชี |
| 2 | สร้าง Supabase project |
| 3 | เชื่อม Supabase MCP กับ Claude Code |
| 4 | สร้างตาราง `loans` + RLS |
| 5 | ตั้งค่า Auth และสร้างบัญชีเจ้าของ |
| 6 | ติดตั้ง `@supabase/supabase-js` และตั้ง env |
| 7 | เปลี่ยน `storage.js` ให้ใช้ Supabase + เพิ่มหน้าล็อกอิน |
| 8 | ตรวจความปลอดภัยด้วย Advisors |
| 9 | Push ขึ้น GitHub |
| 10 | Deploy ขึ้น Vercel |
| 11 | ตั้ง URL ของ Vercel ใน Supabase Auth |
| 12 | (ทางเลือก) Vercel CLI / Vercel MCP |

---

## ขั้นตอนที่ 0 — ปรับขอบเขตใน `design.md`

เวอร์ชันแรกตัดระบบล็อกอินออก เพราะข้อมูลอยู่ในเบราว์เซอร์ของเจ้าของเท่านั้น แต่เมื่อย้ายข้อมูลขึ้น Supabase

- **publishable key จะติดไปกับโค้ดฝั่งเบราว์เซอร์** ใครเปิดเว็บก็ดู key ได้
- ถ้า **ไม่มีล็อกอิน + ไม่มี RLS** ใครก็อ่าน/แก้ตาราง `loans` ได้ทั้งหมด

จึงต้องย้าย "ระบบล็อกอิน" จาก **นอกขอบเขต** มาเป็น **อยู่ในขอบเขต** ตัวอย่าง prompt:

```
อ่าน @borrow-buddy/design.md แล้วปรับเอกสารสำหรับเวอร์ชัน 2:
- ย้ายข้อมูลจาก localStorage ไป Supabase
- เพิ่มล็อกอินด้วย email + password สำหรับเจ้าของ (ปิดการสมัครสมาชิกเอง)
- ใช้ RLS ให้เห็นเฉพาะ Loan ของตัวเอง
- ยังไม่มีการลบ Loan เหมือนเดิม
อัปเดต CONTEXT.md ถ้ามีศัพท์ใหม่ แล้วเพิ่มเฟสใหม่ใน Tasks.md ห้ามเขียนโค้ด
```

---

## ขั้นตอนที่ 1 — เตรียมเครื่องและสมัครบัญชี

### 1.1 โปรแกรมที่ต้องมี

| โปรแกรม | จำเป็น? | ตรวจสอบด้วย |
| --- | --- | --- |
| Node.js LTS (22 ขึ้นไป) + npm | ✅ | `node -v` และ `npm -v` |
| Git | ✅ | `git --version` |
| GitHub CLI (`gh`) ล็อกอินแล้ว | ✅ | `gh auth status` |
| Claude Code | ✅ | `claude --version` |
| Vercel CLI | ⚪ ทางเลือก | `vercel --version` |
| Supabase CLI + Docker | ❌ **ไม่ต้องติดตั้ง** | — |

> Git และ `gh` ติดตั้งตาม [GitHub-CLI-Setup-Guide.md](./GitHub-CLI-Setup-Guide.md)
>
> ไม่ต้องใช้ Supabase CLI/Docker เพราะเราใช้ Supabase บนคลาวด์ (Free tier) โดยตรง ไม่ได้รันฐานข้อมูลในเครื่อง

**ติดตั้ง Node.js**

macOS / Linux:

```bash
# macOS
brew install node

# Ubuntu / Debian (ผ่าน nvm แนะนำ)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
# เปิด Terminal ใหม่ แล้ว
nvm install --lts
```

Windows (PowerShell):

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

### 1.2 สมัครบัญชี

สมัครทั้งสองบริการด้วยปุ่ม **Continue with GitHub** จะได้ใช้บัญชีเดียวกันทั้งหมด และเชื่อม repo ได้ง่าย

- Supabase: <https://supabase.com/dashboard/sign-up>
- Vercel: <https://vercel.com/signup> (เลือกแผน **Hobby** ซึ่งฟรี)

---

## ขั้นตอนที่ 2 — สร้าง Supabase project

1. เข้า <https://supabase.com/dashboard> → **New project**
2. กรอก
   - **Name:** `borrow-buddy`
   - **Database Password:** กด Generate แล้วเก็บไว้ในที่ปลอดภัย
   - **Region:** `Southeast Asia (Singapore)`
3. กด **Create new project** รอประมาณ 1–2 นาที
4. จด **Project ref** ไว้ (ดูจาก URL `https://supabase.com/dashboard/project/<project-ref>`)

> ⚠️ **ข้อจำกัด Free tier**
> - สร้าง project ที่ทำงานอยู่ได้ **2 project ต่อ organization**
> - project จะถูก **พัก (pause)** ถ้าไม่มีการใช้งานประมาณ 1 สัปดาห์ กดปลุกได้จาก dashboard

---

## ขั้นตอนที่ 3 — เชื่อม Supabase MCP กับ Claude Code

Supabase MCP ช่วยให้ Claude สร้างตาราง เขียน RLS ตรวจความปลอดภัย และดึง URL/key ให้ได้โดยไม่ต้องคลิกใน dashboard

### 3.1 เพิ่ม MCP server

รันในโฟลเดอร์ `borrow-buddy` (แทน `<project-ref>` ด้วยค่าจากขั้นตอนที่ 2)

macOS / Linux:

```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
```

Windows (PowerShell):

```powershell
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
```

> - `project_ref` ผูก MCP ไว้กับ project นี้ project เดียว Claude จะมองไม่เห็น project อื่นในบัญชี
> - ไม่ใช้ `--scope project` เพราะผู้เรียนแต่ละคนมี `project-ref` ของตัวเอง ใช้ค่าเริ่มต้น (local) ก็พอ

### 3.2 ล็อกอิน

เปิด Claude Code แล้วพิมพ์

```
/mcp
```

เลือก `supabase` → **Authenticate** เบราว์เซอร์จะเปิดให้กดอนุญาต เมื่อสำเร็จจะเห็นสถานะ `connected`

### 3.3 ทดสอบ

```
ใช้ Supabase MCP บอก project URL และรายชื่อตารางที่มีอยู่ตอนนี้
```

> 🔐 **กติกาความปลอดภัยของ MCP**
> - ใช้กับ **project สำหรับเรียน/พัฒนาเท่านั้น** ห้ามผูกกับ project ที่มีข้อมูลจริง
> - คำสั่งที่เขียนข้อมูล (`apply_migration`, `execute_sql`) ให้ Claude **ขออนุญาตทุกครั้ง** และอ่าน SQL ก่อนกดยืนยัน
> - ถ้าต้องการแค่สำรวจ เพิ่ม `&read_only=true` ต่อท้าย URL

---

## ขั้นตอนที่ 4 — สร้างตาราง `loans` + RLS

### 4.1 ให้ Claude สร้าง migration

```
ใช้ Supabase MCP สร้าง migration ชื่อ create_loans ตาม design.md ข้อ 4 และกติกาข้อ 5
- ชื่อคอลัมน์เป็น snake_case
- มี owner_id ผูกกับ auth.users และค่าเริ่มต้นเป็น auth.uid()
- ใส่ CHECK constraint ตามกติกาการตรวจวันที่
- เปิด RLS และสร้าง policy select / insert / update เฉพาะเจ้าของ
- ไม่ต้องมี policy delete เพราะระบบไม่มีการลบ
แสดง SQL ให้ผมตรวจก่อน apply
```

### 4.2 SQL ที่ควรได้ (ใช้ตรวจเทียบ)

```sql
create table public.loans (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  friend_name   text not null check (length(trim(friend_name)) > 0),
  item_name     text not null check (length(trim(item_name)) > 0),
  borrowed_date date not null,
  due_date      date not null,
  returned_date date,
  created_at    timestamptz not null default now(),

  constraint due_not_before_borrowed
    check (due_date >= borrowed_date),
  constraint returned_not_before_borrowed
    check (returned_date is null or returned_date >= borrowed_date)
);

create index loans_owner_id_idx on public.loans (owner_id);

alter table public.loans enable row level security;

create policy "owner can read own loans"
  on public.loans for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "owner can insert own loans"
  on public.loans for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "owner can update own loans"
  on public.loans for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
```

**จุดที่ควรอธิบายผู้เรียน**

| ส่วน | ทำไม |
| --- | --- |
| `default auth.uid()` | ฝั่งเว็บไม่ต้องส่ง `owner_id` เอง ลดโอกาสส่งค่าผิด |
| `CHECK` constraint | กติกาใน `loanRules.js` ถูกบังคับซ้ำที่ฐานข้อมูล ป้องกันข้อมูลผิดแม้มีคนยิง API ตรง |
| `enable row level security` | ถ้าลืมบรรทัดนี้ ใครมี publishable key ก็อ่านข้อมูลได้ทั้งหมด |
| `to authenticated` | ผู้ที่ไม่ได้ล็อกอิน (`anon`) ทำอะไรกับตารางไม่ได้เลย |
| `(select auth.uid())` | ครอบด้วย `select` เพื่อให้ Postgres คำนวณครั้งเดียวต่อ query (เร็วกว่า) |
| ไม่มี policy delete | RLS ปฏิเสธการลบโดยอัตโนมัติ ตรงกับขอบเขตที่ไม่มีการลบ |

---

## ขั้นตอนที่ 5 — ตั้งค่า Auth และสร้างบัญชีเจ้าของ

เว็บนี้มี **เจ้าของคนเดียว** จึงปิดการสมัครเอง และสร้างบัญชีจาก dashboard

1. Supabase Dashboard → **Authentication** → **Sign In / Providers**
   - **Email** เปิดไว้ (ค่าเริ่มต้น)
   - **Allow new users to sign up** → **ปิด**
   - **Confirm email** → **ปิด** (ระหว่างเรียน จะได้ไม่ต้องรออีเมล)
2. **Authentication** → **Users** → **Add user** → **Create new user**
   - กรอก email + password ของเจ้าของ
   - ติ๊ก **Auto Confirm User**

> 💡 ไม่ใช้ Magic link ในห้องเรียน เพราะบริการอีเมลในตัวของ Supabase ส่งได้แค่ไม่กี่ฉบับต่อชั่วโมง ถ้าผู้เรียนหลายคนกดพร้อมกันจะติดลิมิต

---

## ขั้นตอนที่ 6 — ติดตั้ง supabase-js และตั้ง env

### 6.1 ติดตั้งแพ็กเกจ

```bash
npm install @supabase/supabase-js
```

### 6.2 สร้างไฟล์ `.env.local`

ให้ Claude ดึงค่าให้:

```
ใช้ Supabase MCP ดึง project URL และ publishable key
แล้วสร้างไฟล์ .env.local และ .env.example ใน borrow-buddy
ตรวจด้วยว่า .gitignore มี .env.local แล้ว
```

ผลลัพธ์ที่ควรได้:

```bash
# .env.local  (ห้าม commit)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

```bash
# .env.example  (commit ได้ ไว้บอกว่าต้องมีตัวแปรอะไรบ้าง)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

> - ชื่อตัวแปร **ต้องขึ้นต้นด้วย `VITE_`** Vite ถึงจะส่งค่าไปให้โค้ดฝั่งเบราว์เซอร์
> - ถ้า project เก่ายังแสดงเป็น **anon key** (ขึ้นต้นด้วย `eyJ...`) ใช้แทน publishable key ได้
> - ⛔ **ห้ามใช้ `service_role` / secret key ในโค้ดฝั่งเบราว์เซอร์เด็ดขาด** key นี้ข้าม RLS ได้ทั้งหมด
> - หลังแก้ `.env.local` ต้อง **หยุดแล้วรัน `npm run dev` ใหม่** ค่าถึงจะอัปเดต

ตรวจว่า `.gitignore` มีบรรทัดนี้:

```gitignore
.env.local
.env*.local
```

---

## ขั้นตอนที่ 7 — ปรับโค้ด

แนวคิดหลัก: `src/lib/loanRules.js` เป็นตรรกะล้วน **ไม่ต้องแก้** เปลี่ยนเฉพาะชั้นเก็บข้อมูล (`storage.js`) และเพิ่มหน้าล็อกอิน

### 7.1 ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `src/lib/supabaseClient.js` | **ใหม่**: สร้าง Supabase client จาก env |
| `src/lib/storage.js` | เปลี่ยนจาก localStorage เป็น Supabase (กลายเป็น async) |
| `src/components/LoginForm.jsx` | **ใหม่**: ฟอร์ม email + password |
| `src/App.jsx` | ตรวจ session, แสดงหน้าล็อกอิน/ออกจากระบบ, สถานะกำลังโหลด/ผิดพลาด |
| `src/lib/storage.test.js` | mock `supabaseClient` แทน localStorage |

### 7.2 prompt สำหรับ Claude Code

```
อ่าน @borrow-buddy/design.md และ @borrow-buddy/Tasks.md เฟสใหม่
ตรวจเอกสาร supabase-js ล่าสุดผ่าน Context7 ก่อน แล้ว:
1. สร้าง src/lib/supabaseClient.js อ่านค่าจาก import.meta.env
2. เขียน storage.js ใหม่ให้ใช้ตาราง loans แปลง snake_case <-> camelCase
   ให้ Loan ในแอปยังมีรูปแบบเดิมตาม design.md ข้อ 4
3. เพิ่ม LoginForm.jsx และปุ่มออกจากระบบใน App.jsx
4. แสดงข้อความภาษาไทยเมื่อโหลด/บันทึกไม่สำเร็จ
5. ปรับเทสต์ให้ mock supabaseClient และให้ npm test ผ่านทั้งหมด
JavaScript เท่านั้น ห้ามลบไฟล์โดยไม่ถาม commit แยกตาม task
```

### 7.3 โค้ดตัวอย่างสำหรับตรวจเทียบ

`src/lib/supabaseClient.js`

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('ไม่พบค่า VITE_SUPABASE_URL หรือ VITE_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase = createClient(url, key)
```

`src/lib/storage.js` (แนวทาง)

```js
import { supabase } from './supabaseClient'

const fromRow = (row) => ({
  id: row.id,
  friendName: row.friend_name,
  itemName: row.item_name,
  borrowedDate: row.borrowed_date,
  dueDate: row.due_date,
  returnedDate: row.returned_date,
})

const toRow = (loan) => ({
  friend_name: loan.friendName,
  item_name: loan.itemName,
  borrowed_date: loan.borrowedDate,
  due_date: loan.dueDate,
  returned_date: loan.returnedDate ?? null,
})

export async function loadLoans() {
  const { data, error } = await supabase.from('loans').select('*')
  if (error) throw error
  return data.map(fromRow)
}

export async function createLoan(loan) {
  const { data, error } = await supabase
    .from('loans')
    .insert(toRow(loan))
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updateLoan(loan) {
  const { data, error } = await supabase
    .from('loans')
    .update(toRow(loan))
    .eq('id', loan.id)
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}
```

การล็อกอินใน `App.jsx` (แนวทาง)

```js
// ล็อกอิน
await supabase.auth.signInWithPassword({ email, password })

// ออกจากระบบ
await supabase.auth.signOut()

// ติดตาม session
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setSession(data.session))
  const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
  return () => sub.subscription.unsubscribe()
}, [])
```

### 7.4 ทดสอบในเครื่อง

```bash
npm test
npm run dev
```

- ล็อกอินด้วยบัญชีเจ้าของ → เพิ่ม → แก้ไข → กดคืน → ยกเลิกคืน → รีเฟรช ข้อมูลยังอยู่
- เปิดอีกเบราว์เซอร์ (หรือโหมด Incognito) ล็อกอินบัญชีเดิม ต้องเห็นข้อมูลเดียวกัน
- ออกจากระบบ → ต้องไม่เห็นข้อมูลใด ๆ

---

## ขั้นตอนที่ 8 — ตรวจความปลอดภัยด้วย Advisors

```
ใช้ Supabase MCP เรียก get_advisors ทั้งแบบ security และ performance
สรุปปัญหาที่พบเป็นภาษาไทย และเสนอวิธีแก้ ยังไม่ต้องแก้
```

ต้องไม่มีคำเตือนประเภท **RLS disabled in public** ถ้ามี แปลว่าตารางยังเปิดให้ทุกคนเข้าถึงได้

> 🧪 **แบบฝึกหัดแนะนำ:** ให้ผู้เรียนลอง `alter table public.loans disable row level security;` ใน project ทดลอง แล้วเรียก `get_advisors` ดูคำเตือน จากนั้นเปิดกลับด้วย `enable row level security`

---

## ขั้นตอนที่ 9 — Push ขึ้น GitHub

`borrow-buddy` มี git repository ของตัวเองอยู่แล้ว (สร้างจาก git-manager subagent) ถ้ายังไม่มี remote:

```bash
cd borrow-buddy
git status                       # ต้องไม่เห็น .env.local
gh repo create borrow-buddy --private --source=. --push
```

หรือใช้ prompt:

```
ใช้ git-manager ตรวจว่า .env.local ไม่ถูก track
แล้วสร้าง GitHub repo ชื่อ borrow-buddy แบบ private และ push ขึ้นไป
```

---

## ขั้นตอนที่ 10 — Deploy ขึ้น Vercel

ใช้วิธี **Git integration**: เชื่อมครั้งเดียว หลังจากนั้นทุก `git push` จะ deploy ให้อัตโนมัติ

1. เข้า <https://vercel.com/new>
2. **Import Git Repository** → เลือก `borrow-buddy`
   (ถ้าไม่เห็น repo กด **Adjust GitHub App Permissions** แล้วอนุญาต repo นี้)
3. ตรวจค่าที่ Vercel ตรวจพบอัตโนมัติ

   | ช่อง | ค่า |
   | --- | --- |
   | Framework Preset | Vite |
   | Root Directory | `./` (ถ้า repo คือโฟลเดอร์ `borrow-buddy` เอง) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. เปิด **Environment Variables** แล้วเพิ่มสองค่า (ค่าเดียวกับ `.env.local`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. กด **Deploy** รอประมาณ 1 นาที จะได้ URL เช่น `https://borrow-buddy-xxx.vercel.app`

> ⚠️ ถ้าเพิ่ม/แก้ env ทีหลัง ต้องกด **Redeploy** เพราะ Vite ฝังค่า env ไว้ตอน build

---

## ขั้นตอนที่ 11 — ตั้ง URL ของ Vercel ใน Supabase Auth

Supabase Dashboard → **Authentication** → **URL Configuration**

- **Site URL:** `https://borrow-buddy-xxx.vercel.app`
- **Redirect URLs:** เพิ่ม
  - `https://borrow-buddy-xxx.vercel.app/**`
  - `http://localhost:5173/**` (สำหรับพัฒนาในเครื่อง)

> การล็อกอินด้วย email + password ไม่ต้องใช้ redirect แต่ควรตั้งไว้ เผื่อเพิ่มการรีเซ็ตรหัสผ่านหรือ OAuth ในภายหลัง

ทดสอบบน URL จริงแบบเดียวกับข้อ 7.4 และลองบนมือถือด้วย

---

## ขั้นตอนที่ 12 — (ทางเลือก) Vercel CLI และ Vercel MCP

ไม่จำเป็นสำหรับการ deploy ปกติ เหมาะสำหรับผู้เรียนที่ทำเสร็จก่อน

### Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link                               # ผูกโฟลเดอร์กับ project บน Vercel
vercel env pull .env.local                # ดึง env จาก Vercel ลงเครื่อง
vercel                                    # deploy แบบ preview
vercel --prod                             # deploy ขึ้น production
```

### Vercel MCP

ช่วยให้ Claude อ่านรายการ deployment และ build log ได้ มีประโยชน์ตอน deploy พัง

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

จากนั้นพิมพ์ `/mcp` → เลือก `vercel` → **Authenticate**

```
ใช้ Vercel MCP ดู deployment ล่าสุดของ borrow-buddy ถ้า build ล้มเหลวให้สรุปสาเหตุจาก log
```

---

## 🛠️ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `ไม่พบค่า VITE_SUPABASE_URL ...` ตอน `npm run dev` | ยังไม่มี `.env.local`, ชื่อตัวแปรไม่ขึ้นต้นด้วย `VITE_` หรือยังไม่ได้รัน dev server ใหม่ |
| หน้าเว็บบน Vercel ขาว / error เรื่อง env | ยังไม่ได้ใส่ env ใน Vercel หรือใส่แล้วแต่ยังไม่ได้ **Redeploy** |
| ล็อกอินแล้ว `select` ได้ array ว่าง | ยังไม่มีข้อมูลของบัญชีนี้ หรือ policy select ผิด (ตรวจ `owner_id`) |
| `new row violates row-level security policy` | ยังไม่ได้ล็อกอินตอนบันทึก หรือส่ง `owner_id` ของคนอื่นมา ให้ลบ `owner_id` ออกจาก `toRow` แล้วใช้ค่าเริ่มต้น |
| `violates check constraint "due_not_before_borrowed"` | กำหนดคืนอยู่ก่อนวันที่ยืม ต้องแสดงข้อความจาก `loanRules.js` ก่อนส่งไปฐานข้อมูล |
| `Invalid login credentials` | email/password ผิด หรือยังไม่ได้ติ๊ก **Auto Confirm User** ตอนสร้างบัญชี |
| `Signups not allowed for this instance` | ปกติ เพราะปิดการสมัครไว้ ให้สร้างบัญชีจาก dashboard |
| `/mcp` ไม่เห็น supabase | รัน `claude mcp list` ตรวจว่าเพิ่มในโฟลเดอร์ที่ถูกต้อง แล้วเปิด Claude Code ใหม่ |
| MCP ขึ้น `needs authentication` | พิมพ์ `/mcp` แล้ว Authenticate ใหม่ |
| Supabase ตอบช้ามาก / เชื่อมต่อไม่ได้ | project ถูกพัก เข้า dashboard แล้วกด **Restore project** |
| Vercel build ล้มเหลว | เปิด build log ใน Vercel (หรือใช้ Vercel MCP) ส่วนใหญ่เป็น import ผิดตัวพิมพ์เล็ก/ใหญ่ ซึ่ง macOS/Windows ไม่ฟ้อง แต่ Linux บน Vercel ฟ้อง |
| เผลอ commit `.env.local` | ลบออกจาก git ด้วย `git rm --cached .env.local` แล้ว commit ใหม่ ถ้าเป็น secret key ให้ **rotate key** ใน Supabase ทันที |

---

## 📋 Checklist สรุป

**เตรียมเครื่อง**
- [ ] `node -v`, `git --version`, `gh auth status` ผ่าน
- [ ] สมัคร Supabase และ Vercel ด้วยบัญชี GitHub แล้ว

**Supabase**
- [ ] สร้าง project ที่ region Singapore
- [ ] `/mcp` แสดง supabase เป็น `connected`
- [ ] ตาราง `loans` มี CHECK constraint และ **เปิด RLS**
- [ ] มี policy select / insert / update และ **ไม่มี** policy delete
- [ ] ปิด sign up และสร้างบัญชีเจ้าของแบบ Auto Confirm
- [ ] `get_advisors` ไม่มีคำเตือนด้านความปลอดภัย

**โค้ด**
- [ ] `.env.local` มีค่าครบ และ **ไม่ถูก commit**
- [ ] ไม่มี `service_role` / secret key ในโค้ด
- [ ] `npm test` ผ่านทั้งหมด
- [ ] ออกจากระบบแล้วมองไม่เห็นข้อมูล

**Deploy**
- [ ] push ขึ้น GitHub แล้ว
- [ ] Vercel มี env ครบ และ deploy สำเร็จ
- [ ] ตั้ง Site URL / Redirect URLs ใน Supabase แล้ว
- [ ] ทดลองบน URL จริงและบนมือถือผ่าน

## 🔗 แหล่งข้อมูลเพิ่มเติม

- Supabase + React quickstart: <https://supabase.com/docs/guides/getting-started/quickstarts/reactjs>
- Row Level Security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase MCP: <https://supabase.com/docs/guides/getting-started/mcp>
- Vite env variables: <https://vite.dev/guide/env-and-mode>
- Deploy Vite บน Vercel: <https://vercel.com/docs/frameworks/frontend/vite>
- Vercel MCP: <https://vercel.com/docs/mcp>
