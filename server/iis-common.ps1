# Hàm dùng chung cho install-proxy.ps1 và fix-iis.ps1 (dot-source: . "$PSScriptRoot\iis-common.ps1")

$ApiPort = 37390
$RuleName = 'StudyEnglishB1-API'
$inetsrv = Join-Path $env:windir 'System32\inetsrv'
$appcmd = Join-Path $inetsrv 'appcmd.exe'
$DistPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\dist')).TrimEnd('\')

# Module IIS cần cho proxy: tên đăng ký trong globalModules + file dll + bộ cài
$IisModules = @(
  @{ Name = 'IIS URL Rewrite 2.1'; Module = 'RewriteModule'; File = 'rewrite_amd64_en-US.msi'
     Dlls = @((Join-Path $inetsrv 'rewrite.dll'))
     Url = 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi' },
  @{ Name = 'IIS Application Request Routing 3.0'; Module = 'ApplicationRequestRouting'; File = 'requestRouter_amd64.msi'
     Dlls = @((Join-Path $env:ProgramFiles 'IIS\Application Request Routing\requestRouter.dll'), (Join-Path $inetsrv 'requestRouter.dll'))
     Url = 'https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi' }
)

function Invoke-AppCmd {
  # chạy appcmd, in lệnh + kết quả; trả về $true nếu thành công
  param([string[]]$ArgList, [switch]$Quiet)
  if (-not $Quiet) { Write-Host ("  > appcmd " + ($ArgList -join ' ')) }
  $out = & $appcmd @ArgList
  $ok = ($LASTEXITCODE -eq 0)
  if ($out -and -not $Quiet) { $out | ForEach-Object { Write-Host "    $_" } }
  return $ok
}

# Nội dung một section cấu hình (chuỗi XML) — không in ra màn hình
function Get-ConfigSection([string]$Section, [string]$Site) {
  try {
    if ($Site) { return (& $appcmd list config $Site "-section:$Section" | Out-String) }
    return (& $appcmd list config "-section:$Section" | Out-String)
  } catch {
    return ''
  }
}

# Đã cài chưa: có trong globalModules của IIS, hoặc thấy file dll
function Test-ModuleInstalled($m) {
  $list = Get-ConfigSection 'system.webServer/globalModules'
  if ($list -match ('name="' + [regex]::Escape($m.Module) + '"')) { return $true }
  foreach ($d in $m.Dlls) { if (Test-Path $d) { return $true } }
  return $false
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

# Site IIS đang trỏ tới <repo>\dist (hoặc site duy nhất, hoặc theo tên truyền vào)
function Find-Site([string]$Name) {
  Import-Module WebAdministration
  $sites = @(Get-Website)
  if ($Name) { return ($sites | Where-Object { $_.Name -eq $Name } | Select-Object -First 1) }
  $t = $sites | Where-Object {
    [Environment]::ExpandEnvironmentVariables($_.physicalPath).TrimEnd('\') -ieq $DistPath
  } | Select-Object -First 1
  if (-not $t -and $sites.Count -eq 1) { $t = $sites[0] }
  if (-not $t) {
    Write-Host "  Khong tim thay site nao tro toi $DistPath. Cac site hien co:" -ForegroundColor Yellow
    foreach ($s in $sites) {
      $b = ($s.bindings.Collection | ForEach-Object { $_.bindingInformation }) -join ', '
      Write-Host ("    - {0}  [{1}]  {2}" -f $s.Name, $b, $s.physicalPath)
    }
  }
  return $t
}

function Get-SitePort($site) {
  $binding = ($site.bindings.Collection | Select-Object -First 1).bindingInformation # vd "*:80:"
  $p = ($binding -split ':')[1]
  if (-not $p) { $p = '80' }
  return $p
}

# Bật app pool của site (nếu đang dừng) rồi xem site có trả lời không
function Start-SiteAndCheck($site) {
  Import-Module WebAdministration
  $pool = $site.applicationPool
  try {
    if ((Get-WebAppPoolState $pool).Value -ne 'Started') {
      Write-Host "  Bat app pool '$pool' ..."
      Start-WebAppPool $pool
      Start-Sleep -Seconds 2
    }
  } catch {
    Write-Host "  Khong bat duoc app pool '$pool': $($_.Exception.Message)" -ForegroundColor Yellow
  }
  try { if ($site.State -ne 'Started') { Start-Website $site.Name } } catch { }
  $port = Get-SitePort $site
  $r = Get-Url "http://localhost:$port/"
  $ok = -not ($r -like 'LOI*')
  Write-Host ("  Trang chu (localhost:{0}): {1}" -f $port, $(if ($ok) { 'OK' } else { $r }))
  return $ok
}

# Kiểm tra /api qua IIS (GET + PUT); trả về $true nếu cả hai đi qua được
function Test-ApiViaIis($site) {
  $port = Get-SitePort $site
  $direct = Get-Url "http://localhost:$ApiPort/api/health"
  Write-Host "  API truc tiep  (localhost:$ApiPort): $direct"
  if ($direct -like 'LOI*') {
    Write-Host '  -> API chua chay. Chay server\install-api.bat truoc.' -ForegroundColor Yellow
    return $false
  }
  $viaGet = Get-Url "http://localhost:$port/api/health"
  Write-Host "  Qua IIS GET    (localhost:$port): $viaGet"
  $viaPut = Get-Url "http://localhost:$port/api/health" 'PUT'
  Write-Host "  Qua IIS PUT    (localhost:$port): $viaPut"
  if ($viaPut -notlike '*"method":"PUT"*') {
    # WebDAV chặn PUT/DELETE (thường trả 405, đôi khi 404) -> gỡ WebDAV khỏi site
    # rồi thử lại. Gỡ ở cấp site lẫn toàn máy để chắc ăn (vô hại nếu không có).
    Write-Host '  PUT khong qua duoc (thuong do WebDAV) -> go WebDAVModule roi thu lai' -ForegroundColor Yellow
    foreach ($scope in @(@($site.Name), @())) {
      Invoke-AppCmd (@('set', 'config') + $scope + @('-section:system.webServer/modules', "/-[name='WebDAVModule']", '/commit:apphost')) -Quiet | Out-Null
      Invoke-AppCmd (@('set', 'config') + $scope + @('-section:system.webServer/handlers', "/-[name='WebDAV']", '/commit:apphost')) -Quiet | Out-Null
    }
    # tắt hẳn WebDAV authoring nếu section này có mặt (một số bản cài bật sẵn)
    Invoke-AppCmd @('set', 'config', $site.Name, '-section:system.webServer/webdav/authoring', '/enabled:false', '/commit:apphost') -Quiet | Out-Null
    $viaPut = Get-Url "http://localhost:$port/api/health" 'PUT'
    Write-Host "  Qua IIS PUT    (localhost:$port): $viaPut"
  }
  return ($viaGet -like '*"ok":true*' -and $viaPut -like '*"method":"PUT"*')
}
