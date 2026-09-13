# Cài API tiến độ (server/index.js) thành tác vụ chạy nền trên VPS Windows:
#   - tự chạy khi Windows khởi động, tự khởi động lại nếu lỗi
#   - mở cổng 37390 trên Windows Firewall
# Chạy bằng install-api.bat (Run as administrator). Cần cài Node.js trước.
# check-api.bat gọi file này với -CheckOnly: chỉ kiểm tra + chẩn đoán, không cài lại.
# restart-api.bat / update-vps.bat gọi với -RestartOnly: chỉ dừng sạch + chạy lại.
param([switch]$CheckOnly, [switch]$RestartOnly)

$ErrorActionPreference = 'Stop'

$TaskName = 'StudyEnglishB1-API'
$Port = 37390
$Dir = $PSScriptRoot
$Script = Join-Path $Dir 'index.js'
$Wrapper = Join-Path $Dir 'run-api.cmd' # tác vụ chạy qua file này để lỗi của node được ghi lại
$LogFile = Join-Path $Dir 'data\api.log'
$TaskLog = Join-Path $Dir 'data\task.log'
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

# PID đang nghe cổng $Port (Get-NetTCPConnection, dự phòng netstat cho Windows cũ)
function Get-PortOwners {
  $pids = @()
  try {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess
  } catch {
    foreach ($line in (netstat -ano | Select-String ":$Port\s")) {
      $parts = ($line.ToString() -split '\s+') | Where-Object { $_ }
      if ($parts.Count -ge 5 -and $parts[1] -match ":$Port$" -and $parts[-1] -match '^\d+$') { $pids += [int]$parts[-1] }
    }
  }
  return @($pids | Select-Object -Unique)
}

# Dừng sạch API: kết thúc tác vụ rồi kill tiến trình cũ còn giữ cổng (nếu không
# thì node mới sẽ EADDRINUSE và tiến trình cũ với code cũ vẫn phục vụ).
function Stop-Api {
  & schtasks /end /tn $TaskName > $null 2>&1
  Start-Sleep -Milliseconds 500
  $owners = Get-PortOwners
  foreach ($processId in $owners) {
    try {
      $p = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "  Dung tien trinh dang giu cong $Port : $($p.ProcessName) (PID $processId)"
      Stop-Process -Id $processId -Force -ErrorAction Stop
    } catch { }
  }
  # đợi cổng thực sự được nhả
  for ($i = 0; $i -lt 10; $i++) {
    if ((Get-PortOwners).Count -eq 0) { break }
    Start-Sleep -Milliseconds 500
  }
}

function Show-Tail([string]$File, [int]$Lines) {
  if (Test-Path $File) {
    Write-Host "  ($File - $Lines dong cuoi)"
    Get-Content $File -Tail $Lines | ForEach-Object { Write-Host "  $_" }
    return $true
  }
  Write-Host "  Chua co file $File" -ForegroundColor Yellow
  return $false
}

# Đăng ký tác vụ: cmd.exe /c run-api.cmd "<node.exe>" — Execute không có khoảng
# trắng, và mọi thứ node in ra stderr (kể cả lỗi không khởi động được) vào task.log.
function Register-ApiTask([string]$RunAs) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  $arg = "/c `"`"$Wrapper`" `"$node`"`""
  $action = New-ScheduledTaskAction -Execute $env:ComSpec -Argument $arg -WorkingDirectory $Dir
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
  # mặc định Windows tự dừng tác vụ sau 3 ngày -> bỏ giới hạn
  $settings.ExecutionTimeLimit = 'PT0S'

  if ($RunAs -eq 'SYSTEM') {
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
  } else {
    # S4U: chạy dưới tài khoản hiện tại kể cả khi không đăng nhập, không cần lưu mật khẩu
    $principal = New-ScheduledTaskPrincipal -UserId $RunAs -LogonType S4U -RunLevel Highest
  }
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Principal $principal -Force | Out-Null
}

# In mọi thứ cần biết khi API không phản hồi: trạng thái tác vụ, log, và chạy
# thử node trực tiếp vài giây để hiện lỗi (nếu có) ngay trên màn hình.
function Show-Diagnostics {
  Write-Host ''
  Write-Host '================ CHAN DOAN ================' -ForegroundColor Cyan
  try {
    $os = Get-WmiObject Win32_OperatingSystem
    Write-Host ("Windows: {0} ({1})" -f $os.Caption, $os.Version)
  } catch { }

  Write-Host '--- 1. Tac vu trong Task Scheduler ---'
  $t = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $t) {
    Write-Host "  Chua co tac vu '$TaskName' -> chay install-api.bat" -ForegroundColor Yellow
  } else {
    $i = $t | Get-ScheduledTaskInfo
    $code = [int64]$i.LastTaskResult
    $meaning = switch ($code) {
      0 { 'ket thuc binh thuong (API da bi dung?)' }
      1 { 'node.exe thoat voi loi -> xem task.log' }
      216 { 'Windows tu choi chay node.exe: "not compatible with the version of Windows" -> Node qua moi so voi Windows nay, cai Node 16' }
      267009 { 'dang chay' }
      267011 { 'chua tung chay' }
      267014 { 'bi dung boi nguoi dung / schtasks /end' }
      default { '' }
    }
    Write-Host ("  Trang thai: {0} | Tai khoan: {1} | Chay lan cuoi: {2}" -f $t.State, $t.Principal.UserId, $i.LastRunTime)
    Write-Host ("  Ma ket thuc: {0} (0x{0:X}) {1}" -f $code, $meaning)
    $act = $t.Actions[0]
    Write-Host ("  Lenh: {0} {1}" -f $act.Execute, $act.Arguments)
  }

  Write-Host '--- 2. Log khi chay qua tac vu (task.log) ---'
  $hasTaskLog = Show-Tail $TaskLog 12
  Write-Host '--- 3. Log cua API (api.log) ---'
  if (-not (Show-Tail $LogFile 10)) {
    Write-Host '  -> node chua bao gio chay toi buoc ghi log'
  }

  Write-Host '--- 4. Chay thu truc tiep node index.js trong 5 giay ---'
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

  Write-Host '--- KET LUAN ---' -ForegroundColor Cyan
  $incompatible = ($t -and [int64]($t | Get-ScheduledTaskInfo).LastTaskResult -eq 216) -or
    ($hasTaskLog -and (Select-String -Path $TaskLog -Pattern 'not compatible' -Quiet))
  if ($h -and $incompatible) {
    Write-Host '  node.exe chay duoc khi ban mo truc tiep nhung Windows tu choi khi chay nen' -ForegroundColor Yellow
    Write-Host '  ("not compatible with the version of Windows"). Ban Node nay qua moi so voi Windows cua VPS.'
    Write-Host '  CACH SUA: go Node hien tai, cai Node 16 LTS (chay tot tren Windows Server 2012 R2):' -ForegroundColor Green
    Write-Host '    https://nodejs.org/dist/latest-v16.x/  -> tai node-v16.20.2-x64.msi'
    Write-Host '  roi chay lai server\install-api.bat.'
  } elseif ($h) {
    Write-Host '  Chay truc tiep thi API TRA LOI BINH THUONG -> van de nam o tac vu.' -ForegroundColor Yellow
    Write-Host '  Xem task.log o muc 2; neu van khong ro, gui man hinh nay cho Claude.'
  } elseif (Test-Path $err) {
    if (Select-String -Path $err -Pattern 'EADDRINUSE' -Quiet) {
      Write-Host "  Cong $Port dang co tien trinh khac chiem (co the chinh la API dang chay)." -ForegroundColor Yellow
      Write-Host "  Mo trinh duyet tren VPS vao $HealthUrl de kiem tra."
    } else {
      Write-Host '  node index.js khong chay duoc; loi o muc 4 la nguyen nhan. Gui man hinh nay cho Claude.' -ForegroundColor Red
    }
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

if (-not (Test-Path $Wrapper)) {
  Write-Host "LOI: thieu file $Wrapper (chay update-vps.bat de keo ban moi)." -ForegroundColor Red
  exit 1
}

# Khởi động lại sạch: dừng tiến trình cũ (nhả cổng), chạy lại, KHÔNG cài lại tác vụ.
if ($RestartOnly) {
  Write-Host '=== Khoi dong lai API (dung sach tien trinh cu) ==='
  Stop-Api
  Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  $h = Wait-Health 10
  if ($h) {
    Write-Host "OK: API dang chay: $h" -ForegroundColor Green
  } else {
    Write-Host "API chua phan hoi tai $HealthUrl" -ForegroundColor Yellow
    Show-Diagnostics
    exit 1
  }
  exit 0
}

Write-Host "=== [1/3] Tao tac vu '$TaskName' (chay khi Windows khoi dong, tai khoan SYSTEM) ==="
Register-ApiTask 'SYSTEM'
# dừng tiến trình cũ (nếu có) để node mới không bị EADDRINUSE và phục vụ code cũ
Stop-Api

Write-Host "=== [2/3] Mo cong $Port tren Windows Firewall ==="
Remove-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $TaskName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null

Write-Host '=== [3/3] Khoi dong API ==='
Start-ScheduledTask -TaskName $TaskName
$h = Wait-Health 10

if (-not $h) {
  # SYSTEM không chạy được -> thử tài khoản đang đăng nhập (nơi node -v vừa chạy OK)
  $me = "$env:USERDOMAIN\$env:USERNAME"
  Write-Host "  SYSTEM khong khoi dong duoc API, thu lai bang tai khoan $me ..." -ForegroundColor Yellow
  Stop-Api
  Register-ApiTask $me
  Start-ScheduledTask -TaskName $TaskName
  $h = Wait-Health 10
}

if ($h) {
  $who = (Get-ScheduledTask -TaskName $TaskName).Principal.UserId
  Write-Host "OK: API dang chay (tai khoan $who): $h" -ForegroundColor Green
  Write-Host "Kiem tra tu ngoai: http://<ip-vps>:$Port/api/health   (log: $LogFile)"
} else {
  Write-Host "API chua phan hoi tai $HealthUrl" -ForegroundColor Yellow
  Show-Diagnostics
}
