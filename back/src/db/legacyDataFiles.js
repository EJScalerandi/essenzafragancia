const { ensureDataFiles } = require('./ensureDataFiles');

async function ensureLegacyDataFiles() {
  await ensureDataFiles();
}

module.exports = { ensureLegacyDataFiles };
