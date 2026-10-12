@echo off
color 0A
title Shelby Mobile Workspace
echo ==================================================
echo    Shelby Auto-Server Init (React Native + Expo)
echo ==================================================

echo [!] Cleaning stale cache to prevent Windows errors...
IF EXIST ".expo" ( rmdir /s /q ".expo" )

IF NOT EXIST "node_modules\" (
    echo [!] Node modules not found. Installing... (Takes 2-3 minutes)
    call npm install
    echo [!] Install complete!
)

echo [!] Starting Expo Server and clearing Metro cache...
echo [!] Scan the QR Code with 'Expo Go' app on your phone!
call npx expo start --clear
pause