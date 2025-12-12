param(
  [int]$Port = 3001
)

# Try using Get-NetTCPConnection (modern PowerShell)
$pids = @()
try {
  $pids = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess | ForEach-Object { [int]$_ } | Sort-Object -Unique
} catch {
  # Fallback: parse netstat output
  $net = netstat -ano | Select-String ":$Port\s"
  if ($net) {
    $pids = $net | ForEach-Object {
      $parts = ($_ -split '\s+') | Where-Object { $_ -ne '' }
      $parts[-1]
    } | ForEach-Object { [int]$_ } | Sort-Object -Unique
  }
}

if ($pids -and $pids.Count -gt 0) {
  Get-Process -Id $pids -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path
} else {
  Write-Output "No process listening on $Port"
}
