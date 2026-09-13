@echo off
REM Kiem tra API tien do co dang chay khong; neu khong thi in chan doan (trang thai tac vu, log, loi khi chay thu).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-api.ps1" -CheckOnly
echo.
pause
