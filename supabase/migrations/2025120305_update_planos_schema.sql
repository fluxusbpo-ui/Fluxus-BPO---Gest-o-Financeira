-- Add preco_mensal and modulos to planos if not exists
ALTER TABLE planos
  ADD COLUMN IF NOT EXISTS preco_mensal numeric(10,2) DEFAULT 0;

ALTER TABLE planos
  ADD COLUMN IF NOT EXISTS modulos jsonb;
