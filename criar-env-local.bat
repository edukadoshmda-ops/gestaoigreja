@echo off eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZ3B3d2RocXRvYXhrcnZha3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTYzODMsImV4cCI6MjA4NTgzMjM4M30.36DWRC6AEL_KkGlV9Em8XHVVrO4R-eCEPbdN15MPzRo
chcp 65001 >nul
cd /d "%~dp0"
if exist ".env.local" (
    echo O arquivo .env.local ja existe.
    if "%1" neq "/Q" pause
    exit /b 0
)
if not exist ".env.example" (
    echo Arquivo .env.example nao encontrado.
    if "%1" neq "/Q" pause
    exit /b 1
)
copy ".env.example" ".env.local" >nul
echo Arquivo .env.local criado a partir de .env.example.
echo Abra .env.local e substitua your_supabase_anon_key_here pela sua chave do Supabase.
if "%1" neq "/Q" pause
