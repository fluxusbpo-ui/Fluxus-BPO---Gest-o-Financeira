$backendDir = 'D:\Dev\GeP Finance\backend'
$port = 5000

if (-not (Test-Path $backendDir)) {
    Write-Error "Diretório '$backendDir' não encontrado."
    exit 1
}

$entry = Join-Path $backendDir 'src\index.js'
if (-not (Test-Path $entry)) {
    Write-Error "Arquivo de entrada '$entry' não encontrado."
    exit 1
}

$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeCmd) {
    Write-Error "Node não encontrado no PATH. Instale o Node.js e tente novamente."
    exit 1
}

Write-Output "Iniciando backend em $backendDir na porta $port..."

# Compatibilidade com PowerShell 5.1: usar cmd.exe para abrir nova janela e setar variável de ambiente
$inner = "set PORT=$port && cd /d `"$backendDir`" && node `"src\\index.js`""
Start-Process -FilePath cmd.exe -ArgumentList '/c','start','cmd','/k',$inner -WorkingDirectory $backendDir

Write-Output "Processo iniciado (janela nova). Feche a janela iniciada para encerrar o servidor." 
