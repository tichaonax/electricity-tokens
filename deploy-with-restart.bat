@echo off
REM Complete deployment script with service restart
REM Run this as Administrator

echo.
echo ========================================
echo  Electricity Tokens - Full Deployment
echo ========================================
echo.

REM Step 1: Stop the service
echo [1/4] Stopping service...
sc.exe stop "ElectricityTracker.exe" >nul 2>&1
timeout /t 5 /nobreak >nul
echo       Service stopped

REM Step 2: Run update (dependencies, database, build, Prisma)
echo.
echo [2/4] Running update process...
echo       - Installing dependencies
echo       - Running migrations
echo       - Regenerating Prisma Client
echo       - Building application
call npm run install:update
if errorlevel 1 (
    echo.
    echo ❌ Update failed! Check the logs above.
    pause
    exit /b 1
)

REM Step 3: Start the service
echo.
echo [3/4] Starting service...
sc.exe start "ElectricityTracker.exe"
timeout /t 3 /nobreak >nul
echo       Service started

REM Step 4: Verify
echo.
echo [4/4] Verifying deployment...
timeout /t 5 /nobreak >nul
call npm run service:diagnose

echo.
echo ========================================
echo  ✅ Deployment Complete!
echo ========================================
echo.
echo 🌐 Application should be available at: http://localhost:3000
echo 📝 Check logs if there are any issues
echo.
pause
