@echo off
echo ========================================
echo  Add Wallet Balance Column
echo ========================================
echo.

cd /d "%~dp0.."

echo Adding wallet_balance column and setting default values...
echo.

npx tsx scripts/add-wallet-column.ts

echo.
echo ========================================
echo  Setup completed
echo ========================================
pause
