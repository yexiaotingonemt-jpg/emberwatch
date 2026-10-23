@echo off
chcp 65001 >nul
title 余烬守望 Emberwatch
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20.19+ 或 22.12+，然后重新运行此文件。
  echo https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo 正在安装游戏所需依赖……
  call npm install
  if errorlevel 1 (
    echo 安装失败，请检查网络连接和 Node.js 版本。
    pause
    exit /b 1
  )
)
echo 正在启动余烬守望，请保留此窗口；按 Ctrl+C 可结束服务。
call npm run dev -- --open
if errorlevel 1 pause
