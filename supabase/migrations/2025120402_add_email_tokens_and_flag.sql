-- Create table email_tokens and add email_confirmed flag to usuarios
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usuarios'
  ) THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS email_tokens (
      id uuid PRIMARY KEY,
      user_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
      token text NOT NULL UNIQUE,
      expires_at timestamptz,
      used boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )';

    EXECUTE 'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false';
  END IF;
END
$$;
