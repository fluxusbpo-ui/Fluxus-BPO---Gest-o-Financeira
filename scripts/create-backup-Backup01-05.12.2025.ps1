# Cria backups separados para frontend e backend
# Nome do diretório de backup: "Backup01 - 05.12.2025"

$BackupName = 'Backup01 - 05.12.2025'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackupDir = Join-Path $Root "..\backups\$BackupName" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $BackupDir) { New-Item -ItemType Directory -Force -Path (Join-Path $Root "..\backups\$BackupName") | Out-Null }
$BackupDir = (Join-Path $Root "..\backups\$BackupName")

Write-Output "Criando pasta de backup: $BackupDir"

$FrontendSrc = Join-Path $Root "..\frontend"
$BackendSrc = Join-Path $Root "..\backend"
$FrontendZip = Join-Path $BackupDir 'frontend.zip'
$BackendZip = Join-Path $BackupDir 'backend.zip'

# Compress-Archive aceita caminhos com curinga; compacta o conteúdo das pastas
if (Test-Path $FrontendSrc) {
  Write-Output "Compactando frontend -> $FrontendZip"
  Compress-Archive -Path (Join-Path $FrontendSrc '*') -DestinationPath $FrontendZip -Force
} else {
  Write-Output "Pasta frontend não encontrada em $FrontendSrc"
}

if (Test-Path $BackendSrc) {
  Write-Output "Compactando backend -> $BackendZip"
  Compress-Archive -Path (Join-Path $BackendSrc '*') -DestinationPath $BackendZip -Force
} else {
  Write-Output "Pasta backend não encontrada em $BackendSrc"
}

# Criar metadados simples
$meta = [ordered]@{
  name = $BackupName
  created_at = (Get-Date).ToString('u')
  host = $env:COMPUTERNAME
}
try {
  $git = & git rev-parse --short HEAD 2>$null
  if ($git) { $meta.git_commit = $git.Trim() }
} catch { }

$meta | ConvertTo-Json | Out-File -FilePath (Join-Path $BackupDir 'metadata.json') -Encoding utf8

Write-Output "Backup concluído. Arquivos em: $BackupDir"
