@echo off
REM Duoc Task Scheduler goi (xem install-api.ps1): chay API va ghi loi (neu co) vao data\task.log
REM Tham so 1: duong dan day du toi node.exe
cd /d "%~dp0"
if not exist data mkdir data
echo [%date% %time%] Khoi dong: "%~1" index.js >> data\task.log
"%~1" index.js 1>nul 2>> data\task.log
echo [%date% %time%] node.exe ket thuc, ma loi %errorlevel% >> data\task.log
exit /b %errorlevel%
