$frontendDir = 'D:\Dev\GeP Finance\frontend'
$port = 3001

if (-not (Test-Path $frontendDir)) {
    Write-Error "Diretório '$frontendDir' não encontrado."
    exit 1
}

$viteBin = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $viteBin)) {
    Write-Error "Vite não encontrado em '$frontendDir'. Execute 'npm install' no diretório do frontend."
    exit 1
}

$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeCmd) {
    Write-Error "Node não encontrado no PATH. Instale o Node.js e tente novamente."
    exit 1
}

Write-Output "Iniciando frontend (Vite) em $frontendDir na porta $port..."
Start-Process -FilePath $nodeCmd -ArgumentList @($viteBin, '--port', [string]$port) -WorkingDirectory $frontendDir

Write-Output "Processo iniciado (janela nova). Feche esta janela se quiser encerrar o servidor iniciado separadamente." 
