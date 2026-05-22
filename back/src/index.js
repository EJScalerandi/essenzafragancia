const { createApp } = require('./app');
const { ensureDatabase } = require('./db/ensureDatabase');

require('dotenv').config();

async function main() {
  await ensureDatabase();

  const app = createApp();
  const port = Number(process.env.PORT || 4000);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[backend] fatal error', err);
  process.exit(1);
});
