-- Karolin Active - imágenes administrables de portada
-- Ejecutar en Supabase SQL Editor si querés crear la tabla manualmente.
-- El backend también la crea automáticamente al arrancar.

create table if not exists public.home_images (
  id text primary key,
  title text not null,
  file_name text,
  storage_bucket text,
  storage_path text,
  url text not null,
  mime_type text,
  size_bytes integer,
  file_data bytea,
  enabled boolean not null default true,
  sort_order integer not null default 1,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_images_sort_order_idx
  on public.home_images (sort_order asc, uploaded_at asc);

insert into public.home_images
  (id, title, file_name, storage_bucket, storage_path, url, mime_type, enabled, sort_order, uploaded_at)
values
  ('hero-active-set', 'Set Active Essential', 'active-set.png', 'store-home-images', 'active-set.png', '/products/active-set.png', 'image/png', true, 1, '2026-05-04T00:00:00.000Z'),
  ('hero-windbreaker', 'Campera Rompeviento Aura', 'windbreaker.png', 'store-home-images', 'windbreaker.png', '/products/windbreaker.png', 'image/png', true, 2, '2026-05-04T00:00:00.000Z'),
  ('hero-hoodie-set', 'Hoodie Set Comfort', 'hoodie-set.png', 'store-home-images', 'hoodie-set.png', '/products/hoodie-set.png', 'image/png', true, 3, '2026-05-04T00:00:00.000Z'),
  ('hero-basic-tee', 'Remera Motion Basic', 'basic-tee.png', 'store-home-images', 'basic-tee.png', '/products/basic-tee.png', 'image/png', true, 4, '2026-05-04T00:00:00.000Z')
on conflict (id) do nothing;
