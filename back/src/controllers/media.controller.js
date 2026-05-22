const path = require('path');
const { getHomeImageFileByName, getMusicTrackFileByName } = require('../services/store.service');
const { getProductImageFileByName } = require('../services/products.service');

function sendBinary(row, fallbackMimeType, res, next) {
  if (!row || !row.file_data) return next();

  const data = Buffer.isBuffer(row.file_data) ? row.file_data : Buffer.from(row.file_data);
  res.setHeader('Content-Type', row.mime_type || fallbackMimeType);
  res.setHeader('Content-Length', data.length);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(data);
}

async function streamMusicTrack(req, res, next) {
  try {
    const fileName = path.basename(String(req.params.fileName || ''));
    if (!fileName) return next();

    const track = await getMusicTrackFileByName(fileName);
    return sendBinary(track, 'audio/mpeg', res, next);
  } catch (err) {
    return next(err);
  }
}

async function streamHomeImage(req, res, next) {
  try {
    const fileName = path.basename(String(req.params.fileName || ''));
    if (!fileName) return next();

    const image = await getHomeImageFileByName(fileName);
    return sendBinary(image, 'image/jpeg', res, next);
  } catch (err) {
    return next(err);
  }
}

async function streamProductImage(req, res, next) {
  try {
    const fileName = path.basename(String(req.params.fileName || ''));
    if (!fileName) return next();

    const image = await getProductImageFileByName(fileName);
    return sendBinary(image, 'image/jpeg', res, next);
  } catch (err) {
    return next(err);
  }
}

module.exports = { streamHomeImage, streamMusicTrack, streamProductImage };
