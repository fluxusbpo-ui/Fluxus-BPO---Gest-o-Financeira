@echo off
setlocal

rem Diretório do repo (local do .bat)
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"

if not exist "%BACKEND_DIR%" (
  echo Diretorio %BACKEND_DIR% nao encontrado.
  pause
  exit /b 1
)

rem Verificar se node está no PATH
where node >nul 2>&1
if errorlevel 1 (
  echo Node nao encontrado no PATH. Instale o Node.js e tente novamente.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\src\index.js" (
  echo Arquivo src\index.js nao encontrado em %BACKEND_DIR%\. Certifique-se de que o backend exista.
  pause
  exit /b 1
)

echo Abrindo nova janela e iniciando backend (node) na porta 5000...
start "" /D "%BACKEND_DIR%" cmd /k "set PORT=5000 && node src\index.js"

endlocal

rem Se preferir clicar no arquivo no Explorer, use o VBScript equivalente (tratamento de paths com '&'):
if exist "%~dp0run-backend.vbs" (
  wscript "%~dp0run-backend.vbs"
  exit /b 0
)

exit /b 0
