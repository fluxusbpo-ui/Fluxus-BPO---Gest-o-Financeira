<#
Interactive script to set GitHub secrets and run Supabase migration+deploy workflows.
It will prompt for missing values and run `gh` commands and workflows.

Usage: Open PowerShell in the repo root and run:
  .\scripts\run_supabase_migration.ps1

You will be prompted for:
  - GitHub repo (owner/repo)
  - PG_CONN (Postgres connection string, URI-encoded)
  - SUPABASE_KEY (service role)
  - SUPABASE_ANON_KEY (anon public key)
  - SUPABASE_URL (e.g. https://pykshzedlcmzrutzqnpg.supabase.co)
  - SUPABASE_ACCESS_TOKEN (token for supabase CLI)

This script does NOT echo secrets back to the console.
#>

function Read-Secret([string]$prompt) {
  $secure = Read-Host -AsSecureString $prompt
  return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

Write-Host 'Starting Supabase migration helper (interactive)'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error 'GitHub CLI (gh) not found. Install it: https://cli.github.com/'
  exit 1
}

$repo = Read-Host 'Repo (owner/repo)'
if (-not $repo) { Write-Error 'Repo is required (owner/repo)'; exit 1 }

Write-Host 'Press Enter to paste each secret when prompted (input is hidden).'

$pg = Read-Secret 'PG_CONN (Postgres connection string)'
$supakey = Read-Secret 'SUPABASE_KEY (Service Role)'
$supaanon = Read-Secret 'SUPABASE_ANON_KEY (Anon public key)'
$supurl = Read-Host 'SUPABASE_URL (e.g. https://pykshzedlcmzrutzqnpg.supabase.co)'
if (-not $supurl) { Write-Error 'SUPABASE_URL is required'; exit 1 }
$supat = Read-Secret 'SUPABASE_ACCESS_TOKEN (Supabase CLI token)'

Write-Host 'Checking gh authentication...'
try {
  gh auth status -t >$null 2>&1
} catch {
  Write-Host 'Not authenticated with gh; opening browser to login...'
  gh auth login --web
}

Write-Host 'Setting repository secrets (hidden inputs)'
gh secret set PG_CONN -b --body $pg --repo $repo
gh secret set SUPABASE_KEY -b --body $supakey --repo $repo
gh secret set SUPABASE_ANON_KEY -b --body $supaanon --repo $repo
gh secret set SUPABASE_URL -b --body $supurl --repo $repo
gh secret set SUPABASE_ACCESS_TOKEN -b --body $supat --repo $repo

Write-Host 'Secrets defined. Triggering migration workflow...'
gh workflow run supabase_migrate.yml --repo $repo --ref main

Write-Host 'Waiting a few seconds for GitHub to register the run...'
Start-Sleep -Seconds 6

$run = gh run list --repo $repo --workflow=supabase_migrate.yml --limit 1 --json databaseId,status,conclusion,headBranch | ConvertFrom-Json
if ($run -and $run.Count -gt 0) {
  $id = $run[0].databaseId
  Write-Host "Latest migration run id: $id; status: $($run[0].status)"
  gh run view $id --repo $repo --log
} else {
  Write-Host 'No recent run found. Check Actions in GitHub.'
}

Read-Host -Prompt 'Press Enter to continue and run function deploy workflow (or Ctrl+C to abort)'
Write-Host 'Triggering functions deploy workflow...'
gh workflow run supabase_deploy_functions.yml --repo $repo --ref main
Start-Sleep -Seconds 6
$run2 = gh run list --repo $repo --workflow=supabase_deploy_functions.yml --limit 1 --json databaseId,status,conclusion,headBranch | ConvertFrom-Json
if ($run2 -and $run2.Count -gt 0) {
  $id2 = $run2[0].databaseId
  Write-Host "Latest functions run id: $id2; status: $($run2[0].status)"
  gh run view $id2 --repo $repo --log
} else {
  Write-Host 'No recent functions run found. Check Actions in GitHub.'
}

Write-Host 'Done. If any step failed, copy the logs and paste here and I will help diagnose.'
