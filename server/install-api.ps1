# Cài API tiến độ (server/index.js) thành tác vụ chạy nền trên VPS Windows:
#   - tự chạy khi Windows khởi động (tài khoản SYSTEM), tự khởi động lại nếu lỗi
#   - mở cổng 37390 trên Windows Firewall
# Chạy bằng install-api.bat (Run as administrator). Cần cài Node.js trước.
$ErrorActionPreference = 'Stop'

$TaskName = 'StudyEnglishB1-API'
$Port = 37390
$Dir = $PSScriptRoot
$Script = Join-Path $Dir 'index.js'

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

$node = Find-Node
if (-not $node) {
  Write-Host 'LOI: Khong tim thay node.exe. Cai Node.js (https://nodejs.org) roi chay lai,' -ForegroundColor Red
  Write-Host '     hoac dat bien NODE_EXE=C:\duong\dan\node.exe truoc khi chay.' -ForegroundColor Red
  exit 1
}
# chạy thử để chắc node.exe hoạt động trên máy này (Node moi co the khong chay tren Windows cu)
try {
  $ver = & $node -v 2>&1
  if ($LASTEXITCODE -ne 0) { throw "node -v that bai: $ver" }
  Write-Host "Node $ver"
} catch {
  Write-Host "LOI: node.exe khong chay duoc tren may nay ($_)." -ForegroundColor Red
  Write-Host '     Windows Server 2012 R2 / 8.1 chi chay duoc Node 16 tro xuong: tai ban 16 LTS tai' -ForegroundColor Red
  Write-Host '     https://nodejs.org/dist/latest-v16.x/ (node-v16.x.x-x64.msi) roi chay lai.' -ForegroundColor Red
  exit 1
}
Write-Host "Node: $node"
Write-Host "Script: $Script"

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
Start-Sleep -Seconds 3
try {
  $health = Invoke-RestMethod "http://localhost:$Port/api/health"
  Write-Host "OK: API dang chay, $($health.users) nguoi dung. Kiem tra: http://localhost:$Port/api/health" -ForegroundColor Green
} catch {
  Write-Host "API chua phan hoi. Xem log: $Dir\data\api.log" -ForegroundColor Yellow
}
