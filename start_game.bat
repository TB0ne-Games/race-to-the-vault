@echo off
echo ==========================================
echo    RACE TO THE VAULT - HEIST LAUNCHER
echo ==========================================
echo.
echo [1/2] Starting Background Server...
start /min cmd /c "cd /d %~dp0server && node index.js"
echo [2/2] Starting Frontend Client...
echo.
echo NOTE: Access the game at http://192.168.4.176:5173
echo.
cd /d %~dp0client
npm run dev
pause
