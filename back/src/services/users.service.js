const { query } = require('../db/postgres');

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function buildFullName({ fullName, firstName, lastName }) {
  const fromParts = [firstName || '', lastName || ''].map((s) => String(s || '').trim()).filter(Boolean).join(' ');
  return fromParts || String(fullName || '').trim();
}

function mapUser(row) {
  if (!row) return null;

  const fallback = splitFullName(row.full_name || '');
  const firstName = row.first_name || fallback.firstName || '';
  const lastName = row.last_name || fallback.lastName || '';
  const fullName = buildFullName({ fullName: row.full_name, firstName, lastName });

  return {
    id: row.id,
    email: row.email,
    fullName,
    firstName,
    lastName,
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    province: row.province || '',
    zip: row.zip || '',
    passwordHash: row.password_hash || '',
    resetTokenHash: row.reset_token_hash || null,
    resetTokenExpiresAt: row.reset_token_expires_at ? new Date(row.reset_token_expires_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

const USER_COLUMNS = `
  id, email::text as email, full_name, first_name, last_name, phone, address, city, province, zip,
  password_hash, reset_token_hash, reset_token_expires_at, created_at, updated_at
`;

async function listUsers() {
  const { rows } = await query(
    `select ${USER_COLUMNS}
       from public.customer_accounts
      order by created_at desc`
  );
  return rows.map(mapUser);
}

async function getUserByEmail(email) {
  const { rows } = await query(
    `select ${USER_COLUMNS}
       from public.customer_accounts
      where email = $1
      limit 1`,
    [String(email || '').toLowerCase()]
  );
  return mapUser(rows[0]);
}

async function getUserById(id) {
  const { rows } = await query(
    `select ${USER_COLUMNS}
       from public.customer_accounts
      where id = $1
      limit 1`,
    [id]
  );
  return mapUser(rows[0]);
}

async function upsertUser(user) {
  const firstName = user.firstName ?? splitFullName(user.fullName || '').firstName;
  const lastName = user.lastName ?? splitFullName(user.fullName || '').lastName;
  const fullName = buildFullName({ fullName: user.fullName, firstName, lastName });

  await query(
    `insert into public.customer_accounts
       (id, email, full_name, first_name, last_name, phone, address, city, province, zip,
        password_hash, reset_token_hash, reset_token_expires_at, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, coalesce($14::timestamptz, now()), coalesce($15::timestamptz, now()))
     on conflict (id) do update set
       email = excluded.email,
       full_name = excluded.full_name,
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       phone = excluded.phone,
       address = excluded.address,
       city = excluded.city,
       province = excluded.province,
       zip = excluded.zip,
       password_hash = excluded.password_hash,
       reset_token_hash = excluded.reset_token_hash,
       reset_token_expires_at = excluded.reset_token_expires_at,
       updated_at = coalesce(excluded.updated_at, now())`,
    [
      user.id,
      String(user.email || '').toLowerCase(),
      fullName,
      firstName || '',
      lastName || '',
      user.phone || '',
      user.address || '',
      user.city || '',
      user.province || '',
      user.zip || '',
      user.passwordHash || '',
      user.resetTokenHash || null,
      user.resetTokenExpiresAt || null,
      user.createdAt || null,
      user.updatedAt || null,
    ]
  );

  return {
    ...user,
    fullName,
    firstName: firstName || '',
    lastName: lastName || '',
  };
}

module.exports = { listUsers, getUserByEmail, getUserById, upsertUser, splitFullName };
