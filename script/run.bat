@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."

where java >nul 2>nul
if %errorlevel% neq 0 (
  echo Java nao encontrado. Instale JDK 17+.
  exit /b 1
)

where yarn >nul 2>nul
if %errorlevel% neq 0 (
  echo Yarn nao encontrado. Necessario para o build. Instale Node e Yarn.
  exit /b 1
)

where gradle >nul 2>nul
if %errorlevel% neq 0 (
  echo Gradle nao encontrado no PATH.
  echo Instale o Gradle: https://gradle.org/install/
  echo Ou abra o projeto backend na IDE e rode bootJar.
  exit /b 1
)

echo Construindo aplicacao (backend + frontend)...
cd frontend
call yarn install
call yarn build
if %errorlevel% neq 0 (
  cd ..
  echo Build do frontend falhou.
  exit /b 1
)
cd ..

if not exist "backend\src\main\resources\static" mkdir "backend\src\main\resources\static"
xcopy /E /Y /Q frontend\dist\* backend\src\main\resources\static\

cd backend
if exist gradlew.bat (
  call gradlew.bat bootJar
) else (
  call gradle bootJar
)
if %errorlevel% neq 0 (
  cd ..
  echo Build do backend falhou.
  exit /b 1
)
cd ..

set JAR=backend\build\libs\newmusic-api-1.0.0.jar
if not exist "%JAR%" (
  echo JAR nao encontrado: %JAR%
  exit /b 1
)

REM Porta padrao 8080; se estiver em uso, usa a proxima livre (ate 8099)
set APP_PORT=8080
:find_port
netstat -an | findstr "LISTENING" | findstr ":%APP_PORT% " >nul 2>nul
if %errorlevel% equ 0 (
  set /a APP_PORT+=1
  if %APP_PORT% lss 8100 goto find_port
  echo Nenhuma porta livre entre 8080 e 8099.
  exit /b 1
)
if not %APP_PORT%==8080 (
  echo Porta 8080 em uso. Usando porta %APP_PORT%.
)

echo Iniciando aplicacao...
echo Acesse: http://localhost:%APP_PORT%
echo PostgreSQL deve estar rodando (padrao: localhost:5432/newmusic).
REM Abre o navegador apos 10 segundos (enquanto o servidor sobe)
start /B cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:%APP_PORT%"
java -Dserver.port=%APP_PORT% -jar "%JAR%"
pause
