@echo off
REM Khoi dong lai API tien do (dung sach tien trinh cu roi chay lai code moi). Run as administrator.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-api.ps1" -RestartOnly
echo.
pause
