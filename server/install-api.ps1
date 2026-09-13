# Cài API tiến độ (server/index.js) thành tác vụ chạy nền trên VPS Windows:
#   - tự chạy khi Windows khởi động (tài khoản SYSTEM), tự khởi động lại nếu lỗi
#   - mở cổng 37390 trên Windows Firewall
# Chạy bằng install-api.bat (Run as administrator). Cần cài Node.js trước.
# check-api.bat gọi file này với -CheckOnly: chỉ kiểm tra + chẩn đoán, không cài lại.
param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'

$TaskName = 'StudyEnglishB1-API'
$Port = 37390
$Dir = $PSScriptRoot
$Script = Join-Path $Dir 'index.js'
$LogFile = Join-Path $Dir 'data\api.log'
$HealthUrl = "http://localhost:$Port/api/health"

# Tìm node.exe: theo PATH của cửa sổ hiện tại (dùng .Path vì .Source chỉ có từ
# PowerShell 5, Server 2012 R2 là PS 4), rồi các thư mục cài mặc định, rồi PATH
# của máy trong registry (cửa sổ mở trước khi cài Node thì PATH chưa cập nhật).
function Find-Node {
  if ($env:NODE_EXE -and (Test-Path $env:NODE_EXE)) { return $env:NODE_EXE }
  $cmd = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd -and $cmd.Path) { return $cmd.Path }
  $dirs = @()
  if ($env:ProgramFiles) { $dirs += (Join-Path $env:ProgramFiles 'nodejs') }
  if (${env:ProgramFiles(x86)}) { $dirs += (Join-Path ${env:ProgramFiles(x86)} 'nodejs') }
  if ($env:LOCALAPPDATA) { $dirs += (Join-Path $env:LOCALAPPDATA 'Programs\nodejs') }
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  if ($machinePath) { $dirs += ($machinePath -split ';' | Where-Object { $_ -and $_.Trim() }) }
  foreach ($d in $dirs) {
    $p = Join-Path $d.Trim() 'node.exe'
    if (Test-Path $p) { return $p }
  }
  return $null
}

# Gọi /api/health bằng WebClient (không dùng Invoke-WebRequest vì trên Windows
# Server hay lỗi "IE first-launch configuration"). Trả về chuỗi JSON hoặc $null.
function Get-Health {
  try {
    $wc = New-Object System.Net.WebClient
    $wc.Proxy = $null
    return $wc.DownloadString($HealthUrl)
  } catch {
    return $null
  }
}

function Wait-Health([int]$Seconds) {
  for ($i = 0; $i -lt $Seconds; $i++) {
    $h = Get-Health
    if ($h) { return $h }
    Start-Sleep -Seconds 1
  }
  return $null
}

# In mọi thứ cần biết khi API không phản hồi: trạng thái tác vụ, log, và chạy
# thử node trực tiếp vài giây để hiện lỗi (nếu có) ngay trên màn hình.
function Show-Diagnostics {
  Write-Host ''
  Write-Host '================ CHAN DOAN ================' -ForegroundColor Cyan
  Write-Host '--- 1. Tac vu trong Task Scheduler ---'
  $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $t) {
    Write-Host "  Chua co tac vu '$TaskName' -> chay install-api.bat" -ForegroundColor Yellow
  } else {
    $i = $t | Get-ScheduledTaskInfo
    $code = [int64]$i.LastTaskResult
    $meaning = switch ($code) {
      0 { 'ket thuc binh thuong (API da bi dung?)' }
      1 { 'node.exe thoat voi loi -> xem phan chay thu ben duoi' }
      267009 { 'dang chay' }
      267011 { 'chua tung chay' }
      267014 { 'bi dung boi nguoi dung / schtasks /end' }
      default { '' }
    }
    Write-Host ("  Trang thai: {0} | Chay lan cuoi: {1} | Ma ket thuc: {2} (0x{2:X}) {3}" -f $t.State, $i.LastRunTime, $code, $meaning)
    $act = $t.Actions[0]
    Write-Host ("  Lenh: {0} {1}" -f $act.Execute, $act.Arguments)
  }

  Write-Host '--- 2. Log cua API ---'
  if (Test-Path $LogFile) {
    Write-Host "  ($LogFile - 15 dong cuoi)"
    Get-Content $LogFile -Tail 15 | ForEach-Object { Write-Host "  $_" }
  } else {
    Write-Host "  Chua co file $LogFile" -ForegroundColor Yellow
    Write-Host '  -> node chua bao gio chay toi buoc ghi log (loi ngay khi khoi dong, hoac tac vu khong chay duoc)'
  }

  Write-Host '--- 3. Chay thu truc tiep node index.js trong 5 giay ---'
  $out = Join-Path $env:TEMP 'studyenglish-api-out.txt'
  $err = Join-Path $env:TEMP 'studyenglish-api-err.txt'
  Remove-Item $out, $err -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath $node -ArgumentList "`"$Script`"" -WorkingDirectory $Dir -NoNewWindow -PassThru `
    -RedirectStandardOutput $out -RedirectStandardError $err
  $h = Wait-Health 5
  if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 300
  foreach ($f in @($out, $err)) {
    if ((Test-Path $f) -and (Get-Item $f).Length -gt 0) { Get-Content $f | ForEach-Object { Write-Host "  $_" } }
  }
  if ($h) {
    Write-Host '  => Chay truc tiep thi API TRA LOI BINH THUONG.' -ForegroundColor Green
    Write-Host '     Van de nam o tac vu (khong khoi dong duoc node duoi tai khoan SYSTEM).'
    Write-Host '     Thu: schtasks /run /tn StudyEnglishB1-API  roi mo lai check-api.bat;'
    Write-Host '     hoac gui man hinh nay cho Claude.'
  } elseif (Select-String -Path $err -Pattern 'EADDRINUSE' -Quiet -ErrorAction SilentlyContinue) {
    Write-Host "  => Cong $Port dang co tien trinh khac chiem (co the chinh la API dang chay)." -ForegroundColor Yellow
    Write-Host "     Mo trinh duyet tren VPS vao $HealthUrl de kiem tra."
  } else {
    Write-Host '  => node index.js khong chay duoc; loi o tren la nguyen nhan. Gui man hinh nay cho Claude.' -ForegroundColor Red
  }
  Write-Host '==========================================' -ForegroundColor Cyan
}

$node = Find-Node
if (-not $node) {
  Write-Host 'LOI: Khong tim thay node.exe. Cai Node.js (https://nodejs.org) roi chay lai,' -ForegroundColor Red
  Write-Host '     hoac dat bien NODE_EXE=C:\duong\dan\node.exe truoc khi chay.' -ForegroundColor Red
  exit 1
}
# chạy thử để chắc node.exe hoạt động trên máy này (Node mới có thể không chạy trên Windows cũ)
try {
  $ver = & $node -v 2>&1
  if ($LASTEXITCODE -ne 0) { throw "node -v that bai: $ver" }
  Write-Host "Node $ver"
} catch {
  Write-Host "LOI: node.exe khong chay duoc tren may nay ($_)." -ForegroundColor Red
  Write-Host '     Thu cai ban Node 16 LTS: https://nodejs.org/dist/latest-v16.x/ (node-v16.x.x-x64.msi).' -ForegroundColor Red
  exit 1
}
Write-Host "Node: $node"
Write-Host "Script: $Script"

if ($CheckOnly) {
  $h = Get-Health
  if ($h) {
    Write-Host "OK: API dang chay: $h" -ForegroundColor Green
    Write-Host "Kiem tra tu ngoai: http://<ip-vps>:$Port/api/health"
  } else {
    Write-Host "API khong phan hoi tai $HealthUrl" -ForegroundColor Yellow
    Show-Diagnostics
  }
  exit 0
}

Write-Host "=== [1/3] Tao tac vu '$TaskName' (chay khi Windows khoi dong) ==="
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$Script`"" -WorkingDirectory $Dir
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
# mặc định Windows tự dừng tác vụ sau 3 ngày -> bỏ giới hạn
$settings.ExecutionTimeLimit = 'PT0S'

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -User 'SYSTEM' -RunLevel Highest -Force | Out-Null

Write-Host "=== [2/3] Mo cong $Port tren Windows Firewall ==="
Remove-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $TaskName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null

Write-Host '=== [3/3] Khoi dong API ==='
Start-ScheduledTask -TaskName $TaskName
$h = Wait-Health 10
if ($h) {
  Write-Host "OK: API dang chay: $h" -ForegroundColor Green
  Write-Host "Kiem tra tu ngoai: http://<ip-vps>:$Port/api/health   (log: $LogFile)"
} else {
  Write-Host "API chua phan hoi sau 10 giay tai $HealthUrl" -ForegroundColor Yellow
  Show-Diagnostics
}
