-- Add cpf column to usuarios and unique index
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS cpf text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_cpf ON usuarios (cpf) WHERE cpf IS NOT NULL;
