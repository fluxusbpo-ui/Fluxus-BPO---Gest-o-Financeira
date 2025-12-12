-- Add checkout_session_id to assinaturas if not exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assinaturas'
  ) THEN
    EXECUTE 'ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS checkout_session_id text';
  END IF;
END
$$;
