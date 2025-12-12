# Supabase Edge Functions (local dev)

This folder contains Supabase Edge Functions used by the GeP Finance project.

Quick notes to run locally:

- Ensure the local Supabase stack is running: `supabase start`.
- Export required environment variables for local testing (or create `supabase/.env`):
  - `SUPABASE_URL` (e.g. `http://127.0.0.1:54321`)
  - `SUPABASE_SERVICE_ROLE_KEY` (service role key shown by `supabase status`)
  - `SUPABASE_ANON_KEY` (optional, used by smoke tests)

- Serve functions locally:

```powershell
$env:SUPABASE_URL='http://127.0.0.1:54321'
$env:SUPABASE_SERVICE_ROLE_KEY='sb_secret_...'
npm run serve:functions
```

- Run smoke tests against the local functions:

```powershell
$env:FUNCTIONS_BASE_URL='http://127.0.0.1:54321/functions/v1'
$env:SUPABASE_URL='http://127.0.0.1:54321'
$env:SUPABASE_SERVICE_ROLE_KEY='sb_secret_...'
$env:SUPABASE_ANON_KEY='sb_publishable_...'
npm run smoke:functions
```

The functions will try to read environment variables via `Deno.env` first. If they are not found, they will attempt to read `supabase/.env` (useful for local development).

If you encounter errors about missing authorization headers, set the keys as above and re-run.
