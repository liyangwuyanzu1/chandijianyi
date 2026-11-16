@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  echo 请先安装 Node.js 18 或更高版本： https://nodejs.org/
  echo 安装完成后重新双击本文件。
  pause
  exit /b 1
)

echo 正在启动植保植检信息管理系统演示...
start "植保植检信息管理系统" cmd /c "node serve.js"
timeout /t 1 /nobreak >nul
start "" "http://localhost:5173/"
echo 浏览器已打开：http://localhost:5173/
echo 关闭此窗口不会停止服务；关闭新打开的服务窗口即可停止。
endlocal
