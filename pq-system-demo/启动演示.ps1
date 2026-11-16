$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host '未检测到 Node.js，请先安装 Node.js 18 或更高版本：' -ForegroundColor Yellow
  Write-Host 'https://nodejs.org/'
  Read-Host '按回车键退出'
  exit 1
}

Start-Process node -ArgumentList 'serve.js' -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
Start-Sleep -Milliseconds 800
Start-Process 'http://localhost:5173/'
Write-Host '演示已启动：http://localhost:5173/' -ForegroundColor Green
Write-Host '如需停止，请在任务管理器中结束 node.exe。'
