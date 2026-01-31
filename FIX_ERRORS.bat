@echo off
echo ========================================
echo FIXING ALL 52 TYPESCRIPT ERRORS
echo ========================================
echo.
echo Current directory: %CD%
echo.
echo Step 1: Checking if package.json exists...
if exist package.json (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found! Are you in the correct directory?
    pause
    exit /b 1
)
echo.
echo Step 2: Installing all dependencies...
echo This will take 2-5 minutes...
echo.
npm install
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] All dependencies installed!
    echo.
    echo Step 3: Verifying installation...
    if exist node_modules (
        echo [OK] node_modules folder created
    ) else (
        echo [ERROR] node_modules folder not found
    )
    echo.
    echo Step 4: Building project to verify errors are fixed...
    npm run build
    echo.
    if %ERRORLEVEL% EQU 0 (
        echo ========================================
        echo [SUCCESS] ALL 52 ERRORS FIXED!
        echo ========================================
    ) else (
        echo ========================================
        echo [WARNING] Build completed with some issues
        echo Check the output above for details
        echo ========================================
    )
) else (
    echo [ERROR] npm install failed!
    echo Try running: npm cache clean --force
    echo Then run this script again
)
echo.
echo Press any key to exit...
pause >nul
