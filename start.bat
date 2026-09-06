@echo off
title Ocarina of Brawls - LAN Server
echo ====================================================
echo        OCARINA OF BRAWLS - LAN SERVER
echo ====================================================
echo.
echo Starte Browser...
start http://localhost:3000

echo Starte Game Server...
node server.js
pause


