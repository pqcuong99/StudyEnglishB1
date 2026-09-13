# Cài API tiến độ (server/index.js) thành tác vụ chạy nền trên VPS Windows:
#   - tự chạy khi Windows khởi động (tài khoản SYSTEM), tự khởi động lại nếu lỗi
#   - mở cổng 37390 trên Windows Firewall
# Chạy bằng install-api.bat (Run as administrator). Cần cài Node.js trước.
$ErrorActionPreference = 'Stop'

$TaskName = 'StudyEnglishB1-API'
$Port = 37390
$Dir = $PSScriptRoot
$Script = Join-Path $Dir 'index.js'

$node = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $node) {
  Write-Host 'LOI: Khong tim thay node.exe. Cai Node.js (https://nodejs.org) roi chay lai.' -ForegroundColor Red
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
