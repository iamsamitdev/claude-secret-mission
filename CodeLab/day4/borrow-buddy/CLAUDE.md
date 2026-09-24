# Borrow Buddy

เว็บบันทึกของที่เราให้เพื่อนยืม ดูว่าใครยืมอะไร ต้องคืนเมื่อไร และกดบันทึกว่าคืนแล้ว

ความหมายของศัพท์ทั้งหมดอยู่ใน @CONTEXT.md ให้ใช้ศัพท์ตามไฟล์นั้นเสมอ ทั้งในโค้ดและข้อความบนหน้าเว็บ
โทนหน้าตาเว็บอยู่ใน @design.md

## Stack

- Next.js (App Router) + JavaScript เท่านั้น ห้ามสร้างไฟล์ .ts หรือ .tsx
- Tailwind CSS สำหรับหน้าตา ห้ามติดตั้ง UI library เพิ่ม
- Phase 1: เก็บข้อมูลใน localStorage
- Phase 2: เปลี่ยนเป็น Supabase (ตาราง `loans`) พร้อมล็อกอินแบบอีเมล+รหัสผ่านของ Supabase Auth สำหรับ Owner คนเดียว ข้อมูลเดิมใน localStorage ไม่ย้ายขึ้น เริ่มใหม่ (รายละเอียดใน @design.md)

## คำสั่งที่ใช้ประจำ

- `npm run dev` รันบนเครื่องที่ http://localhost:3000
- `npm run lint` ตรวจโค้ด
- `npm run build` ทดสอบ build ก่อน push ทุกครั้ง

## โครงสร้างไฟล์

- `app/page.js` หน้าเดียวของแอป: ฟอร์มเพิ่มการยืม + รายการ
- `lib/loans.js` ไฟล์เดียวที่ติดต่อกับที่เก็บข้อมูล มีฟังก์ชัน `getLoans`, `addLoan`, `updateLoan`, `deleteLoan`, `markReturned`, `unmarkReturned` (รายละเอียดใน @design.md)
- `lib/loan-utils.js` ตรรกะล้วนของ Loan ที่ไม่แตะที่เก็บข้อมูล: `getToday`, `getStatus`, `getDaysOverdue`, `sortActiveLoans`, `sortReturnedLoans`, `formatDate`
- `components/` เก็บ component ย่อย สร้างเมื่อไฟล์ page.js ยาวเกิน 150 บรรทัดเท่านั้น

## กฎการเขียนโค้ด

- ไม่ใส่ semicolon (;) ท้ายบรรทัด
- ใช้ single quote สำหรับ string
- หน้าจอที่เรียก `lib/loans.js` ใน Phase 1 ต้องมี `'use client'` บรรทัดแรก เพราะ localStorage ใช้ได้เฉพาะฝั่งเบราว์เซอร์
- หน้าจอห้ามเรียก localStorage หรือ Supabase ตรง ๆ ต้องผ่าน `lib/loans.js` เท่านั้น (เรื่องล็อกอินใน Phase 2 ผ่าน `lib/auth.js`)
- ตอนเปลี่ยนเป็น Supabase ส่วนจัดการ Loan ให้แก้เฉพาะ `lib/loans.js` โดยชื่อฟังก์ชันและรูปแบบข้อมูลที่ส่งคืนต้องเหมือนเดิม และฟังก์ชันทุกตัวต้องคืน Promise (`async`) ตั้งแต่ Phase 1
- ข้อความบนหน้าเว็บเป็นภาษาไทย ชื่อตัวแปรและฟังก์ชันเป็นภาษาอังกฤษ

## ห้ามทำ

- ห้ามแก้หรืออ่านค่าใน `.env.local` ออกมาแสดง และห้าม commit ไฟล์นี้
- ห้ามติดตั้ง package ใหม่โดยไม่ถามก่อน
- ห้ามเพิ่มระบบล็อกอินใน Phase 1 (ล็อกอินมีเฉพาะ Phase 2 ตามที่ระบุใน @design.md) และห้ามเพิ่ม feature ที่ไม่ได้ขอ

## นิยามคำว่า "เสร็จ"

1. `npm run lint` และ `npm run build` ผ่าน
2. เปิด http://localhost:3000 แล้วลองกดตามที่ขอได้จริง
3. ตอบสรุปสั้น ๆ ว่าแก้ไฟล์อะไร ไม่ต้องอธิบายโค้ดทั้งไฟล์
