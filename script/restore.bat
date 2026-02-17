@echo off
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
set "PROJECT_ROOT=%CD%"
set "BKP_DIR=%PROJECT_ROOT%\bkp_bd"
set "CONTAINER=newmusic-db"
set "DB_USER=newmusic"
set "DB_NAME=newmusic"

docker ps --format "{{.Names}}" 2>nul | findstr /x "%CONTAINER%" >nul
if %errorlevel% neq 0 (
  echo Container %CONTAINER% nao esta rodando. Suba o banco ^(ex.: docker-compose up -d^) e tente novamente.
  exit /b 1
)

if not exist "%BKP_DIR%" (
  echo Pasta de backups nao encontrada: %BKP_DIR%
  exit /b 1
)

set n=0
for %%f in ("%BKP_DIR%\bkp_bd_*.sql") do set /a n+=1
if %n%==0 (
  echo Nenhum arquivo de backup encontrado em %BKP_DIR%
  exit /b 1
)

rem Listar do mais recente para o mais antigo (ordenar por data no nome: bkp_bd_AAAA-MM-DD_HHmmss.sql)
echo Backups disponiveis ^(mais recente primeiro^):
echo.
set idx=0
for /f "delims=" %%f in ('dir /b /o-n "%BKP_DIR%\bkp_bd_*.sql" 2^>nul') do (
  set /a idx+=1
  set "arq!idx!=%BKP_DIR%\%%f"
  echo   !idx!) %%f
)
echo   0^) Cancelar
echo.
set /p opcao="Escolha o numero do backup para restaurar (0 para cancelar): "

if "%opcao%"=="0" goto :cancel
if "%opcao%"=="" goto :cancel

set "ARQUIVO_SELECIONADO=!arq%opcao%!"
if not defined ARQUIVO_SELECIONADO (
  echo Opcao invalida.
  exit /b 1
)
if not exist "!ARQUIVO_SELECIONADO!" (
  echo Arquivo nao encontrado.
  exit /b 1
)

echo.
for %%a in ("!ARQUIVO_SELECIONADO!") do echo Sera restaurado o arquivo: %%~nxa
echo ATENCAO: Os dados atuais do banco serao substituidos.
set /p confirma="Confirma a restauracao? (s/N): "

if /i not "%confirma%"=="s" goto :cancel

echo Limpando schema public...
docker exec -i %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo Restaurando backup...
docker exec -i %CONTAINER% psql -U %DB_USER% -d %DB_NAME% < "!ARQUIVO_SELECIONADO!"

if %errorlevel% neq 0 (
  echo Erro ao restaurar.
  exit /b 1
)

echo Restauracao concluida.
pause
exit /b 0

:cancel
echo Operacao cancelada.
pause
exit /b 0
