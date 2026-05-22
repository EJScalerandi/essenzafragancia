-- Karolin Active - Imagen alternativa para hover en productos
-- Ejecutar en Supabase SQL Editor si querés aplicarlo manualmente.
-- El backend también intenta crear esta columna automáticamente al arrancar.

alter table public.products
  add column if not exists alt_image_url text not null default '';
