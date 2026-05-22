-- Karolin Active - Imágenes de productos en base de datos
-- Ejecutar en Supabase SQL Editor si querés aplicarlo manualmente.
-- El backend también intenta crear estas columnas automáticamente al arrancar.

alter table public.products
  add column if not exists alt_image_url text not null default '',
  add column if not exists image_file_name text,
  add column if not exists image_mime_type text,
  add column if not exists image_size_bytes integer,
  add column if not exists image_file_data bytea,
  add column if not exists alt_image_file_name text,
  add column if not exists alt_image_mime_type text,
  add column if not exists alt_image_size_bytes integer,
  add column if not exists alt_image_file_data bytea;

create index if not exists products_image_file_name_idx
  on public.products (image_file_name);

create index if not exists products_alt_image_file_name_idx
  on public.products (alt_image_file_name);
