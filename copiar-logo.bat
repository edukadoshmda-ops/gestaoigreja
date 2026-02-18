@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "ORIGEM=%USERPROFILE%\.cursor\projects\c-Users-eduka-Downloads-App-Gest-o-Igreja\assets\c__Users_eduka_AppData_Roaming_Cursor_User_workspaceStorage_905592b869c22d904283c935760e81a5_images_Design_sem_nome__3_-removebg-preview-32b3e302-c421-4a0d-8555-001aef8c7449.png"
set "DESTINO=%~dp0public\logo-app.png"
if not exist "%ORIGEM%" (
    echo Arquivo da logo nao encontrado em:
    echo %ORIGEM%
    echo.
    echo Copie manualmente a imagem da logo para: public\logo-app.png
    pause
    exit /b 1
)
copy /Y "%ORIGEM%" "%DESTINO%" >nul
echo Logo copiada para public\logo-app.png
pause
