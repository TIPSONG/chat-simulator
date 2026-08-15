@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo 正在构建生产版本...
call npm run build
if errorlevel 1 (
    echo [错误] 构建失败。
    echo.
    pause
    exit /b 1
)

echo.
echo 构建完成，产物在 dist 目录。
echo 可用命令 npm run preview 本地预览，或把 dist 部署到任意静态服务器。
echo.
pause
