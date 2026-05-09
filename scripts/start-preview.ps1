$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "欧阳日本事业部 - 本地演示预览"
Write-Host "地址: http://127.0.0.1:4173/zh"
Write-Host "后台: http://127.0.0.1:4173/zh/admin"
Write-Host ""
Write-Host "保持这个窗口打开，预览页面才能访问。关闭窗口后预览会停止。"
Write-Host ""

node scripts/preview-server.mjs
