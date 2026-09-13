# Khôi phục site IIS khi cài URL Rewrite / ARR xong mà cả trang trả 503 (app pool
# bị IIS tự tắt vì worker process không nạp được module mới). Chạy bằng
# fix-iis.bat (Run as administrator):
#   1. đọc Event Log xem module nào không nạp được
#   2. gỡ tạm module đó khỏi IIS, bật lại app pool -> trang lên lại ngay
#   3. nếu máy thiếu Universal CRT (rewrite.dll bản mới cần) -> cài VC++ Redistributable
#      (kèm UCRT), gắn lại module, kiểm tra /api qua IIS
param([string]$Site)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\iis-common.ps1"

$VcRedistUrl = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
$UcrtFiles = @((Join-Path $env:windir 'System32\ucrtbase.dll'), (Join-Path $env:windir 'System32\api-ms-win-crt-runtime-l1-1-0.dll'))

function Test-Ucrt { foreach ($f in $UcrtFiles) { if (-not (Test-Path $f)) { return $false } }; return $true }

if (-not (Test-Path $appcmd)) {
  Write-Host 'LOI: May nay khong co IIS.' -ForegroundColor Red
  exit 1
}
$target = Find-Site $Site
if (-not $target) {
  Write-Host '  Chay lai:  fix-iis.bat "Ten site"' -ForegroundColor Yellow
  exit 1
}
Write-Host ("Site: {0}  (cong {1}, app pool {2})" -f $target.Name, (Get-SitePort $target), $target.applicationPool)
Write-Host ("Universal CRT (ucrtbase.dll): {0}" -f $(if (Test-Ucrt) { 'co' } else { 'THIEU' }))

# ---------- 1. event log ----------
Write-Host '=== [1/4] Su kien loi cua IIS trong 24 gio qua ==='
$since = (Get-Date).AddHours(-24)
$failedDlls = @()
try {
  $app = Get-EventLog -LogName Application -After $since -EntryType Error, Warning -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -like '*W3SVC*' } | Select-Object -First 6
  $sys = Get-EventLog -LogName System -After $since -EntryType Error, Warning -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -like '*WAS*' } | Select-Object -First 4
  foreach ($e in @($app) + @($sys)) {
    if (-not $e) { continue }
    $msg = ($e.Message -replace '\s+', ' ')
    if ($msg.Length -gt 220) { $msg = $msg.Substring(0, 220) + '...' }
    Write-Host ("  [{0}] {1} #{2}: {3}" -f $e.TimeGenerated.ToString('HH:mm:ss'), $e.Source, $e.EventID, $msg)
    if ($e.Message -match 'Module DLL\s+(.+?\.dll)\s+failed to load') { $failedDlls += $Matches[1] }
  }
} catch {
  Write-Host "  (khong doc duoc Event Log: $($_.Exception.Message))" -ForegroundColor Yellow
}
$failedDlls = @($failedDlls | Select-Object -Unique)
if ($failedDlls.Count -eq 0 -and -not (Test-Ucrt)) {
  # không thấy sự kiện nhưng thiếu UCRT -> rewrite.dll chắc chắn không nạp được
  $failedDlls = @((Join-Path $inetsrv 'rewrite.dll'))
  Write-Host '  Khong thay su kien "Module DLL failed to load", nhung may THIEU Universal CRT -> coi nhu rewrite.dll khong nap duoc.' -ForegroundColor Yellow
}
if ($failedDlls.Count -gt 0) { Write-Host ("  Module khong nap duoc: " + ($failedDlls -join ', ')) -ForegroundColor Yellow }
else { Write-Host '  Khong thay module nao bao loi nap.' }

# ---------- 2. gỡ tạm module lỗi, bật lại pool ----------
Write-Host '=== [2/4] Dua trang len lai ==='
# danh sách <add name="..." image="..." preCondition="..."> trong globalModules
$gm = Get-ConfigSection 'system.webServer/globalModules'
$entries = @()
foreach ($mt in [regex]::Matches($gm, '<add\s+([^>]*?)/?>')) {
  $attrs = @{}
  foreach ($a in [regex]::Matches($mt.Groups[1].Value, '(\w+)="([^"]*)"')) { $attrs[$a.Groups[1].Value] = $a.Groups[2].Value }
  if ($attrs.name -and $attrs.image) { $entries += $attrs }
}
$removed = @()
function Remove-IisModule($entry) {
  Write-Host "  Go tam module '$($entry.name)' ($($entry.image))"
  Invoke-AppCmd @('set', 'config', '-section:system.webServer/globalModules', "/-[name='$($entry.name)']", '/commit:apphost') -Quiet | Out-Null
  Invoke-AppCmd @('set', 'config', '-section:system.webServer/modules', "/-[name='$($entry.name)']", '/commit:apphost') -Quiet | Out-Null
  $script:removed += $entry
}
function Restore-IisModule($entry) {
  Write-Host "  Gan lai module '$($entry.name)'"
  $add = "/+[name='$($entry.name)',image='$($entry.image)'"
  if ($entry.preCondition) { $add += ",preCondition='$($entry.preCondition)'" }
  $add += ']'
  Invoke-AppCmd @('set', 'config', '-section:system.webServer/globalModules', $add, '/commit:apphost') -Quiet | Out-Null
  Invoke-AppCmd @('set', 'config', '-section:system.webServer/modules', "/+[name='$($entry.name)']", '/commit:apphost') -Quiet | Out-Null
}

foreach ($dll in $failedDlls) {
  $e = $entries | Where-Object { [Environment]::ExpandEnvironmentVariables($_.image) -ieq $dll } | Select-Object -First 1
  if ($e) { Remove-IisModule $e } else { Write-Host "  (khong thay module nao dung file $dll trong globalModules)" }
}
$siteOk = Start-SiteAndCheck $target
if (-not $siteOk) {
  # vẫn chưa lên: gỡ nốt các module proxy còn lại (RewriteModule, ApplicationRequestRouting)
  foreach ($m in $IisModules) {
    $e = $entries | Where-Object { $_.name -eq $m.Module -and -not ($removed | Where-Object { $_.name -eq $m.Module }) } | Select-Object -First 1
    if ($e) { Remove-IisModule $e }
  }
  if ($removed.Count -gt 0) { $siteOk = Start-SiteAndCheck $target }
}
if (-not $siteOk) {
  Write-Host 'LOI: trang van chua len du da go module. Gui man hinh nay cho Claude.' -ForegroundColor Red
  Write-Host ("  Trang thai app pool: " + (Get-WebAppPoolState $target.applicationPool).Value)
  exit 1
}
Write-Host '  TRANG DA LEN LAI.' -ForegroundColor Green
if ($removed.Count -eq 0) {
  Write-Host '  (khong phai go module nao - app pool chi bi dung; /api qua IIS se kiem tra o buoc 4)'
}

# ---------- 3. cài UCRT nếu thiếu ----------
Write-Host '=== [3/4] Universal CRT ==='
if (Test-Ucrt) {
  Write-Host '  Da co.'
} else {
  Write-Host "  Thieu -> tai va cai Visual C++ Redistributable (kem UCRT): $VcRedistUrl"
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]3072 } catch { }
  $exe = Join-Path $env:TEMP 'vc_redist.x64.exe'
  try {
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($VcRedistUrl, $exe)
    $p = Start-Process $exe -ArgumentList '/install /quiet /norestart' -Wait -PassThru
    Write-Host "  vc_redist exit code: $($p.ExitCode)  (0 = xong, 3010 = xong nhung can khoi dong lai, 1638 = da co)"
  } catch {
    Write-Host "  Khong cai duoc: $($_.Exception.Message)" -ForegroundColor Yellow
  }
  if (Test-Ucrt) {
    Write-Host '  UCRT da co.' -ForegroundColor Green
  } else {
    Write-Host '  Van thieu UCRT. Cach khac: cai ban va KB2999226 cho Windows Server 2012 R2 (x64) tu' -ForegroundColor Yellow
    Write-Host '  https://www.catalog.update.microsoft.com/Search.aspx?q=KB2999226 (can KB2919355 truoc), roi chay lai fix-iis.bat.' -ForegroundColor Yellow
  }
}

# ---------- 4. gắn lại module và kiểm tra /api ----------
Write-Host '=== [4/4] Gan lai module va kiem tra /api qua IIS ==='
if ($removed.Count -gt 0) {
  if (-not (Test-Ucrt)) {
    Write-Host '  Chua co UCRT nen chua gan lai module (trang van chay binh thuong, chi /api chua di qua IIS).' -ForegroundColor Yellow
    exit 1
  }
  foreach ($e in $removed) { Restore-IisModule $e }
  Restart-WebAppPool $target.applicationPool
  Start-Sleep -Seconds 2
  if (-not (Start-SiteAndCheck $target)) {
    Write-Host '  Gan lai thi trang lai loi -> go ra lan nua de trang chay.' -ForegroundColor Yellow
    $again = $removed; $removed = @()
    foreach ($e in $again) { Remove-IisModule $e }
    Start-SiteAndCheck $target | Out-Null
    Write-Host 'LOI: module van khong nap duoc du da co UCRT. Gui man hinh nay cho Claude.' -ForegroundColor Red
    exit 1
  }
}
if (Test-ApiViaIis $target) {
  Write-Host "OK: trang chay va IIS da chuyen tiep /api. Tu ngoai: http://<ip-vps>:<cong>/api/health" -ForegroundColor Green
} else {
  Write-Host 'Trang chay nhung /api chua di qua IIS. Chay lai server\install-proxy.bat; neu van loi, gui man hinh cho Claude.' -ForegroundColor Yellow
  exit 1
}
