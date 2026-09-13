@echo off
REM Cap nhat app tren VPS bang MOT file: keo ban moi nhat tu git ve, restart IIS,
REM cai (lan dau) hoac khoi dong lai API tien do. Chi can double-click file nay -
REM script tu xin quyen Administrator (iisreset / Task Scheduler / Firewall can quyen admin).
REM Dat file nay trong thu muc repo (IIS dang tro vao <repo>\dist).

REM --- tu mo lai voi quyen Administrator neu chua co ---
net session >nul 2>&1
if errorlevel 1 (
  echo Can quyen Administrator - dang mo lai cua so voi quyen admin...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"

echo === [1/4] Dua dist ve dung ban trong git (bo file build tai cho) ===
git checkout -- dist
git clean -fdq dist

echo === [2/4] git pull origin main ===
git pull origin main
if errorlevel 1 (
  echo.
  echo LOI: git pull that bai, xem thong bao o tren.
  pause
  exit /b 1
)

echo === [3/4] Restart IIS ===
iisreset

echo === [4/4] API tien do (Node, cong 37390) ===
schtasks /query /tn "StudyEnglishB1-API" >nul 2>&1
if errorlevel 1 (
  REM lan dau: tao tac vu tu chay khi Windows khoi dong, mo firewall, chay API
  echo   Chua cai API - cai dat lan dau...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\install-api.ps1"
) else (
  REM dung sach tien trinh cu (nha cong 37390) roi chay lai code moi
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\install-api.ps1" -RestartOnly
)
if errorlevel 1 (
  echo.
  echo LOI: API chua chay duoc - xem chan doan o tren ^(hoac chay server\check-api.bat^).
  pause
  exit /b 1
)

echo.
echo Cap nhat xong. Mo lai trang va bam Ctrl+F5.
echo (Neu /api qua IIS chua hoat dong - lan dau tren VPS moi - chay them server\install-proxy.bat.)
pause
