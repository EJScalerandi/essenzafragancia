-- Karolin Active - formas de pago configurables
-- Ejecutar en Supabase SQL Editor si querés aplicar manualmente.
-- El backend también intenta agregar estas columnas automáticamente al arrancar.

alter table public.store_settings
  add column if not exists mercadopago_enabled boolean not null default true,
  add column if not exists bank_transfer_enabled boolean not null default true,
  add column if not exists bank_transfer_account_holder text not null default '',
  add column if not exists bank_transfer_bank_name text not null default '',
  add column if not exists bank_transfer_alias text not null default '',
  add column if not exists bank_transfer_cbu text not null default '',
  add column if not exists bank_transfer_cuit text not null default '',
  add column if not exists bank_transfer_instructions text not null default
    'Las transferencias bancarias pueden demorar un poco debido a que se debe conciliar el pago. Recibirás un correo cuando se haya realizado.';
