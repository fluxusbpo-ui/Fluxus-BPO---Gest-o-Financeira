-- Add owner_empresa_id to empresas and backfill
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS owner_empresa_id uuid;

-- Backfill existing rows
UPDATE empresas SET owner_empresa_id = id WHERE owner_empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_owner ON empresas (owner_empresa_id);
