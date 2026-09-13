@echo off
REM Khoi phuc site IIS khi ca trang tra 503 sau khi cai URL Rewrite/ARR (go tam module loi, bat lai app pool,
REM cai Universal CRT neu thieu, gan lai module, kiem tra /api). Run as administrator.
if "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-iis.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-iis.ps1" -Site "%~1"
)
echo.
pause
