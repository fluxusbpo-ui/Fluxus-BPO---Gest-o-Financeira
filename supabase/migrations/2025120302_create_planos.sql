-- Create table planos
CREATE TABLE IF NOT EXISTS planos (
  id uuid PRIMARY KEY,
  stripe_price_id text,
  nome text NOT NULL,
  max_empresas integer DEFAULT 0,
  max_usuarios integer DEFAULT 0,
  funcionalidades jsonb,
  modulos jsonb,
  preco_mensal numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
