const crypto = require('crypto');
const path = require('path');
const { z } = require('zod');

const {
  listProducts,
  upsertProduct,
  deleteProduct,
  getProductById,
  updateProductImageFromUpload,
} = require('../services/products.service');

const variantSchema = z.object({
  color: z.string().min(1),
  size: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
});

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  image: z.string().optional().or(z.literal('')),
  alternateImage: z.string().optional().or(z.literal('')),
  basePrice: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).min(1),
});

const uploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.string().optional(),
  dataUrl: z.string().min(1),
});

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

async function list(req, res, next) {
  try {
    const products = await listProducts();
    res.json({ items: products });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = productSchema.parse(req.body);
    const existing = await getProductById(product.id);
    if (existing) return res.status(409).json({ error: 'Conflict', message: 'Ya existe un producto con ese id' });
    await upsertProduct(product);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = req.params.id;
    const body = productSchema.parse({ ...req.body, id });
    await upsertProduct(body);
    res.json(body);
  } catch (err) {
    next(err);
  }
}

async function uploadProductImage(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const kind = req.params.kind === 'alt' ? 'alt' : 'main';
    const payload = uploadSchema.parse(req.body);
    const parsed = parseDataUrl(payload.dataUrl);
    const mimeType = payload.mimeType || parsed.mimeType;
    assertImage({ fileName: payload.fileName, mimeType, buffer: parsed.buffer });

    const ext = imageExtension({ fileName: payload.fileName, mimeType });
    const fileName = `${id}-${kind}-${crypto.randomUUID()}-${safeBaseName(payload.fileName)}.${ext}`;

    const product = await updateProductImageFromUpload({
      id,
      kind,
      fileName,
      url: `/media/products/${fileName}`,
      mimeType: mimeType || 'image/jpeg',
      sizeBytes: parsed.buffer.length,
      buffer: parsed.buffer,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = req.params.id;
    const result = await deleteProduct(id);
    if (!result.deleted) return res.status(404).json({ error: 'NotFound', message: 'Producto no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, uploadProductImage, remove };
