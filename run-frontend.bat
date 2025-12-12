@echo off
setlocal

rem Diretório do repo (local do .bat)
set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

if not exist "%FRONTEND_DIR%" (
  echo Diretorio %FRONTEND_DIR% nao encontrado.
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

if not exist "%FRONTEND_DIR%\node_modules\vite\bin\vite.js" (
  echo Vite nao encontrado em %FRONTEND_DIR%\. Execute: cd frontend && npm install
  pause
  exit /b 1
)

echo Abrindo nova janela e iniciando frontend (Vite) na porta 3001...
start "" /D "%FRONTEND_DIR%" cmd /k "node "node_modules\vite\bin\vite.js" --port 3001"

endlocal

rem Se preferir clicar no arquivo no Explorer, use o VBScript equivalente (tratamento de paths com '&'):
if exist "%~dp0run-frontend.vbs" (
  wscript "%~dp0run-frontend.vbs"
  exit /b 0
)

exit /b 0
