-- Create table assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id uuid PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES planos(id),
  stripe_subscription_id text,
  status text,
  inicio timestamptz,
  fim timestamptz,
  checkout_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
