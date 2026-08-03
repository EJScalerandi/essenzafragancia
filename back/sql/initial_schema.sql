-- Essenza Fragancia - Initial Supabase schema.
-- Run this once against a brand-new (empty) Postgres database, before the
-- backend's own ensureDatabase() migrations (which only ADD columns/tables,
-- they never create these base tables).
--
-- After this script, boot the backend once with DATABASE_URL pointing here:
-- ensureDatabase() will add the remaining columns (payment settings, welcome
-- popup, promotions, home images, mp checkout drafts, etc.) and seed the
-- initial store settings + demo products automatically.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id boolean primary key default true,
  store_name text not null default 'Essenza Fragancia',
  music_enabled boolean not null default false,
  music_mode text not null default 'sequential',
  mercadopago_enabled boolean not null default true,
  bank_transfer_enabled boolean not null default true,
  bank_transfer_account_holder text not null default '',
  bank_transfer_bank_name text not null default '',
  bank_transfer_alias text not null default '',
  bank_transfer_cbu text not null default '',
  bank_transfer_cuit text not null default '20462263970',
  bank_transfer_instructions text not null default
    'Con transferencia o depósito tenés precio especial. Coordinamos la acreditación y el envío por WhatsApp.',
  chat_payment_enabled boolean not null default true,
  chat_payment_subtitle text not null default
    '¿Preferís coordinar tu pago vos mismo? Escribinos por WhatsApp y lo resolvemos directo con vos.',
  chat_payment_warning text not null default
    'El monto puede variar según la cantidad de cuotas: el pago financiado puede estar sujeto a intereses.',
  contact_instagram_url text not null default '',
  contact_facebook_url text not null default '',
  contact_whatsapp_number text not null default '543572585775',
  contact_address_text text not null default '',
  contact_address_url text not null default '',
  welcome_popup_enabled boolean not null default true,
  welcome_popup_title text not null default 'Hola',
  welcome_popup_subtitle text not null default 'Hacé tu pedido en simples pasos:',
  welcome_popup_steps jsonb not null default
    '["Elegí los productos que quieras","Revisá y completá tu pedido","¡Listo! Generamos tu pedido para que el comercio lo reciba por WhatsApp"]'::jsonb,
  promotions_json jsonb not null default
    '[{"id":"perk-decant-5ml","title":"Decant de 5ML de regalo","description":"En compras desde $150.000 te llevás un decant de 5ML de regalo.","minAmount":150000,"enabled":true,"sortOrder":1}]'::jsonb,
  constraint store_settings_singleton check (id)
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default '',
  description text not null default '',
  image_url text not null default '',
  alt_image_url text not null default '',
  base_price numeric(12,2) not null default 0,
  tags text[] not null default '{}',
  active boolean not null default true,
  image_file_name text,
  image_mime_type text,
  image_size_bytes integer,
  image_file_data bytea,
  alt_image_file_name text,
  alt_image_mime_type text,
  alt_image_size_bytes integer,
  alt_image_file_data bytea,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_image_file_name_idx on public.products (image_file_name);
create index if not exists products_alt_image_file_name_idx on public.products (alt_image_file_name);
create index if not exists products_active_idx on public.products (active);

create table if not exists public.product_variants (
  id bigserial primary key,
  product_id text not null references public.products(id) on delete cascade,
  color text not null default '',
  size text not null default '',
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  compare_at_price numeric(12,2),
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (product_id, color, size)
);
create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

create table if not exists public.customer_accounts (
  id text primary key,
  email citext not null unique,
  full_name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  province text not null default '',
  zip text not null default '',
  password_hash text not null default '',
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id text references public.customer_accounts(id) on delete set null,
  customer_full_name text not null default '',
  customer_email citext not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  customer_city text not null default '',
  customer_province text not null default '',
  customer_zip text not null default '',
  note text not null default '',
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_provider text,
  payment_status text not null default 'created',
  payment_status_detail text,
  payment_id text,
  payment_preference_id text,
  fulfillment_status text not null default 'created',
  token_ttl_days integer not null default 90,
  buyer_token_expires_at timestamptz,
  payment_proof_file_name text,
  payment_proof_mime_type text,
  payment_proof_size_bytes integer,
  payment_proof_file_data bytea,
  payment_proof_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  cart_item_id text not null default '',
  product_id text,
  product_name text not null default '',
  unit_price numeric(12,2) not null default 0,
  quantity integer not null default 1,
  variant_color text,
  variant_size text,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.order_access_tokens (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists order_access_tokens_order_id_idx on public.order_access_tokens (order_id);
create index if not exists order_access_tokens_hash_idx on public.order_access_tokens (token_hash);

create table if not exists public.order_messages (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  sender text not null default 'buyer',
  body text not null default '',
  read_by_admin boolean not null default false,
  read_by_buyer boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists order_messages_order_id_idx on public.order_messages (order_id);

create table if not exists public.music_tracks (
  id text primary key,
  title text not null default '',
  file_name text,
  storage_bucket text,
  storage_path text,
  url text not null default '',
  mime_type text,
  size_bytes integer,
  file_data bytea,
  enabled boolean not null default true,
  sort_order integer not null default 1,
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_music_tracks_enabled_order on public.music_tracks (enabled, sort_order);

commit;
