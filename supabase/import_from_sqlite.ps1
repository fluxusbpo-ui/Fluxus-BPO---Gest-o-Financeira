param(
  [Parameter(Mandatory=$true)] [string]$SqlitePath,
  [Parameter(Mandatory=$true)] [string]$PgConnectionString
)

Write-Host "Importando SQLite ($SqlitePath) para Postgres ($PgConnectionString) usando pgloader"

$pgloaderCmd = "pgloader sqlite:///$SqlitePath '$PgConnectionString'"
Write-Host "Comando gerado: $pgloaderCmd"

Write-Host "Executando pgloader... (requer pgloader instalado e disponível no PATH)"
$process = Start-Process -FilePath pgloader -ArgumentList "sqlite:///$SqlitePath", $PgConnectionString -NoNewWindow -Wait -PassThru
if ($process.ExitCode -ne 0) { Write-Error "pgloader retornou código $($process.ExitCode)"; exit $process.ExitCode }
Write-Host "Importação concluída"
