@echo off
title Ocarina of Brawls - LAN Server
echo ====================================================
echo    Ocarina of Brawls - LAN Server
echo ====================================================
echo.

:: Beende eventuell alte haengende Prozesse auf Port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Beende vorherigen Server-Prozess auf Port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kurze Pause zur sicheren Port-Freigabe
timeout /t 1 /nobreak >nul

echo Starte Browser...
start http://localhost:3000

echo Starte Game Server...
node server.js
if errorlevel 1 (
    echo.
    echo Server wurde beendet oder konnte nicht gestartet werden.
)
pause

