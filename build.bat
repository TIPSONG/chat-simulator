@echo off
setlocal
cd /d "%~dp0"

echo Building production bundle...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed.
    echo.
    pause
    exit /b 1
)

echo.
echo Build done. Output is in the dist folder.
echo Run "npm run preview" to preview, or deploy dist/ to any static server.
echo.
pause
