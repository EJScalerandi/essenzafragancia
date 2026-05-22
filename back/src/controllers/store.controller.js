const crypto = require('crypto');
const path = require('path');
const { z } = require('zod');
const {
  createHomeImageFromUpload,
  createMusicTrackFromUpload,
  deleteHomeImageById,
  deleteMusicTrackById,
  getStoreSettings,
  updateStoreSettings,
} = require('../services/store.service');

const musicTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  fileName: z.string().max(180).optional().or(z.literal('')),
  url: z.string().min(1),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(1).max(10).optional(),
  uploadedAt: z.string().nullable().optional(),
});

const homeImageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  fileName: z.string().max(180).optional().or(z.literal('')),
  url: z.string().min(1),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(1).max(8).optional(),
  uploadedAt: z.string().nullable().optional(),
});

const musicSchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(['sequential', 'random']).optional(),
  tracks: z.array(musicTrackSchema).max(10).optional(),
});

const paymentsSchema = z.object({
  mercadopago: z.object({
    enabled: z.boolean().optional(),
  }).optional(),
  bankTransfer: z.object({
    enabled: z.boolean().optional(),
    accountHolder: z.string().max(120).optional(),
    bankName: z.string().max(120).optional(),
    alias: z.string().max(120).optional(),
    cbu: z.string().max(40).optional(),
    cuit: z.string().max(40).optional(),
    instructions: z.string().max(900).optional(),
  }).optional(),
});

const contactLinksSchema = z.object({
  instagramUrl: z.string().max(300).optional(),
  facebookUrl: z.string().max(300).optional(),
  whatsappNumber: z.string().max(80).optional(),
  addressText: z.string().max(240).optional(),
  addressUrl: z.string().max(500).optional(),
});

const patchSchema = z.object({
  storeName: z.string().min(1).max(60).optional(),
  music: musicSchema.optional(),
  homeImages: z.array(homeImageSchema).max(8).optional(),
  payments: paymentsSchema.optional(),
  contactLinks: contactLinksSchema.optional(),
});

const uploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  title: z.string().max(120).optional(),
  mimeType: z.string().optional(),
  dataUrl: z.string().min(1),
});

const MAX_MP3_BYTES = 18 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function safeBaseName(fileName) {
  const parsed = path.parse(String(fileName || 'file'));
  return String(parsed.name || 'file')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    const err = new Error('El archivo no llegó en formato base64 válido');
    err.status = 400;
    err.code = 'InvalidUpload';
    throw err;
  }
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function assertMp3({ fileName, mimeType, buffer }) {
  const name = String(fileName || '').toLowerCase();
  const type = String(mimeType || '').toLowerCase();
  const isMp3 = name.endsWith('.mp3') || type === 'audio/mpeg' || type === 'audio/mp3';

  if (!isMp3) {
    const err = new Error('Solo se aceptan archivos MP3');
    err.status = 400;
    err.code = 'InvalidFileType';
    throw err;
  }

  if (!buffer.length || buffer.length > MAX_MP3_BYTES) {
    const err = new Error('El MP3 está vacío o supera los 18 MB');
    err.status = 400;
    err.code = 'InvalidFileSize';
    throw err;
  }
}

function imageExtension({ fileName, mimeType }) {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.webp')) return 'webp';
  if (lower.endsWith('.jpeg')) return 'jpeg';
  if (lower.endsWith('.jpg')) return 'jpg';

  const type = String(mimeType || '').toLowerCase();
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg';
  return 'jpg';
}

function assertImage({ fileName, mimeType, buffer }) {
  const name = String(fileName || '').toLowerCase();
  const type = String(mimeType || '').toLowerCase();
  const isSupported =
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/png' ||
    type === 'image/webp';

  if (!isSupported) {
    const err = new Error('Solo se aceptan imágenes JPG, PNG o WEBP');
    err.status = 400;
    err.code = 'InvalidFileType';
    throw err;
  }

  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error('La imagen está vacía o supera los 8 MB');
    err.status = 400;
    err.code = 'InvalidFileSize';
    throw err;
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await getStoreSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function patchSettings(req, res, next) {
  try {
    const patch = patchSchema.parse(req.body);
    const updated = await updateStoreSettings(patch);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function uploadMusicTrack(req, res, next) {
  try {
    const payload = uploadSchema.parse(req.body);
    const parsed = parseDataUrl(payload.dataUrl);
    assertMp3({ fileName: payload.fileName, mimeType: payload.mimeType || parsed.mimeType, buffer: parsed.buffer });

    const id = crypto.randomUUID();
    const fileName = `${id}-${safeBaseName(payload.fileName)}.mp3`;
    const title = String(payload.title || payload.fileName.replace(/\.mp3$/i, '')).trim() || 'Tema';

    const updated = await createMusicTrackFromUpload({
      id,
      title,
      fileName,
      url: `/media/music/${fileName}`,
      mimeType: payload.mimeType || parsed.mimeType || 'audio/mpeg',
      sizeBytes: parsed.buffer.length,
      buffer: parsed.buffer,
    });

    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

async function uploadHomeImage(req, res, next) {
  try {
    const payload = uploadSchema.parse(req.body);
    const parsed = parseDataUrl(payload.dataUrl);
    const mimeType = payload.mimeType || parsed.mimeType;
    assertImage({ fileName: payload.fileName, mimeType, buffer: parsed.buffer });

    const id = crypto.randomUUID();
    const ext = imageExtension({ fileName: payload.fileName, mimeType });
    const fileName = `${id}-${safeBaseName(payload.fileName)}.${ext}`;
    const title = String(payload.title || payload.fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '')).trim() || 'Imagen de portada';

    const updated = await createHomeImageFromUpload({
      id,
      title,
      fileName,
      url: `/media/home-images/${fileName}`,
      mimeType: mimeType || 'image/jpeg',
      sizeBytes: parsed.buffer.length,
      buffer: parsed.buffer,
    });

    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteMusicTrack(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const updated = await deleteMusicTrackById(id);
    if (!updated) return res.status(404).json({ error: 'NotFound', message: 'Tema no encontrado' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteHomeImage(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const updated = await deleteHomeImageById(id);
    if (!updated) return res.status(404).json({ error: 'NotFound', message: 'Imagen no encontrada' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteHomeImage,
  deleteMusicTrack,
  getSettings,
  patchSettings,
  uploadHomeImage,
  uploadMusicTrack,
};
