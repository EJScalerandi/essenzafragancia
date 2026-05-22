const { query, withClient } = require('../db/postgres');

const BANK_TRANSFER_MESSAGE =
  'Con transferencia o depósito tenés precio especial. Coordinamos la acreditación y el envío por WhatsApp.';

const DEFAULT_MUSIC = {
  enabled: false,
  mode: 'sequential',
  tracks: [],
};

const DEFAULT_HOME_IMAGES = [
  { id: 'hero-hawas-malibu', title: 'HAWAS MALIBU', fileName: 'hawas-malibu.svg', url: '/products/hawas-malibu.svg', enabled: true, sortOrder: 1, uploadedAt: '2026-05-22T00:00:00.000Z' },
  { id: 'hero-yara-candy', title: 'YARA CANDY', fileName: 'yara-candy.svg', url: '/products/yara-candy.svg', enabled: true, sortOrder: 2, uploadedAt: '2026-05-22T00:00:00.000Z' },
  { id: 'hero-the-most-wanted', title: 'The Most Wanted Azzaro 100ML', fileName: 'the-most-wanted-azzaro.svg', url: '/products/the-most-wanted-azzaro.svg', enabled: true, sortOrder: 3, uploadedAt: '2026-05-22T00:00:00.000Z' },
  { id: 'hero-combo-decants', title: 'COMBO 5 DECANTS DE 5ML', fileName: 'combo-5-decants-5ml.svg', url: '/products/combo-5-decants-5ml.svg', enabled: true, sortOrder: 4, uploadedAt: '2026-05-22T00:00:00.000Z' },
];

const DEFAULT_PAYMENTS = {
  mercadopago: { enabled: true },
  bankTransfer: {
    enabled: true,
    accountHolder: '',
    bankName: '',
    alias: '',
    cbu: '',
    cuit: '20462263970',
    instructions: BANK_TRANSFER_MESSAGE,
  },
};

const DEFAULT_CONTACT_LINKS = {
  instagramUrl: '',
  facebookUrl: '',
  whatsappNumber: '543572585775',
  addressText: '',
  addressUrl: '',
};

const DEFAULT_STORE = {
  storeName: 'Essenza Fragancia',
  music: DEFAULT_MUSIC,
  homeImages: DEFAULT_HOME_IMAGES,
  payments: DEFAULT_PAYMENTS,
  contactLinks: DEFAULT_CONTACT_LINKS,
};

function normalizeTrack(track, index) {
  return {
    id: String(track.id || `track-${index + 1}`),
    title: String(track.title || track.fileName || `Tema ${index + 1}`),
    fileName: String(track.fileName || ''),
    url: String(track.url || ''),
    enabled: track.enabled !== false,
    sortOrder: Number.isFinite(Number(track.sortOrder)) ? Number(track.sortOrder) : index + 1,
    uploadedAt: track.uploadedAt || null,
  };
}

function normalizeMusicSettings(value) {
  const music = value && typeof value === 'object' ? value : DEFAULT_MUSIC;
  const tracks = Array.isArray(music.tracks) ? music.tracks : [];
  return {
    enabled: music.enabled === true,
    mode: music.mode === 'random' ? 'random' : 'sequential',
    tracks: tracks
      .filter((track) => track && track.url)
      .slice(0, 10)
      .map(normalizeTrack)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function normalizeHomeImage(image, index) {
  return {
    id: String(image.id || `home-image-${index + 1}`),
    title: String(image.title || image.fileName || `Imagen ${index + 1}`),
    fileName: String(image.fileName || ''),
    url: String(image.url || ''),
    enabled: image.enabled !== false,
    sortOrder: Number.isFinite(Number(image.sortOrder)) ? Number(image.sortOrder) : index + 1,
    uploadedAt: image.uploadedAt || null,
  };
}

function normalizeHomeImages(value = []) {
  const images = Array.isArray(value) ? value : [];
  return images
    .filter((image) => image && image.url)
    .slice(0, 8)
    .map(normalizeHomeImage)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizePayments(value = {}) {
  const payments = value && typeof value === 'object' ? value : {};
  const bank = payments.bankTransfer && typeof payments.bankTransfer === 'object' ? payments.bankTransfer : {};
  const mp = payments.mercadopago && typeof payments.mercadopago === 'object' ? payments.mercadopago : {};

  return {
    mercadopago: {
      enabled: mp.enabled !== false,
    },
    bankTransfer: {
      enabled: bank.enabled !== false,
      accountHolder: String(bank.accountHolder || ''),
      bankName: String(bank.bankName || ''),
      alias: String(bank.alias || ''),
      cbu: String(bank.cbu || ''),
      cuit: String(bank.cuit || DEFAULT_PAYMENTS.bankTransfer.cuit),
      instructions: String(bank.instructions || BANK_TRANSFER_MESSAGE),
    },
  };
}

function normalizeContactLinks(value = {}) {
  const contact = value && typeof value === 'object' ? value : {};
  return {
    instagramUrl: String(contact.instagramUrl || '').trim(),
    facebookUrl: String(contact.facebookUrl || '').trim(),
    whatsappNumber: String(contact.whatsappNumber || DEFAULT_CONTACT_LINKS.whatsappNumber).trim(),
    addressText: String(contact.addressText || '').trim(),
    addressUrl: String(contact.addressUrl || '').trim(),
  };
}

function normalizeStoreSettings(value = {}) {
  return {
    ...DEFAULT_STORE,
    ...value,
    storeName: String(value.storeName || DEFAULT_STORE.storeName).trim() || DEFAULT_STORE.storeName,
    music: normalizeMusicSettings(value.music || DEFAULT_MUSIC),
    homeImages: normalizeHomeImages(value.homeImages || DEFAULT_HOME_IMAGES),
    payments: normalizePayments(value.payments || DEFAULT_PAYMENTS),
    contactLinks: normalizeContactLinks(value.contactLinks || DEFAULT_CONTACT_LINKS),
  };
}

function mapTrack(row) {
  return normalizeTrack({
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    url: row.url,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null,
  }, Number(row.sort_order || 1) - 1);
}

function mapHomeImage(row) {
  return normalizeHomeImage({
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    url: row.url,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null,
  }, Number(row.sort_order || 1) - 1);
}

function mapPayments(row) {
  return normalizePayments({
    mercadopago: { enabled: row.mercadopago_enabled !== false },
    bankTransfer: {
      enabled: row.bank_transfer_enabled !== false,
      accountHolder: row.bank_transfer_account_holder || '',
      bankName: row.bank_transfer_bank_name || '',
      alias: row.bank_transfer_alias || '',
      cbu: row.bank_transfer_cbu || '',
      cuit: row.bank_transfer_cuit || DEFAULT_PAYMENTS.bankTransfer.cuit,
      instructions: row.bank_transfer_instructions || BANK_TRANSFER_MESSAGE,
    },
  });
}

function mapContactLinks(row) {
  return normalizeContactLinks({
    instagramUrl: row.contact_instagram_url || '',
    facebookUrl: row.contact_facebook_url || '',
    whatsappNumber: row.contact_whatsapp_number || DEFAULT_CONTACT_LINKS.whatsappNumber,
    addressText: row.contact_address_text || '',
    addressUrl: row.contact_address_url || '',
  });
}

async function getStoreSettings() {
  const { rows: settingsRows } = await query(
    `select store_name, music_enabled, music_mode,
            mercadopago_enabled,
            bank_transfer_enabled, bank_transfer_account_holder, bank_transfer_bank_name,
            bank_transfer_alias, bank_transfer_cbu, bank_transfer_cuit, bank_transfer_instructions,
            contact_instagram_url, contact_facebook_url, contact_whatsapp_number,
            contact_address_text, contact_address_url
       from public.store_settings
      where id = true
      limit 1`
  );

  if (!settingsRows.length) {
    await query(
      `insert into public.store_settings
        (id, store_name, music_enabled, music_mode, mercadopago_enabled, bank_transfer_enabled,
         bank_transfer_cuit, bank_transfer_instructions, contact_whatsapp_number)
       values (true, $1, $2, $3, true, true, $4, $5, $6)
       on conflict (id) do nothing`,
      [
        DEFAULT_STORE.storeName,
        DEFAULT_STORE.music.enabled,
        DEFAULT_STORE.music.mode,
        DEFAULT_STORE.payments.bankTransfer.cuit,
        DEFAULT_STORE.payments.bankTransfer.instructions,
        DEFAULT_STORE.contactLinks.whatsappNumber,
      ]
    );
  }

  const settings = settingsRows[0] || {
    store_name: DEFAULT_STORE.storeName,
    music_enabled: DEFAULT_STORE.music.enabled,
    music_mode: DEFAULT_STORE.music.mode,
    mercadopago_enabled: true,
    bank_transfer_enabled: true,
    bank_transfer_cuit: DEFAULT_STORE.payments.bankTransfer.cuit,
    bank_transfer_instructions: BANK_TRANSFER_MESSAGE,
    contact_instagram_url: '',
    contact_facebook_url: '',
    contact_whatsapp_number: DEFAULT_STORE.contactLinks.whatsappNumber,
    contact_address_text: '',
    contact_address_url: '',
  };

  const { rows: trackRows } = await query(
    `select id, title, file_name, url, enabled, sort_order, uploaded_at
       from public.music_tracks
      order by sort_order asc, uploaded_at asc`
  );

  const { rows: homeImageRows } = await query(
    `select id, title, file_name, url, enabled, sort_order, uploaded_at
       from public.home_images
      order by sort_order asc, uploaded_at asc`
  );

  return normalizeStoreSettings({
    storeName: settings.store_name,
    music: {
      enabled: settings.music_enabled === true,
      mode: settings.music_mode === 'random' ? 'random' : 'sequential',
      tracks: trackRows.map(mapTrack),
    },
    homeImages: homeImageRows.map(mapHomeImage),
    payments: mapPayments(settings),
    contactLinks: mapContactLinks(settings),
  });
}

async function replaceMusicTracks(client, incomingTracks) {
  const current = await client.query('select id, file_data, mime_type, size_bytes, storage_bucket, storage_path from public.music_tracks');
  const byId = new Map(current.rows.map((row) => [row.id, row]));

  await client.query('delete from public.music_tracks');

  const tracks = normalizeMusicSettings({ tracks: incomingTracks }).tracks;
  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index];
    const existing = byId.get(track.id) || {};
    await client.query(
      `insert into public.music_tracks
        (id, title, file_name, storage_bucket, storage_path, url, mime_type, size_bytes, file_data, enabled, sort_order, uploaded_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::bytea, $10, $11, coalesce($12::timestamptz, now()))`,
      [
        track.id,
        track.title,
        track.fileName || existing.file_name || '',
        existing.storage_bucket || 'store-music',
        existing.storage_path || track.fileName || '',
        track.url,
        existing.mime_type || 'audio/mpeg',
        existing.size_bytes || null,
        existing.file_data || null,
        track.enabled !== false,
        index + 1,
        track.uploadedAt || null,
      ]
    );
  }
}

async function replaceHomeImages(client, incomingImages) {
  const current = await client.query('select id, file_data, mime_type, size_bytes, storage_bucket, storage_path from public.home_images');
  const byId = new Map(current.rows.map((row) => [row.id, row]));

  await client.query('delete from public.home_images');

  const images = normalizeHomeImages(incomingImages);
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const existing = byId.get(image.id) || {};
    await client.query(
      `insert into public.home_images
        (id, title, file_name, storage_bucket, storage_path, url, mime_type, size_bytes, file_data, enabled, sort_order, uploaded_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::bytea, $10, $11, coalesce($12::timestamptz, now()))`,
      [
        image.id,
        image.title,
        image.fileName || existing.file_name || '',
        existing.storage_bucket || 'store-home-images',
        existing.storage_path || image.fileName || '',
        image.url,
        existing.mime_type || 'image/svg+xml',
        existing.size_bytes || null,
        existing.file_data || null,
        image.enabled !== false,
        index + 1,
        image.uploadedAt || null,
      ]
    );
  }
}

async function updateStoreSettings(patch) {
  await withClient(async (client) => {
    const current = await getStoreSettings();
    const nextMusic = patch.music ? normalizeMusicSettings({ ...current.music, ...patch.music }) : current.music;
    const nextHomeImages = Array.isArray(patch.homeImages) ? normalizeHomeImages(patch.homeImages) : current.homeImages;
    const nextPayments = patch.payments ? normalizePayments({ ...current.payments, ...patch.payments }) : current.payments;
    const nextContactLinks = patch.contactLinks ? normalizeContactLinks({ ...current.contactLinks, ...patch.contactLinks }) : current.contactLinks;
    const nextStoreName = patch.storeName ? String(patch.storeName).trim() : current.storeName;

    await client.query(
      `insert into public.store_settings
        (id, store_name, music_enabled, music_mode,
         mercadopago_enabled, bank_transfer_enabled, bank_transfer_account_holder,
         bank_transfer_bank_name, bank_transfer_alias, bank_transfer_cbu,
         bank_transfer_cuit, bank_transfer_instructions,
         contact_instagram_url, contact_facebook_url, contact_whatsapp_number,
         contact_address_text, contact_address_url)
       values (true, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       on conflict (id) do update set
         store_name = excluded.store_name,
         music_enabled = excluded.music_enabled,
         music_mode = excluded.music_mode,
         mercadopago_enabled = excluded.mercadopago_enabled,
         bank_transfer_enabled = excluded.bank_transfer_enabled,
         bank_transfer_account_holder = excluded.bank_transfer_account_holder,
         bank_transfer_bank_name = excluded.bank_transfer_bank_name,
         bank_transfer_alias = excluded.bank_transfer_alias,
         bank_transfer_cbu = excluded.bank_transfer_cbu,
         bank_transfer_cuit = excluded.bank_transfer_cuit,
         bank_transfer_instructions = excluded.bank_transfer_instructions,
         contact_instagram_url = excluded.contact_instagram_url,
         contact_facebook_url = excluded.contact_facebook_url,
         contact_whatsapp_number = excluded.contact_whatsapp_number,
         contact_address_text = excluded.contact_address_text,
         contact_address_url = excluded.contact_address_url`,
      [
        nextStoreName || DEFAULT_STORE.storeName,
        nextMusic.enabled === true,
        nextMusic.mode,
        nextPayments.mercadopago.enabled !== false,
        nextPayments.bankTransfer.enabled !== false,
        nextPayments.bankTransfer.accountHolder || '',
        nextPayments.bankTransfer.bankName || '',
        nextPayments.bankTransfer.alias || '',
        nextPayments.bankTransfer.cbu || '',
        nextPayments.bankTransfer.cuit || DEFAULT_PAYMENTS.bankTransfer.cuit,
        nextPayments.bankTransfer.instructions || BANK_TRANSFER_MESSAGE,
        nextContactLinks.instagramUrl || '',
        nextContactLinks.facebookUrl || '',
        nextContactLinks.whatsappNumber || DEFAULT_CONTACT_LINKS.whatsappNumber,
        nextContactLinks.addressText || '',
        nextContactLinks.addressUrl || '',
      ]
    );

    if (patch.music && Array.isArray(patch.music.tracks)) {
      await replaceMusicTracks(client, nextMusic.tracks);
    }

    if (Array.isArray(patch.homeImages)) {
      await replaceHomeImages(client, nextHomeImages);
    }
  });

  return getStoreSettings();
}

async function createMusicTrackFromUpload({ id, title, fileName, url, mimeType, sizeBytes, buffer }) {
  const settings = await getStoreSettings();
  const tracks = settings.music.tracks || [];
  if (tracks.length >= 10) {
    const err = new Error('El máximo permitido es de 10 temas');
    err.status = 400;
    err.code = 'LimitExceeded';
    throw err;
  }

  await query(
    `insert into public.music_tracks
      (id, title, file_name, storage_bucket, storage_path, url, mime_type, size_bytes, file_data, enabled, sort_order, uploaded_at)
     values ($1, $2, $3, 'store-music', $4, $5, $6, $7, $8, true, $9, now())`,
    [id, title, fileName, fileName, url, mimeType || 'audio/mpeg', sizeBytes || null, buffer, tracks.length + 1]
  );

  return getStoreSettings();
}

async function createHomeImageFromUpload({ id, title, fileName, url, mimeType, sizeBytes, buffer }) {
  const settings = await getStoreSettings();
  const images = settings.homeImages || [];
  if (images.length >= 8) {
    const err = new Error('El máximo permitido es de 8 imágenes de portada');
    err.status = 400;
    err.code = 'LimitExceeded';
    throw err;
  }

  await query(
    `insert into public.home_images
      (id, title, file_name, storage_bucket, storage_path, url, mime_type, size_bytes, file_data, enabled, sort_order, uploaded_at)
     values ($1, $2, $3, 'store-home-images', $4, $5, $6, $7, $8, true, $9, now())`,
    [id, title, fileName, fileName, url, mimeType || 'image/svg+xml', sizeBytes || null, buffer, images.length + 1]
  );

  return getStoreSettings();
}

async function deleteMusicTrackById(id) {
  const { rowCount } = await query('delete from public.music_tracks where id = $1', [id]);
  if (!rowCount) return null;

  const settings = await getStoreSettings();
  await updateStoreSettings({
    music: {
      ...settings.music,
      tracks: settings.music.tracks.map((track, index) => ({ ...track, sortOrder: index + 1 })),
    },
  });

  return getStoreSettings();
}

async function deleteHomeImageById(id) {
  const { rowCount } = await query('delete from public.home_images where id = $1', [id]);
  if (!rowCount) return null;

  const settings = await getStoreSettings();
  await updateStoreSettings({
    homeImages: settings.homeImages.map((image, index) => ({ ...image, sortOrder: index + 1 })),
  });

  return getStoreSettings();
}

async function getMusicTrackFileByName(fileName) {
  const { rows } = await query(
    `select file_name, mime_type, file_data
       from public.music_tracks
      where file_name = $1
      limit 1`,
    [fileName]
  );
  return rows[0] || null;
}

async function getHomeImageFileByName(fileName) {
  const { rows } = await query(
    `select file_name, mime_type, file_data
       from public.home_images
      where file_name = $1
      limit 1`,
    [fileName]
  );
  return rows[0] || null;
}

module.exports = {
  BANK_TRANSFER_MESSAGE,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_HOME_IMAGES,
  DEFAULT_MUSIC,
  DEFAULT_PAYMENTS,
  DEFAULT_STORE,
  createHomeImageFromUpload,
  createMusicTrackFromUpload,
  deleteHomeImageById,
  deleteMusicTrackById,
  getHomeImageFileByName,
  getMusicTrackFileByName,
  getStoreSettings,
  normalizeContactLinks,
  normalizeHomeImages,
  normalizeMusicSettings,
  normalizePayments,
  updateStoreSettings,
};
