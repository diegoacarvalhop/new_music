@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
set "PROJECT_ROOT=%CD%"
set "BKP_DIR=%PROJECT_ROOT%\bkp_bd"
set "CONTAINER=newmusic-db"
set "DB_USER=newmusic"
set "DB_NAME=newmusic"

if not exist "%BKP_DIR%" mkdir "%BKP_DIR%"

docker ps --format "{{.Names}}" 2>nul | findstr /x "%CONTAINER%" >nul
if %errorlevel% neq 0 (
  echo Container %CONTAINER% nao esta rodando. Suba o banco ^(ex.: docker-compose up -d^) e tente novamente.
  exit /b 1
)

for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HHmmss'"') do set "DATA_BACKUP=%%i"
set "ARQUIVO=%BKP_DIR%\bkp_bd_%DATA_BACKUP%.sql"

echo Gerando backup do banco %DB_NAME%...
docker exec %CONTAINER% pg_dump -U %DB_USER% %DB_NAME% > "%ARQUIVO%"

if %errorlevel% neq 0 (
  echo Erro ao gerar backup.
  exit /b 1
)

echo Backup salvo em: %ARQUIVO%
dir "%ARQUIVO%"
pause
