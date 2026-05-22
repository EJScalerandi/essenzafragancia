const fs = require('fs/promises');
const path = require('path');
const { DATA_DIR, readJson, writeJson } = require('./fileStore');
const { seedProducts, seedStore } = require('./seedData');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function ensureFile(filename, initialValue) {
  const full = path.join(DATA_DIR, filename);
  try {
    await fs.access(full);
  } catch {
    await writeJson(filename, initialValue);
  }
}

async function ensureDataFiles() {
  await ensureDir(DATA_DIR);

  // Create missing files
  await ensureFile('store.json', seedStore);
  await ensureFile('products.json', seedProducts);
  await ensureFile('orders.json', []);
  await ensureFile('users.json', []);

  // Sanity: if products.json is empty, re-seed
  const products = await readJson('products.json', []);
  if (!Array.isArray(products) || products.length === 0) {
    await writeJson('products.json', seedProducts);
  }
}

module.exports = { ensureDataFiles };
