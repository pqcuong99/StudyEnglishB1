@echo off
REM Cai API tien do thanh tac vu chay nen tren VPS (tu chay khi khoi dong, mo firewall).
REM Chay bang "Run as administrator". Can cai Node.js (https://nodejs.org) truoc.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-api.ps1"
echo.
pause
