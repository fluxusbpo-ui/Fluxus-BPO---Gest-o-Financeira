Running backend with Supabase

1) Set environment variables (recommended):
  - `SUPABASE_URL` = your project URL (ex.: https://pykshzedlcmzrutzqnpg.supabase.co)
  - `SUPABASE_KEY` = Supabase Service Role key (keep secret)
  - `PG_CONN` = Postgres connection string (for migrations/import)
  - `JWT_SECRET` = optional JWT secret for server-issued tokens

2) Install & run
  - `cd backend`
  - `npm ci`
  - `npm run dev`  (runs nodemon on src/index.js)

3) To seed default plans using Supabase (service role):
  - `cd backend`
  - `SUPABASE_URL=https://<your>.supabase.co SUPABASE_KEY=<service_role> node ../scripts/seed_plans.js`
5) Decommissioning Express (optional)
  - Validate Edge Functions and API coverage before shutting down the Express backend.
  - Once functions are fully tested and deployed, stop the Express backend by stopping the process, then remove or archive `backend/src` route handlers and `package.json` scripts.
  - Remove `knexfile.js`, `backend/data/db.sqlite3`, and the knex migrations and seeds only after a successful backup and migration to Supabase.


  Cleaning notes:
  - The project previously used Knex + SQLite; after migrating to Supabase, knex/SQLite config and seeds are deprecated.
  - Files such as `knexfile.js`, local `db.sqlite3`, and knex-based seed/migration code are kept for reference but deprecated. Use Supabase SQL migrations in `supabase/migrations`.

4) To migrate data from SQLite to Supabase Postgres, see `supabase/README.md` which contains migration SQLs and the import script.
