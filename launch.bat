@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Chat Simulator - Launcher
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/ then retry.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies (first run), please wait...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your network and retry.
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo Starting dev server, browser will open automatically...
echo If not, open: http://localhost:5173
echo Close this window to stop the server.
echo.
call npm run dev -- --open

pause
