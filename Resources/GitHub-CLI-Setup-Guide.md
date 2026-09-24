# คู่มือเชื่อมต่อ GitHub ด้วย GitHub CLI (`gh`) สำหรับ Claude Code

คู่มือนี้ช่วยให้เครื่องของคุณเชื่อมต่อ GitHub ได้ เพื่อให้ Claude Code (หรือตัวคุณเอง) สั่ง push, pull, สร้าง repo, เปิด Pull Request และจัดการ Issue ได้จาก Terminal

เมื่อทำครบทุกขั้นตอน ผลลัพธ์ที่ได้จะเป็นแบบนี้:

```
$ gh auth status
github.com
  ✓ Logged in to github.com account <your-username>
  - Active account: true
  - Git operations protocol: https
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

---

## สิ่งที่ต้องมีก่อนเริ่ม

- บัญชี GitHub (สมัครฟรีได้ที่ <https://github.com/signup>)
- สิทธิ์ติดตั้งโปรแกรมบนเครื่อง
- ติดตั้ง Claude Code แล้ว (ถ้าต้องการให้ Claude ใช้ `gh` ได้)

---

## ภาพรวมขั้นตอน

| ขั้นตอน | สิ่งที่ทำ |
| --- | --- |
| 1 | ติดตั้ง Git |
| 2 | ตั้งชื่อและอีเมลให้ Git |
| 3 | ติดตั้ง GitHub CLI (`gh`) |
| 4 | ล็อกอิน GitHub ผ่าน `gh auth login` |
| 5 | ตรวจสอบการเชื่อมต่อ |
| 6 | (ทางเลือก) เพิ่มสิทธิ์พิเศษ เช่น ลบ repo |
| 7 | ทดลองใช้งานจริง |

---

# 🍎 macOS / 🐧 Linux

### ขั้นตอนที่ 1 — ติดตั้ง Git

**macOS** (ใช้ [Homebrew](https://brew.sh)):

```bash
# ถ้ายังไม่มี Homebrew ให้ติดตั้งก่อน
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install git
```

**Linux (Ubuntu / Debian):**

```bash
sudo apt update
sudo apt install -y git
```

**Linux (Fedora / RHEL):**

```bash
sudo dnf install -y git
```

ตรวจสอบ:

```bash
git --version
```

### ขั้นตอนที่ 2 — ตั้งชื่อและอีเมลให้ Git

ชื่อและอีเมลนี้จะแสดงอยู่ในทุก commit ควรใช้อีเมลเดียวกับบัญชี GitHub

```bash
git config --global user.name "ชื่อ นามสกุล"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

### ขั้นตอนที่ 3 — ติดตั้ง GitHub CLI (`gh`)

**macOS:**

```bash
brew install gh
```

**Linux (Ubuntu / Debian):**

```bash
(type -p wget >/dev/null || (sudo apt update && sudo apt install -y wget)) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
     | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install -y gh
```

**Linux (Fedora / RHEL):**

```bash
sudo dnf install -y 'dnf-command(config-manager)'
sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
sudo dnf install -y gh
```

> วิธีติดตั้งสำหรับ distro อื่นดูได้ที่ <https://github.com/cli/cli/blob/trunk/docs/install_linux.md>

ตรวจสอบ:

```bash
gh --version
```

### ขั้นตอนที่ 4 — ล็อกอิน GitHub

```bash
gh auth login
```

ตอบคำถามตามนี้:

```
? Where do you use GitHub?                     → GitHub.com
? What is your preferred protocol for Git?     → HTTPS
? Authenticate Git with your GitHub credentials? → Yes
? How would you like to authenticate GitHub CLI? → Login with a web browser
```

จากนั้น:

1. Terminal จะแสดง **one-time code** เช่น `ABCD-1234` ให้คัดลอกไว้
2. กด **Enter** แล้วเบราว์เซอร์จะเปิดหน้า <https://github.com/login/device>
3. วางโค้ด แล้วกด **Authorize GitHub CLI**
4. กลับมาที่ Terminal จะเห็น `✓ Logged in as <username>`

> 💡 การตอบ **Yes** ในข้อ "Authenticate Git with your GitHub credentials" จะรัน `gh auth setup-git` ให้อัตโนมัติ ทำให้ใช้ `git push` / `git pull` ได้ทันทีโดยไม่ต้องใส่รหัสผ่าน

### ขั้นตอนที่ 5 — ตรวจสอบการเชื่อมต่อ

```bash
gh auth status
```

ถ้าเห็น `✓ Logged in to github.com` และ Token scopes มี `repo` กับ `workflow` แปลว่าพร้อมใช้งาน

### ขั้นตอนที่ 6 — (ทางเลือก) เพิ่มสิทธิ์พิเศษ

สิทธิ์เริ่มต้นยังลบ repo ไม่ได้ ถ้าต้องการให้ลบได้:

```bash
gh auth refresh -h github.com -s delete_repo
```

สิทธิ์อื่นที่อาจต้องใช้:

| Scope | ใช้ทำอะไร |
| --- | --- |
| `delete_repo` | ลบ repository |
| `admin:org` | จัดการ Organization |
| `project` | จัดการ GitHub Projects |
| `read:packages` / `write:packages` | ใช้ GitHub Packages / Container Registry |

### ขั้นตอนที่ 7 — ทดลองใช้งานจริง

```bash
# ดูข้อมูลบัญชี
gh api user --jq .login

# สร้าง repo ใหม่จากโฟลเดอร์ปัจจุบันแล้ว push ขึ้นไป
mkdir my-first-repo && cd my-first-repo
git init
echo "# My First Repo" > README.md
git add . && git commit -m "first commit"
gh repo create my-first-repo --private --source=. --push

# เปิด repo ในเบราว์เซอร์
gh repo view --web
```

---

# 🪟 Windows

> แนะนำให้ใช้ **PowerShell** หรือ **Windows Terminal** และรันทุกคำสั่งในหน้าต่างใหม่หลังติดตั้งโปรแกรมแต่ละตัว เพื่อให้ PATH อัปเดต

### ขั้นตอนที่ 1 — ติดตั้ง Git

**วิธีที่ 1 — ใช้ winget (แนะนำ, มีใน Windows 10/11 อยู่แล้ว):**

```powershell
winget install --id Git.Git -e --source winget
```

**วิธีที่ 2 — ดาวน์โหลดตัวติดตั้ง:**
ไปที่ <https://git-scm.com/download/win> แล้วติดตั้งด้วยค่าเริ่มต้น (กด Next ไปจนจบ)

ปิดแล้วเปิด PowerShell ใหม่ จากนั้นตรวจสอบ:

```powershell
git --version
```

### ขั้นตอนที่ 2 — ตั้งชื่อและอีเมลให้ Git

```powershell
git config --global user.name "ชื่อ นามสกุล"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global core.autocrlf true
```

> `core.autocrlf true` ช่วยจัดการเรื่องการขึ้นบรรทัดใหม่ (CRLF/LF) ระหว่าง Windows กับ macOS/Linux ไม่ให้ไฟล์ขึ้นว่าถูกแก้ไขทั้งไฟล์

### ขั้นตอนที่ 3 — ติดตั้ง GitHub CLI (`gh`)

**winget (แนะนำ):**

```powershell
winget install --id GitHub.cli -e
```

**ทางเลือกอื่น:**

```powershell
# Scoop
scoop install gh

# Chocolatey (เปิด PowerShell แบบ Run as Administrator)
choco install gh
```

หรือดาวน์โหลดไฟล์ `.msi` ได้จาก <https://github.com/cli/cli/releases/latest>

ปิดแล้วเปิด PowerShell ใหม่ จากนั้นตรวจสอบ:

```powershell
gh --version
```

### ขั้นตอนที่ 4 — ล็อกอิน GitHub

```powershell
gh auth login
```

ตอบคำถามเหมือนฝั่ง macOS/Linux:

```
? Where do you use GitHub?                     → GitHub.com
? What is your preferred protocol for Git?     → HTTPS
? Authenticate Git with your GitHub credentials? → Yes
? How would you like to authenticate GitHub CLI? → Login with a web browser
```

1. คัดลอก **one-time code** ที่แสดงบนจอ
2. กด **Enter** เพื่อเปิดเบราว์เซอร์
3. วางโค้ด แล้วกด **Authorize GitHub CLI**
4. กลับมาที่ PowerShell จะเห็น `✓ Logged in as <username>`

### ขั้นตอนที่ 5 — ตรวจสอบการเชื่อมต่อ

```powershell
gh auth status
```

### ขั้นตอนที่ 6 — (ทางเลือก) เพิ่มสิทธิ์พิเศษ

```powershell
gh auth refresh -h github.com -s delete_repo
```

### ขั้นตอนที่ 7 — ทดลองใช้งานจริง

```powershell
gh api user --jq .login

mkdir my-first-repo; cd my-first-repo
git init
"# My First Repo" | Out-File -Encoding utf8 README.md
git add .; git commit -m "first commit"
gh repo create my-first-repo --private --source=. --push

gh repo view --web
```

---

## 🤖 ใช้งานร่วมกับ Claude Code

เมื่อ `gh auth status` ขึ้นว่าล็อกอินแล้ว Claude Code จะเรียกใช้ `gh` และ `git` ผ่าน Bash tool ได้ทันที ไม่ต้องตั้งค่าเพิ่ม ลองพิมพ์ใน Claude Code ได้เลย เช่น

- `ตอนนี้ใช้ gh จัดการ GitHub ได้หรือยัง`
- `สร้าง repo ชื่อ demo-app แบบ private แล้ว push โค้ดขึ้นไป`
- `commit งานที่แก้แล้วเปิด Pull Request ให้หน่อย`
- `ดู Issue ที่เปิดอยู่ใน repo นี้`

> 💡 ถ้าต้องการรันคำสั่งที่ต้องโต้ตอบ (เช่น `gh auth login`) จากใน Claude Code ให้พิมพ์ `!` นำหน้า เช่น `! gh auth login` แล้วคำสั่งจะรันในเซสชันนั้นเลย

### (ทางเลือก) อนุญาตคำสั่ง `gh` ล่วงหน้าเพื่อลดการถามสิทธิ์

เพิ่มใน `.claude/settings.json` ของโปรเจ็กต์:

```json
{
  "permissions": {
    "allow": [
      "Bash(gh auth status)",
      "Bash(gh repo view:*)",
      "Bash(gh pr list:*)",
      "Bash(gh pr view:*)",
      "Bash(gh issue list:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ]
  }
}
```

> ⚠️ แนะนำให้ allow เฉพาะคำสั่งที่อ่านข้อมูลอย่างเดียว ส่วนคำสั่งที่เปลี่ยนแปลงข้อมูล เช่น `git push`, `gh repo create`, `gh repo delete` ควรให้ Claude ถามยืนยันทุกครั้ง

---

## 🔄 การอัปเดต `gh` ให้เป็นเวอร์ชันล่าสุด

| ระบบ | คำสั่ง |
| --- | --- |
| macOS (Homebrew) | `brew upgrade gh` |
| Ubuntu / Debian | `sudo apt update && sudo apt install --only-upgrade gh` |
| Fedora / RHEL | `sudo dnf upgrade gh` |
| Windows (winget) | `winget upgrade --id GitHub.cli` |
| Windows (Scoop) | `scoop update gh` |
| Windows (Chocolatey) | `choco upgrade gh` |

การอัปเดตไม่ทำให้หลุดล็อกอิน ตรวจสอบด้วย `gh --version` และ `gh auth status`

---

## 🛠️ ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `gh: command not found` / `'gh' is not recognized` | ยังไม่ได้เปิด Terminal ใหม่หลังติดตั้ง ให้ปิดแล้วเปิดใหม่ ถ้ายังไม่หายให้ตรวจ PATH |
| `git push` ถามรหัสผ่าน | รัน `gh auth setup-git` เพื่อให้ Git ใช้ credential ของ `gh` |
| `HTTP 403` / `Resource not accessible` | Token ไม่มีสิทธิ์พอ ใช้ `gh auth refresh -s <scope>` เพิ่มสิทธิ์ |
| `HTTP 403 ... delete_repo scope` ตอนลบ repo | รัน `gh auth refresh -h github.com -s delete_repo` |
| ใช้หลายบัญชี GitHub | `gh auth login` เพิ่มบัญชี แล้วสลับด้วย `gh auth switch` |
| อยู่หลัง Proxy ขององค์กร | ตั้งค่า `HTTPS_PROXY=http://proxy:port` ก่อนรัน `gh` |
| ต้องการออกจากระบบ | `gh auth logout` |
| Windows: ไฟล์ขึ้นว่าถูกแก้ทั้งไฟล์ | ตั้ง `git config --global core.autocrlf true` |

---

## 📋 Checklist สรุป

- [ ] `git --version` แสดงเวอร์ชันได้
- [ ] `git config --global user.name` และ `user.email` ตั้งค่าแล้ว
- [ ] `gh --version` แสดงเวอร์ชันได้
- [ ] `gh auth status` ขึ้น `✓ Logged in`
- [ ] Token scopes มี `repo` และ `workflow`
- [ ] ทดลอง `gh repo create ... --push` สำเร็จ

## 🔗 แหล่งข้อมูลเพิ่มเติม

- GitHub CLI Manual: <https://cli.github.com/manual/>
- วิธีติดตั้ง gh ทุกระบบ: <https://github.com/cli/cli#installation>
- Git ดาวน์โหลด: <https://git-scm.com/downloads>
