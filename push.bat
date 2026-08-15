@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==============================================
echo    对话模拟器 · 推送到 GitHub
echo ==============================================
echo.
echo 目标仓库： https://github.com/TIPSONG/chat-simulator
echo 首次推送会弹出浏览器让你登录 GitHub（用 Git Credential Manager）。
echo.

git push -u origin main
if errorlevel 1 (
    echo.
    echo [错误] 推送失败。请检查网络，或确认已登录 GitHub。
) else (
    echo.
    echo 推送成功！ https://github.com/TIPSONG/chat-simulator
)
echo.
pause
