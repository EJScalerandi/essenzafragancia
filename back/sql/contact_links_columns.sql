alter table public.store_settings
  add column if not exists contact_instagram_url text not null default '',
  add column if not exists contact_facebook_url text not null default '',
  add column if not exists contact_whatsapp_number text not null default '',
  add column if not exists contact_address_text text not null default '',
  add column if not exists contact_address_url text not null default '';
