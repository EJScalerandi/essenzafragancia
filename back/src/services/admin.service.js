const bcrypt = require('bcryptjs');
const { query } = require('../db/postgres');

async function getAdminByUsername(username) {
  const { rows } = await query(
    `select id, username::text as username, password_hash
       from public.admin_users
      where username = $1
      limit 1`,
    [String(username || '').trim()]
  );

  const row = rows[0];
  if (!row) return null;

  return { id: row.id, username: row.username, passwordHash: row.password_hash };
}

async function createAdmin({ username, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const { rows } = await query(
    `insert into public.admin_users (username, password_hash)
     values ($1, $2)
     on conflict (username) do update set
       password_hash = excluded.password_hash,
       updated_at = now()
     returning id, username::text as username`,
    [String(username || '').trim(), passwordHash]
  );

  return rows[0];
}

module.exports = { getAdminByUsername, createAdmin };
