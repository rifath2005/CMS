@echo off
echo ========================================
echo  Update Wallet Balance for USER Accounts
echo ========================================
echo.

cd /d "%~dp0.."

echo Running wallet balance update script...
echo.

npx tsx scripts/update-wallet-balance.ts

echo.
echo ========================================
echo  Script execution completed
echo ========================================
pause
