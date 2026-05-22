const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson(filename, fallback) {
  const full = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(full, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(filename, data) {
  const full = path.join(DATA_DIR, filename);
  const tmp = `${full}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, full);
}

module.exports = { DATA_DIR, readJson, writeJson };
