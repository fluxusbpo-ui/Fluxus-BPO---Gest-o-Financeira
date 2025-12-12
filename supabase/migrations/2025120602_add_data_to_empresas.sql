-- Add data jsonb column to empresas
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS data jsonb;
