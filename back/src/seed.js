require('dotenv').config();
const { ensureDatabase } = require('./db/ensureDatabase');

async function seed() {
  await ensureDatabase();
  // eslint-disable-next-line no-console
  console.log('[seed] done');
}

seed().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
