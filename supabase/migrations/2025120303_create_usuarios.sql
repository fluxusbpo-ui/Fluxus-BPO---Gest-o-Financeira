-- Create table usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  senha_hash text,
  role text,
  status text DEFAULT 'ativo',
  email_confirmed boolean DEFAULT false,
  cpf text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email ON usuarios (email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_cpf ON usuarios (cpf) WHERE cpf IS NOT NULL;
