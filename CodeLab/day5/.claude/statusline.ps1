#Requires -Version 5.1
<#
.SYNOPSIS
    Claude Code custom status line (PowerShell version)
.DESCRIPTION
    แปลงมาจาก statusline.sh (bash + jq)
    อ่าน JSON จาก stdin แล้วพิมพ์ status line 2 บรรทัด
.NOTES
    บันทึกไฟล์เป็น UTF-8 with BOM ถ้าใช้ Windows PowerShell 5.1
    (ถ้าใช้ PowerShell 7 / pwsh จะเป็น UTF-8 ไม่มี BOM ก็ได้)
#>

# ---------- 1) ตั้งค่า encoding ให้รองรับ block char และ emoji ----------
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # บาง host ตั้งค่าไม่ได้ ข้ามไป
}

# ---------- 2) อ่าน JSON จาก stdin ----------
$rawJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($rawJson)) { exit 0 }

try {
    $data = $rawJson | ConvertFrom-Json
} catch {
    exit 0
}

# ---------- 3) ฟังก์ชันช่วยอ่านค่าแบบปลอดภัย (แทน jq '// 0') ----------
function Get-Prop {
    param(
        $Object,
        [string]$Path,
        $Default = $null
    )
    $current = $Object
    foreach ($seg in $Path.Split('.')) {
        if ($null -eq $current) { return $Default }
        $prop = $current.PSObject.Properties[$seg]
        if ($null -eq $prop) { return $Default }
        $current = $prop.Value
    }
    if ($null -eq $current) { return $Default }
    return $current
}

$model      = Get-Prop $data 'model.display_name'            'unknown'
$dir        = Get-Prop $data 'workspace.current_dir'         (Get-Location).Path
$cost       = [double](Get-Prop $data 'cost.total_cost_usd'          0)
$pctRaw     = [double](Get-Prop $data 'context_window.used_percentage' 0)
$durationMs = [double](Get-Prop $data 'cost.total_duration_ms'       0)

# ตัดทศนิยมทิ้งเหมือน `cut -d. -f1`
$pct = [int][math]::Floor($pctRaw)
if ($pct -lt 0)   { $pct = 0 }
if ($pct -gt 100) { $pct = 100 }

# ---------- 4) ANSI color codes ----------
$ESC    = [char]27
$CYAN   = "${ESC}[36m"
$GREEN  = "${ESC}[32m"
$YELLOW = "${ESC}[33m"
$RED    = "${ESC}[31m"
$RESET  = "${ESC}[0m"

# ---------- 5) Progress bar ----------
if ($pct -ge 90) {
    $barColor = $RED
} elseif ($pct -ge 70) {
    $barColor = $YELLOW
} else {
    $barColor = $GREEN
}

$filled = [int][math]::Floor($pct / 10)
$empty  = 10 - $filled
$bar    = ('█' * $filled) + ('░' * $empty)

# ---------- 6) Duration ----------
$mins = [int][math]::Floor($durationMs / 60000)
$secs = [int][math]::Floor(($durationMs % 60000) / 1000)

# ---------- 7) Git branch ----------
$branch = ''
if (Get-Command git -ErrorAction SilentlyContinue) {
    if ($dir -and (Test-Path -LiteralPath $dir)) {
        $null = & git -C $dir rev-parse --git-dir 2>$null
        if ($LASTEXITCODE -eq 0) {
            $name = & git -C $dir branch --show-current 2>$null
            if ([string]::IsNullOrWhiteSpace($name)) {
                # fallback สำหรับ git เก่ากว่า 2.22 หรือสถานะ detached HEAD
                $name = & git -C $dir rev-parse --short HEAD 2>$null
            }
            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $branch = " | 🌿 $($name.Trim())"
            }
        }
    }
}

# ---------- 8) จัดรูปแบบและพิมพ์ผลลัพธ์ ----------
$dirName = if ($dir) { Split-Path -Path $dir -Leaf } else { '' }
$costFmt = '$' + $cost.ToString('F2', [System.Globalization.CultureInfo]::InvariantCulture)

Write-Output ("{0}[{1}]{2} 📁 {3}{4}" -f $CYAN, $model, $RESET, $dirName, $branch)
Write-Output ("{0}{1}{2} {3}% | {4}{5}{6} | ⏱️ {7}m {8}s" -f `
    $barColor, $bar, $RESET, $pct, $YELLOW, $costFmt, $RESET, $mins, $secs)