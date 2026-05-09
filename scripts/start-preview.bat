@echo off
cd /d "%~dp0.."
echo.
echo 欧阳日本事业部 - 本地演示预览
echo 地址: http://127.0.0.1:4173/zh
echo 后台: http://127.0.0.1:4173/zh/admin
echo.
echo 保持这个窗口打开，预览页面才能访问。关闭窗口后预览会停止。
echo.
node scripts\preview-server.mjs
pause
