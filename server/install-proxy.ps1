# Cho IIS chuyển tiếp /api/* của trang web sang API Node (localhost:37390) để
# API dùng chung cổng công khai với trang (VPS thường chỉ được mở một cổng).
# Chạy bằng install-proxy.bat (Run as administrator). Làm 3 việc:
#   1. cài IIS URL Rewrite 2.1 + Application Request Routing 3.0 (tự tải từ Microsoft)
#   2. bật chế độ proxy của ARR
#   3. thêm rule "StudyEnglishB1-API" cho site đang trỏ tới <repo>\dist — lưu trong
#      applicationHost.config, KHÔNG đụng web.config trong dist (để không vỡ site
#      nếu chưa cài URL Rewrite)
# Tham số -Site "Tên site" khi script không tự tìm được site.
param([string]$Site)

$ErrorActionPreference = 'Stop'

$ApiPort = 37390
$RuleName = 'StudyEnglishB1-API'
$Dir = $PSScriptRoot
$DistPath = [System.IO.Path]::GetFullPath((Join-Path $Dir '..\dist')).TrimEnd('\')
$inetsrv = Join-Path $env:windir 'System32\inetsrv'
$appcmd = Join-Path $inetsrv 'appcmd.exe'

# Module: tên đăng ký trong globalModules của IIS + các vị trí file dll có thể có
$Modules = @(
  @{ Name = 'IIS URL Rewrite 2.1'; Module = 'RewriteModule'; File = 'rewrite_amd64_en-US.msi'
     Dlls = @((Join-Path $inetsrv 'rewrite.dll'))
     Url = 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi' },
  @{ Name = 'IIS Application Request Routing 3.0'; Module = 'ApplicationRequestRouting'; File = 'requestRouter_amd64.msi'
     Dlls = @((Join-Path $env:ProgramFiles 'IIS\Application Request Routing\requestRouter.dll'), (Join-Path $inetsrv 'requestRouter.dll'))
     Url = 'https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi' }
)

# Đã cài chưa: có trong danh sách globalModules của IIS, hoặc thấy file dll
function Test-ModuleInstalled($m) {
  $list = ''
  try { $list = (& $appcmd list config -section:system.webServer/globalModules | Out-String) } catch { $list = '' }
  if ($list -match ('name="' + [regex]::Escape($m.Module) + '"')) { return $true }
  foreach ($d in $m.Dlls) { if (Test-Path $d) { return $true } }
  return $false
}

function Invoke-AppCmd {
  # chạy appcmd, in lệnh + kết quả; trả về $true nếu thành công
  param([string[]]$ArgList)
  Write-Host ("  > appcmd " + ($ArgList -join ' '))
  $out = & $appcmd @ArgList
  $ok = ($LASTEXITCODE -eq 0)
  if ($out) { $out | ForEach-Object { Write-Host "    $_" } }
  return $ok
}

function Get-Url([string]$Url, [string]$Method = 'GET') {
  try {
    $wc = New-Object System.Net.WebClient
    $wc.Proxy = $null
    if ($Method -eq 'GET') { return $wc.DownloadString($Url) }
    $wc.Headers['Content-Type'] = 'application/json'
    return $wc.UploadString($Url, $Method, '{}')
  } catch {
    $resp = $_.Exception.InnerException
    if (-not $resp) { $resp = $_.Exception }
    return "LOI: $($resp.Message)"
  }
}

if (-not (Test-Path $appcmd)) {
  Write-Host 'LOI: May nay khong co IIS (khong thay appcmd.exe).' -ForegroundColor Red
  exit 1
}
Import-Module WebAdministration

# ---------- 1. URL Rewrite + ARR ----------
Write-Host '=== [1/4] Kiem tra / cai URL Rewrite va ARR ==='
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]3072 } catch { } # TLS 1.2 cho download.microsoft.com
foreach ($m in $Modules) {
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

# ---------- 3. tìm site ----------
Write-Host '=== [3/4] Them rule chuyen tiep /api cho site ==='
$sites = @(Get-Website)
if ($Site) {
  $target = $sites | Where-Object { $_.Name -eq $Site } | Select-Object -First 1
} else {
  $target = $sites | Where-Object {
    [Environment]::ExpandEnvironmentVariables($_.physicalPath).TrimEnd('\') -ieq $DistPath
  } | Select-Object -First 1
  if (-not $target -and $sites.Count -eq 1) { $target = $sites[0] }
}
if (-not $target) {
  Write-Host "  Khong tim thay site nao tro toi $DistPath. Cac site hien co:" -ForegroundColor Yellow
  foreach ($s in $sites) {
    $b = ($s.bindings.Collection | ForEach-Object { $_.bindingInformation }) -join ', '
    Write-Host ("    - {0}  [{1}]  {2}" -f $s.Name, $b, $s.physicalPath)
  }
  Write-Host '  Chay lai:  install-proxy.bat "Ten site"' -ForegroundColor Yellow
  exit 1
}
$binding = ($target.bindings.Collection | Select-Object -First 1).bindingInformation # vd "*:37389:"
$sitePort = ($binding -split ':')[1]
if (-not $sitePort) { $sitePort = '80' }
Write-Host ("  Site: {0}  (cong {1}, thu muc {2})" -f $target.Name, $sitePort, $target.physicalPath)

$sec = 'system.webServer/rewrite/rules'
Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/-[name='$RuleName']", '/commit:apphost') | Out-Null # xóa rule cũ nếu có
$ok = (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/+[name='$RuleName',stopProcessing='True']", '/commit:apphost')) -and
      (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/[name='$RuleName'].match.url:^api/(.*)", '/commit:apphost')) -and
      (Invoke-AppCmd @('set', 'config', $target.Name, "-section:$sec", "/[name='$RuleName'].action.type:Rewrite", "/[name='$RuleName'].action.url:http://localhost:$ApiPort/api/{R:1}", '/commit:apphost'))
if (-not $ok) {
  Write-Host 'LOI: khong them duoc rule (xem thong bao cua appcmd o tren).' -ForegroundColor Red
  exit 1
}

# ---------- 4. kiểm tra ----------
Write-Host '=== [4/4] Kiem tra ==='
$direct = Get-Url "http://localhost:$ApiPort/api/health"
Write-Host "  API truc tiep  (localhost:$ApiPort): $direct"
if ($direct -like 'LOI*') {
  Write-Host '  -> API chua chay. Chay server\install-api.bat truoc roi chay lai file nay.' -ForegroundColor Yellow
  exit 1
}
$viaGet = Get-Url "http://localhost:$sitePort/api/health"
Write-Host "  Qua IIS GET    (localhost:$sitePort): $viaGet"
$viaPut = Get-Url "http://localhost:$sitePort/api/health" 'PUT'
Write-Host "  Qua IIS PUT    (localhost:$sitePort): $viaPut"

if ($viaPut -like '*405*') {
  # WebDAV chan PUT -> bo module WebDAV o site nay roi thu lai
  Write-Host '  PUT bi 405 (thuong do WebDAV) -> go WebDAVModule khoi site va thu lai' -ForegroundColor Yellow
  Invoke-AppCmd @('set', 'config', $target.Name, '-section:system.webServer/modules', "/-[name='WebDAVModule']", '/commit:apphost') | Out-Null
  Invoke-AppCmd @('set', 'config', $target.Name, '-section:system.webServer/handlers', "/-[name='WebDAV']", '/commit:apphost') | Out-Null
  $viaPut = Get-Url "http://localhost:$sitePort/api/health" 'PUT'
  Write-Host "  Qua IIS PUT    (localhost:$sitePort): $viaPut"
}

if ($viaGet -like '*"ok":true*' -and $viaPut -like '*"method":"PUT"*') {
  Write-Host "OK: IIS da chuyen tiep /api sang API. Tu ngoai: http://<ip-vps>:$sitePort/api/health" -ForegroundColor Green
} else {
  Write-Host 'CHUA XONG: IIS chua chuyen tiep duoc /api. Gui man hinh nay cho Claude.' -ForegroundColor Red
  Write-Host '  Goi y: mo IIS Manager -> site -> URL Rewrite de xem rule; iisreset roi chay lai check.'
  exit 1
}
