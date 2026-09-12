@echo off
REM Cap nhat app tren VPS: keo ban moi nhat tu git ve roi restart IIS.
REM Chay bang "Run as administrator" (iisreset can quyen admin).
REM Dat file nay trong thu muc repo (IIS dang tro vao <repo>\dist).

cd /d "%~dp0"

echo === [1/3] Dua dist ve dung ban trong git (bo file build tai cho) ===
git checkout -- dist
git clean -fdq dist

echo === [2/3] git pull origin main ===
git pull origin main
if errorlevel 1 (
  echo.
  echo LOI: git pull that bai, xem thong bao o tren.
  pause
  exit /b 1
)

echo === [3/3] Restart IIS ===
iisreset

echo.
echo Cap nhat xong. Mo lai trang va bam Ctrl+F5.
pause
