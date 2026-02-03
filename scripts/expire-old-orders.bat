@echo off
echo ========================================
echo Expire Old Orders Script
echo ========================================
echo.
echo This script will:
echo 1. Find all orders that have passed their expiration time
echo 2. Update their status to EXPIRED in the database
echo 3. Make them appear in order history
echo.
echo Press Ctrl+C to cancel, or
pause

cd /d "%~dp0.."
call npx ts-node scripts/expire-old-orders.ts

echo.
echo ========================================
echo Script execution completed
echo ========================================
pause
