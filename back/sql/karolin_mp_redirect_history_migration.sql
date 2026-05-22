-- Karolin Active - MercadoPago con redirección oficial + pedidos correlativos
-- Ejecutar en Supabase SQL Editor si querés aplicarlo manualmente.
-- El backend también intenta crear esto automáticamente al arrancar.

create sequence if not exists public.order_mp_seq start with 1 increment by 1;
create sequence if not exists public.order_transfer_seq start with 1 increment by 1;

create table if not exists public.mp_checkout_drafts (
  id text primary key,
  customer_json jsonb not null,
  items_json jsonb not null,
  note text not null default '',
  create_account boolean not null default false,
  password_hash text,
  user_id text references public.customer_accounts(id) on delete set null,
  status text not null default 'created',
  preference_id text,
  payment_id text,
  merchant_order_id text,
  order_id text references public.orders(id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mp_checkout_drafts_status_idx
  on public.mp_checkout_drafts (status);

create index if not exists mp_checkout_drafts_order_id_idx
  on public.mp_checkout_drafts (order_id);


alter table public.mp_checkout_drafts
  add column if not exists user_id text references public.customer_accounts(id) on delete set null;

create index if not exists mp_checkout_drafts_user_id_idx
  on public.mp_checkout_drafts (user_id);


alter table public.customer_accounts
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists address text not null default '',
  add column if not exists city text not null default '',
  add column if not exists province text not null default '',
  add column if not exists zip text not null default '';


-- Perfil persistente de compradores
alter table public.customer_accounts
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists address text not null default '',
  add column if not exists city text not null default '',
  add column if not exists province text not null default '',
  add column if not exists zip text not null default '';

update public.customer_accounts
   set first_name = coalesce(nullif(first_name, ''), split_part(full_name, ' ', 1)),
       last_name = case
         when coalesce(last_name, '') <> '' then last_name
         when position(' ' in full_name) > 0 then regexp_replace(full_name, '^[^ ]+\s*', '')
         else ''
       end
 where coalesce(full_name, '') <> '';
