@echo off
REM Khoi dong lai API tien do (sau khi cap nhat code). Chay bang "Run as administrator".
set TASK=StudyEnglishB1-API
schtasks /end /tn "%TASK%" >nul 2>&1
schtasks /run /tn "%TASK%"
if errorlevel 1 (
  echo LOI: Chua cai API. Chay server\install-api.bat truoc.
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
curl -s http://localhost:37390/api/health
echo.
pause
