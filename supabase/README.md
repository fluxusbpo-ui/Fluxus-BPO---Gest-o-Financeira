# Migração para Supabase

Passos recomendados para migrar o backend (SQLite/Knex) para Supabase Postgres.

1) Provisionar projeto Supabase
   - Crie um projeto Supabase e anote `DB connection string` (service_role ou usuário com permissões).

2) Rodar as migrations SQL
   - Instale `supabase-cli` (opcional) e coloque estes arquivos em `supabase/migrations`.
   - Ou rode cada arquivo SQL diretamente com `psql`/Supabase SQL editor.

   Exemplo com psql:
   ```bash
   psql "postgresql://<user>:<pass>@<host>:<port>/<db>" -f "supabase/migrations/20251203_create_empresas.sql"
   psql "..." -f "supabase/migrations/20251203_create_planos.sql"
   # e assim por diante na ordem correta
   ```

3) Exportar dados do SQLite e importar para Postgres
   - Recomendo `pgloader` (preserva tipos e constraints quando possível).
   - Exemplo PowerShell (Windows):
   ```powershell
   .\supabase\import_from_sqlite.ps1 -SqlitePath "D:/Dev/GeP Finance/backend/data/db.sqlite3" -PgConnectionString "postgresql://<user>:<pass>@<host>:5432/<db>"
   ```

4) Atualizar o código para usar `@supabase/supabase-js` ou `pg`
   - Eu gerei um `backend/src/supabaseClient.js` stub (veja o arquivo) para facilitar.
   - No servidor, configure as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`) para que o backend tenha acesso ao Supabase.

5) Autenticação
   - Substitua o fluxo de JWT custom por Supabase Auth (ou integre o sign-in com Supabase).

6) Deploy
   - Use `supabase functions deploy` para Edge Functions (se você optar por portar controllers).
      - Aplique também as políticas RLS adicionadas em `supabase/migrations/20251206_rls_policies.sql` para configurar Row Level Security nas tabelas principais.
         - Importante: políticas RLS frequentemente referenciam funções como `auth.uid()` e dependem do serviço Auth estar disponível. Para evitar erros de inicialização, aplique essas migrações em um ambiente de produção ou staging após o Auth estar operacional.
         - Para reabilitar RLS localmente para testes, execute as migrações diretamente apontando para sua URL/Postgres local com a `SUPABASE_SERVICE_ROLE_KEY` (evite expor essa chave publicamente; rotacione caso ela vaze).

   Functions
      - Edge Functions to replace backend controllers are in `supabase/functions/` (register, login, companies, plans, stripe_webhook).
      - Deploy using the `supabase_deploy_functions.yml` GitHub Action or `supabase functions deploy` locally.
      - Local development: install `supabase` CLI and run `supabase functions serve` in the repo root to serve functions at http://localhost:54321.
      - To run smoke tests locally after starting functions, run:
         ```bash
         export FUNCTIONS_BASE_URL=http://localhost:54321
         npm run smoke:functions
         ```
      - CI runs smoke tests automatically after functions are deployed (see `.github/workflows/supabase_deploy_functions.yml`).
      Client usage
       - The frontend can call functions at `https://<project-ref>.functions.supabase.co/<function>` or locally at `http://localhost:54321/<function>`.
       - Example endpoints:
          - `GET /plans` → list plans
          - `POST /register` → create user in DB
          - `POST /login` → login using `usuarios` table
          - `GET /companies?owner=<id>` → list companies for owner
          - `POST /companies` → create company (service role or functions will add owner)
          - `POST /checkout` → create checkout session (stubs if Stripe not configured)

Segurança
 - Use `service_role` somente para operações de migração; configure `anon` e RLS para regras runtime.
