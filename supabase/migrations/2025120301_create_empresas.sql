-- Create table empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY,
  razao_social text NOT NULL,
  cnpj text NOT NULL,
  telefone text,
  email text,
  owner_empresa_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas (cnpj);
