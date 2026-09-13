@echo off
REM Cho IIS chuyen tiep /api cua trang web sang API Node (cung cong voi trang). Run as administrator.
REM Neu script khong tu tim duoc site:  install-proxy.bat "Ten site trong IIS"
if "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-proxy.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-proxy.ps1" -Site "%~1"
)
echo.
pause
