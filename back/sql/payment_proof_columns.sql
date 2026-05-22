-- Opcional: el backend también agrega estas columnas automáticamente al iniciar.
-- Usá este SQL solo si querés aplicarlo manualmente en Supabase antes del deploy.

alter table public.orders
  add column if not exists payment_proof_file_name text,
  add column if not exists payment_proof_mime_type text,
  add column if not exists payment_proof_size_bytes integer,
  add column if not exists payment_proof_file_data bytea,
  add column if not exists payment_proof_uploaded_at timestamptz;
