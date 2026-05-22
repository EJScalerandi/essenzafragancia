-- Karolin Active - Migration required before deploying the Render backend.
-- Run this after the initial Supabase schema if you already created the DB.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

-- The Render backend stores uploaded MP3 files in Postgres so uploads persist
-- even when Render restarts the service.
alter table public.music_tracks
  add column if not exists file_data bytea;

-- Make reordering tracks safer from the admin UI.
alter table public.music_tracks
  drop constraint if exists music_tracks_sort_order_key;

drop index if exists music_tracks_sort_order_key;

create index if not exists idx_music_tracks_enabled_order
  on public.music_tracks(enabled, sort_order);

commit;
