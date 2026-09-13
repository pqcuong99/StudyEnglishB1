# Cho IIS chuyển tiếp /api/* của trang web sang API Node (localhost:37390) để
# API dùng chung cổng công khai với trang (VPS thường chỉ được mở một cổng).
# Chạy bằng install-proxy.bat (Run as administrator). Làm 3 việc:
#   1. cài IIS URL Rewrite 2.1 + Application Request Routing 3.0 (tự tải từ Microsoft)
#   2. bật chế độ proxy của ARR
#   3. thêm rule "StudyEnglishB1-API" cho site đang trỏ tới <repo>\dist — lưu trong
#      applicationHost.config, KHÔNG đụng web.config trong dist (để không vỡ site
#      nếu chưa cài URL Rewrite)
# Tham số -Site "Tên site" khi script không tự tìm được site.
# Nếu sau khi chạy cả trang trả 503 -> chạy fix-iis.bat.
param([string]$Site)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\iis-common.ps1"

if (-not (Test-Path $appcmd)) {
  Write-Host 'LOI: May nay khong co IIS (khong thay appcmd.exe).' -ForegroundColor Red
  exit 1
}

# ---------- 1. URL Rewrite + ARR ----------
Write-Host '=== [1/4] Kiem tra / cai URL Rewrite va ARR ==='
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]3072 } catch { } # TLS 1.2 cho download.microsoft.com
foreach ($m in $IisModules) {
  if (Test-ModuleInstalled $m) {
    Write-Host "  $($m.Name): da cai"
    continue
  }
  $dest = Join-Path $env:TEMP $m.File
  Write-Host "  $($m.Name): chua co -> tai $($m.Url)"
  $wc = New-Object System.Net.WebClient
  $wc.DownloadFile($m.Url, $dest)
  Write-Host "  cai dat (msiexec /qn) ..."
  $p = Start-Process msiexec.exe -ArgumentList "/i `"$dest`" /qn /norestart" -Wait -PassThru
  if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) {
    Write-Host "LOI: cai $($m.Name) that bai (msiexec exit $($p.ExitCode)). Thu cai tay file $dest" -ForegroundColor Red
    exit 1
  }
  if (-not (Test-ModuleInstalled $m)) {
    Write-Host "LOI: msiexec bao cai xong nhung IIS chua thay module $($m.Module). Thu cai tay file $dest roi chay lai." -ForegroundColor Red
    exit 1
  }
  Write-Host "  $($m.Name): cai xong"
}

# ---------- 2. bật proxy ----------
Write-Host '=== [2/4] Bat che do proxy cua ARR ==='
if (-not (Invoke-AppCmd @('set', 'config', '-section:system.webServer/proxy', '/enabled:True', '/commit:apphost'))) {
  Write-Host 'LOI: khong bat duoc proxy (ARR chua cai dung?).' -ForegroundColor Red
  exit 1
}

# ---------- 3. rule cho site ----------
Write-Host '=== [3/4] Them rule chuyen tiep /api cho site ==='
$target = Find-Site $Site
if (-not $target) {
  Write-Host '  Chay lai:  install-proxy.bat "Ten site"' -ForegroundColor Yellow
  exit 1
}
$sitePort = Get-SitePort $target
Write-Host ("  Site: {0}  (cong {1}, thu muc {2})" -f $target.Name, $sitePort, $target.physicalPath)

$sec = 'system.webServer/rewrite/rules'
Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/-[name='$RuleName']", '/commit:apphost') -Quiet | Out-Null # xóa rule cũ nếu có
$ok = (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/+[name='$RuleName',stopProcessing='True']", '/commit:apphost')) -and
      (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/[name='$RuleName'].match.url:^api/(.*)", '/commit:apphost')) -and
      (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/[name='$RuleName'].action.type:Rewrite", "/[name='$RuleName'].action.url:http://localhost:$ApiPort/api/{R:1}", '/commit:apphost'))
if (-not $ok) {
  Write-Host 'LOI: khong them duoc rule (xem thong bao cua appcmd o tren).' -ForegroundColor Red
  exit 1
}

# ---------- 4. kiểm tra ----------
Write-Host '=== [4/4] Kiem tra ==='
if (-not (Start-SiteAndCheck $target)) {
  Write-Host 'LOI: trang khong tra loi (503?) -> app pool bi dung vi module moi khong nap duoc. Chay server\fix-iis.bat.' -ForegroundColor Red
  exit 1
}
if (Test-ApiViaIis $target) {
  Write-Host "OK: IIS da chuyen tiep /api sang API. Tu ngoai: http://<ip-vps>:<cong cong khai>/api/health" -ForegroundColor Green
} else {
  Write-Host 'CHUA XONG: IIS chua chuyen tiep duoc /api. Gui man hinh nay cho Claude.' -ForegroundColor Red
  exit 1
}
