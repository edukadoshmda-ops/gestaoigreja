@echo off
title Gestao Igreja - Servidor
cd /d "%~dp0"

echo.
echo Pasta do projeto: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale em: https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo Copiando logo para public (se existir no Cursor)...
node copy-logo.js 2>nul
echo.
echo Iniciando servidor...
echo Abra no navegador: http://localhost:5173
echo.
echo Para parar: feche esta janela ou pressione Ctrl+C
echo.

npm run dev
if errorlevel 1 npx vite

echo.
pause
