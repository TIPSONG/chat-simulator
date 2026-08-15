@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==============================================
echo    对话模拟器 · 启动器
echo ==============================================
echo.

rem 检查 Node.js 是否安装
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js。
    echo 请先到 https://nodejs.org/ 下载安装 LTS 版本，然后重新双击本文件。
    echo.
    pause
    exit /b 1
)

rem 首次运行自动安装依赖
if not exist "node_modules" (
    echo 首次运行，正在安装依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络后重试。
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo 正在启动开发服务器，将自动打开浏览器...
echo 若未自动打开，请手动访问： http://localhost:5173
echo 关闭本窗口即可停止服务。
echo.
call npm run dev -- --open

pause
