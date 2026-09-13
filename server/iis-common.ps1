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

# Gọi HTTP, LUÔN đọc được cả nội dung khi lỗi (để biết 404 do IIS hay do Node).
# Trả về hashtable: status (int, 0 nếu không kết nối), body, server (header Server)
function Invoke-Http([string]$Url, [string]$Method = 'GET', [string]$Body = '{}') {
  $req = [System.Net.HttpWebRequest]::Create($Url)
  $req.Method = $Method
  $req.Proxy = $null
  $req.Timeout = 15000
  $req.AllowAutoRedirect = $false
  if ($Method -ne 'GET' -and $Method -ne 'HEAD') {
    $b = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $req.ContentType = 'application/json'
    $req.ContentLength = $b.Length
    try { $s = $req.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close() }
    catch { return @{ status = 0; body = "LOI (gui): $($_.Exception.Message)"; server = '' } }
  }
  $resp = $null
  try { $resp = $req.GetResponse() }
  catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if (-not $resp) { return @{ status = 0; body = "LOI: $($_.Exception.Message)"; server = '' } }
  }
  $code = [int]$resp.StatusCode
  $server = $resp.Headers['Server']
  $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
  $body = $sr.ReadToEnd(); $sr.Close(); $resp.Close()
  return @{ status = $code; body = $body; server = $server }
}

# Chuỗi hiển thị gọn cho một lần gọi
function Format-Http($r) {
  $b = ($r.body -replace '\s+', ' ')
  if ($b.Length -gt 160) { $b = $b.Substring(0, 160) + '...' }
  $srv = if ($r.server) { " [Server: $($r.server)]" } else { ' [Server: (khong co -> Node)]' }
  return "HTTP $($r.status)$srv $b"
}

# tương thích cũ: trả chuỗi body, hoặc "LOI: ..." nếu không kết nối được
function Get-Url([string]$Url, [string]$Method = 'GET') {
  $r = Invoke-Http $Url $Method
  if ($r.status -eq 0) { return $r.body }
  return $r.body
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
  $dGet = Invoke-Http "http://localhost:$ApiPort/api/health"
  Write-Host "  API truc tiep GET (localhost:$ApiPort): $(Format-Http $dGet)"
  if ($dGet.status -eq 0) {
    Write-Host '  -> API chua chay. Chay server\install-api.bat truoc.' -ForegroundColor Yellow
    return $false
  }
  $dPut = Invoke-Http "http://localhost:$ApiPort/api/health" 'PUT'
  Write-Host "  API truc tiep PUT (localhost:$ApiPort): $(Format-Http $dPut)"
  if ($dPut.body -notlike '*"method":"PUT"*') {
    Write-Host '  -> Node chua nhan PUT o /api/health. Chay update-vps.bat de cap nhat server\index.js roi thu lai.' -ForegroundColor Yellow
    return $false
  }

  $vGet = Invoke-Http "http://localhost:$port/api/health"
  Write-Host "  Qua IIS GET    (localhost:$port): $(Format-Http $vGet)"
  $vPut = Invoke-Http "http://localhost:$port/api/health" 'PUT'
  Write-Host "  Qua IIS PUT    (localhost:$port): $(Format-Http $vPut)"

  if ($vPut.body -notlike '*"method":"PUT"*') {
    # header Server cho biết ai trả 404: IIS (co "Microsoft-IIS") hay Node (khong co)
    if ($vPut.server -like '*IIS*' -or $vPut.server -like '*HTTPAPI*') {
      Write-Host '  PUT bi IIS chan truoc khi chuyen tiep (Server la IIS).' -ForegroundColor Yellow
      Write-Host '  -> go WebDAV va mo verb PUT trong Request Filtering roi thu lai.'
      foreach ($scope in @(@($site.Name), @())) {
        Invoke-AppCmd (@('set', 'config') + $scope + @('-section:system.webServer/modules', "/-[name='WebDAVModule']", '/commit:apphost')) -Quiet | Out-Null
        Invoke-AppCmd (@('set', 'config') + $scope + @('-section:system.webServer/handlers', "/-[name='WebDAV']", '/commit:apphost')) -Quiet | Out-Null
      }
      Invoke-AppCmd @('set', 'config', $site.Name, '-section:system.webServer/webdav/authoring', '/enabled:false', '/commit:apphost') -Quiet | Out-Null
      # cho phép mọi verb trong Request Filtering (mở PUT/DELETE nếu bị chặn)
      Invoke-AppCmd @('set', 'config', $site.Name, '-section:system.webServer/security/requestFiltering/verbs', '/allowUnlisted:true', '/commit:apphost') -Quiet | Out-Null
      Invoke-AppCmd @('set', 'config', $site.Name, '-section:system.webServer/security/requestFiltering/verbs', "/+[verb='PUT',allowed='True']", '/commit:apphost') -Quiet | Out-Null
      $vPut = Invoke-Http "http://localhost:$port/api/health" 'PUT'
      Write-Host "  Qua IIS PUT    (localhost:$port): $(Format-Http $vPut)"
    } else {
      Write-Host '  PUT da toi Node nhung Node tra 404 -> URL sau rewrite khong dung.' -ForegroundColor Yellow
      Write-Host '  Gui man hinh nay cho Claude (kem 2 dong "Qua IIS" o tren).'
    }
  }

  return ($vGet.body -like '*"ok":true*' -and $vPut.body -like '*"method":"PUT"*')
}
