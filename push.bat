@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   Chat Simulator - Push to GitHub
echo ==============================================
echo.
echo Repo: https://github.com/TIPSONG/chat-simulator
echo First push will open a browser to sign in to GitHub.
echo.

git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. Check your network or GitHub sign-in.
) else (
    echo.
    echo Push OK!  https://github.com/TIPSONG/chat-simulator
)
echo.
pause
