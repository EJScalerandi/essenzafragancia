const { Pool } = require('pg');

function sslConfig() {
  const raw = String(process.env.DATABASE_SSL || '').toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return { rejectUnauthorized: false };
}

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: sslConfig(),
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 10000),
    })
  : null;

function getPool() {
  if (!pool) {
    const err = new Error('DATABASE_URL no configurada');
    err.status = 500;
    err.code = 'DatabaseNotConfigured';
    throw err;
  }
  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function withClient(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => null);
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  if (pool) await pool.end();
}

module.exports = { getPool, query, withClient, closePool };
