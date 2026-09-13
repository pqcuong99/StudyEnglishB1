@echo off
REM Cap nhat app tren VPS bang MOT file: double-click la xong, script tu xin quyen Administrator.
REM Viec chinh nam trong server\update-vps.ps1: lay ban moi nhat tu git, restart IIS,
REM cai (lan dau) hoac khoi dong lai API tien do.
REM Than file nam trong mot khoi ( ... ) de cmd doc het mot lan truoc khi chay -
REM vi git co the ghi de chinh file nay giua chung. Han che sua file nay; sua update-vps.ps1.
(
  net session >nul 2>&1
  if errorlevel 1 (
    echo Can quyen Administrator - dang mo lai cua so voi quyen admin...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
  )
  cd /d "%~dp0"
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\update-vps.ps1"
  echo.
  pause
  exit /b
)
