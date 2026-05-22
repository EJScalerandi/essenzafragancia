const { query, withClient } = require('./postgres');
const { seedProducts, seedStore } = require('./seedData');

const DEFAULT_HOME_IMAGES = [
  { id: 'hero-active-set', title: 'Set Active Essential', fileName: 'active-set.png', url: '/products/active-set.png', enabled: true, sortOrder: 1, uploadedAt: '2026-05-04T00:00:00.000Z' },
  { id: 'hero-windbreaker', title: 'Campera Rompeviento Aura', fileName: 'windbreaker.png', url: '/products/windbreaker.png', enabled: true, sortOrder: 2, uploadedAt: '2026-05-04T00:00:00.000Z' },
  { id: 'hero-hoodie-set', title: 'Hoodie Set Comfort', fileName: 'hoodie-set.png', url: '/products/hoodie-set.png', enabled: true, sortOrder: 3, uploadedAt: '2026-05-04T00:00:00.000Z' },
  { id: 'hero-basic-tee', title: 'Remera Motion Basic', fileName: 'basic-tee.png', url: '/products/basic-tee.png', enabled: true, sortOrder: 4, uploadedAt: '2026-05-04T00:00:00.000Z' },
];

async function ensureProductImageUploadColumns() {
  await query(`
    alter table public.products
      add column if not exists alt_image_url text not null default '',
      add column if not exists image_file_name text,
      add column if not exists image_mime_type text,
      add column if not exists image_size_bytes integer,
      add column if not exists image_file_data bytea,
      add column if not exists alt_image_file_name text,
      add column if not exists alt_image_mime_type text,
      add column if not exists alt_image_size_bytes integer,
      add column if not exists alt_image_file_data bytea
  `);

  await query('create index if not exists products_image_file_name_idx on public.products (image_file_name)');
  await query('create index if not exists products_alt_image_file_name_idx on public.products (alt_image_file_name)');
}

async function ensureHomeImagesTable() {
  await query(`
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
    )
  `);
  await query('create index if not exists home_images_sort_order_idx on public.home_images (sort_order asc, uploaded_at asc)');
}

async function ensurePaymentColumns() {
  await query(`
    alter table public.store_settings
      add column if not exists mercadopago_enabled boolean not null default true,
      add column if not exists bank_transfer_enabled boolean not null default true,
      add column if not exists bank_transfer_account_holder text not null default '',
      add column if not exists bank_transfer_bank_name text not null default '',
      add column if not exists bank_transfer_alias text not null default '',
      add column if not exists bank_transfer_cbu text not null default '',
      add column if not exists bank_transfer_cuit text not null default '',
      add column if not exists bank_transfer_instructions text not null default
        'Las transferencias bancarias pueden demorar un poco debido a que se debe conciliar el pago. Recibirás un correo cuando se haya realizado.',
      add column if not exists contact_instagram_url text not null default '',
      add column if not exists contact_facebook_url text not null default '',
      add column if not exists contact_whatsapp_number text not null default '',
      add column if not exists contact_address_text text not null default '',
      add column if not exists contact_address_url text not null default ''
  `);
}

async function ensureOrderPaymentProofColumns() {
  await query(`
    alter table public.orders
      add column if not exists payment_proof_file_name text,
      add column if not exists payment_proof_mime_type text,
      add column if not exists payment_proof_size_bytes integer,
      add column if not exists payment_proof_file_data bytea,
      add column if not exists payment_proof_uploaded_at timestamptz
  `);
}

async function ensureCustomerProfileColumns() {
  await query(`
    alter table public.customer_accounts
      add column if not exists first_name text not null default '',
      add column if not exists last_name text not null default '',
      add column if not exists phone text not null default '',
      add column if not exists address text not null default '',
      add column if not exists city text not null default '',
      add column if not exists province text not null default '',
      add column if not exists zip text not null default ''
  `);
}

async function ensureOrderSequences() {
  await query('create sequence if not exists public.order_mp_seq start with 1 increment by 1');
  await query('create sequence if not exists public.order_transfer_seq start with 1 increment by 1');
}

async function ensureMpCheckoutDrafts() {
  await query(`
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
    )
  `);
  await query('alter table public.mp_checkout_drafts add column if not exists user_id text references public.customer_accounts(id) on delete set null');
  await query('create index if not exists mp_checkout_drafts_user_id_idx on public.mp_checkout_drafts (user_id)');
  await query('create index if not exists mp_checkout_drafts_status_idx on public.mp_checkout_drafts (status)');
  await query('create index if not exists mp_checkout_drafts_order_id_idx on public.mp_checkout_drafts (order_id)');
}

async function ensureDatabase() {
  await query('select 1');

  const requiredTables = [
    'store_settings',
    'products',
    'product_variants',
    'customer_accounts',
    'orders',
    'order_items',
    'order_access_tokens',
    'order_messages',
    'music_tracks',
  ];

  const { rows } = await query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [requiredTables]
  );

  const found = new Set(rows.map((r) => r.table_name));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length) {
    const err = new Error(
      `Faltan tablas de Supabase: ${missing.join(', ')}. Ejecutá primero back/sql/supabase_render_backend_migration.sql o el schema inicial.`
    );
    err.status = 500;
    err.code = 'MissingDatabaseTables';
    throw err;
  }

  await query('alter table public.music_tracks add column if not exists file_data bytea');
  await ensureProductImageUploadColumns();

  await ensureCustomerProfileColumns();
  await ensureHomeImagesTable();
  await ensurePaymentColumns();
  await ensureOrderSequences();
  await ensureOrderPaymentProofColumns();
  await ensureMpCheckoutDrafts();
  await seedIfEmpty();
}

async function seedIfEmpty() {
  await withClient(async (client) => {
    await client.query(
      `insert into public.store_settings (id, store_name, music_enabled, music_mode)
       values (true, $1, $2, $3)
       on conflict (id) do nothing`,
      [seedStore.storeName || 'Karolin Active', seedStore.music?.enabled !== false, seedStore.music?.mode || 'sequential']
    );

    const productCount = await client.query('select count(*)::int as total from public.products');
    if (Number(productCount.rows[0]?.total || 0) === 0) {
      for (const product of seedProducts) {
        await client.query(
          `insert into public.products (id, name, category, description, image_url, alt_image_url, base_price, tags, active)
           values ($1, $2, $3, $4, $5, $6, $7, $8::text[], true)
           on conflict (id) do nothing`,
          [
            product.id,
            product.name,
            product.category,
            product.description || '',
            product.image || '',
            product.alternateImage || '',
            Number(product.basePrice || 0),
            product.tags || [],
          ]
        );

        const variants = Array.isArray(product.variants) ? product.variants : [];
        for (let i = 0; i < variants.length; i += 1) {
          const variant = variants[i];
          await client.query(
            `insert into public.product_variants (product_id, color, size, price, stock, compare_at_price, sort_order)
             values ($1, $2, $3, $4, $5, $6, $7)
             on conflict (product_id, color, size) do nothing`,
            [
              product.id,
              variant.color,
              variant.size,
              Number(variant.price || product.basePrice || 0),
              Number(variant.stock || 0),
              variant.compareAtPrice == null ? null : Number(variant.compareAtPrice),
              i + 1,
            ]
          );
        }
      }
    }

    const trackCount = await client.query('select count(*)::int as total from public.music_tracks');
    const tracks = Array.isArray(seedStore.music?.tracks) ? seedStore.music.tracks : [];
    if (Number(trackCount.rows[0]?.total || 0) === 0 && tracks.length) {
      for (const track of tracks.slice(0, 10)) {
        await client.query(
          `insert into public.music_tracks
             (id, title, file_name, storage_bucket, storage_path, url, enabled, sort_order, uploaded_at)
           values ($1, $2, $3, 'store-music', $4, $5, $6, $7, $8)
           on conflict (id) do nothing`,
          [
            track.id,
            track.title,
            track.fileName || '',
            track.fileName || '',
            track.url || '',
            track.enabled !== false,
            Number(track.sortOrder || 1),
            track.uploadedAt || new Date().toISOString(),
          ]
        );
      }
    }

    const homeImageCount = await client.query('select count(*)::int as total from public.home_images');
    if (Number(homeImageCount.rows[0]?.total || 0) === 0) {
      for (const image of DEFAULT_HOME_IMAGES) {
        await client.query(
          `insert into public.home_images
             (id, title, file_name, storage_bucket, storage_path, url, mime_type, enabled, sort_order, uploaded_at)
           values ($1, $2, $3, 'store-home-images', $4, $5, $6, $7, $8, $9)
           on conflict (id) do nothing`,
          [
            image.id,
            image.title,
            image.fileName || '',
            image.fileName || '',
            image.url || '',
            'image/png',
            image.enabled !== false,
            Number(image.sortOrder || 1),
            image.uploadedAt || new Date().toISOString(),
          ]
        );
      }
    }
  });
}

module.exports = { ensureDatabase };
