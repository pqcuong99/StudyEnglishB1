# Cập nhật app trên VPS — được update-vps.bat gọi (đã có quyền Administrator):
#   1. git fetch + reset --hard origin/main: đưa toàn bộ repo về đúng bản mới nhất.
#      Mọi sửa đổi tại chỗ bị bỏ (repo trên VPS chỉ để chạy, không sửa code ở đây) —
#      nhờ vậy không còn lỗi "Your local changes would be overwritten by merge".
#      server\data (tiến độ người dùng) nằm ngoài git nên không bị đụng tới.
#   2. iisreset
#   3. cài API lần đầu (chưa có tác vụ) hoặc khởi động lại API bằng code mới
# Viết bằng PowerShell vì PowerShell đọc hết file vào bộ nhớ trước khi chạy, nên
# git ghi đè file này giữa chừng vẫn an toàn (file .bat thì cmd đọc từng dòng).
$ErrorActionPreference = 'Continue'

$Repo = Split-Path $PSScriptRoot -Parent
$TaskName = 'StudyEnglishB1-API'
$Installer = Join-Path $PSScriptRoot 'install-api.ps1'
Set-Location $Repo

function Step([int]$n, [string]$msg) { Write-Host "=== [$n/4] $msg ===" -ForegroundColor Cyan }
function Fail([string]$msg) {
  Write-Host ''
  Write-Host "LOI: $msg" -ForegroundColor Red
  exit 1
}

# ---------- 1. git ----------
Step 1 'Lay ban moi nhat tu git (origin/main)'
& git fetch origin main
if ($LASTEXITCODE -ne 0) { Fail 'git fetch that bai (mat mang? sai remote?). Xem thong bao o tren.' }
$before = (& git rev-parse HEAD).Trim()
$after = (& git rev-parse origin/main).Trim()
# bỏ mọi thay đổi tại chỗ (kể cả khác biệt CRLF do autocrlf) rồi trỏ thẳng tới origin/main
& git reset --hard origin/main
if ($LASTEXITCODE -ne 0) { Fail 'git reset --hard origin/main that bai. Xem thong bao o tren.' }
# bỏ file build cũ còn sót trong dist (tên file có hash, bản mới không dùng nữa)
& git clean -fdq dist
if ($before -eq $after) {
  Write-Host '  Da la ban moi nhat (khong co commit moi).'
} else {
  Write-Host ("  Cap nhat {0} -> {1}:" -f $before.Substring(0, 7), $after.Substring(0, 7))
  & git log --oneline "$before..$after" | ForEach-Object { Write-Host "    $_" }
}

# ---------- 2. IIS ----------
Step 2 'Restart IIS'
& iisreset
if ($LASTEXITCODE -ne 0) { Write-Host '  CANH BAO: iisreset bao loi (xem tren) - trang co the chua nhan ban moi.' -ForegroundColor Yellow }

# ---------- 3. API ----------
Step 3 'API tien do (Node, cong 37390)'
& schtasks /query /tn $TaskName > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  # lần đầu: tạo tác vụ tự chạy khi Windows khởi động, mở firewall, chạy API
  Write-Host '  Chua cai API -> cai dat lan dau'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installer
} else {
  # dừng sạch tiến trình cũ (nhả cổng 37390) rồi chạy lại code mới
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installer -RestartOnly
}
if ($LASTEXITCODE -ne 0) { Fail 'API chua chay duoc - xem chan doan o tren (hoac chay server\check-api.bat).' }

# ---------- 4. xong ----------
Step 4 'Xong'
Write-Host 'Cap nhat xong. Mo lai trang va bam Ctrl+F5.' -ForegroundColor Green
Write-Host '(VPS moi, /api qua IIS chua chay: chay them server\install-proxy.bat mot lan.)'
exit 0
