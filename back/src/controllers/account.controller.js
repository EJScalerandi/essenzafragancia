const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { v4: uuid } = require('uuid');
const crypto = require('crypto');

const {
  getUserByEmail,
  getUserById,
  upsertUser,
} = require('../services/users.service');
const { listOrdersByUserId, listOrders, upsertOrder } = require('../services/orders.service');
const { sendPasswordResetEmail } = require('../services/email.service');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  firstName: z.string().max(120).optional().default(''),
  lastName: z.string().max(120).optional().default(''),
  phone: z.string().max(80).optional().default(''),
  address: z.string().max(240).optional().default(''),
  city: z.string().max(120).optional().default(''),
  province: z.string().max(120).optional().default(''),
  zip: z.string().max(40).optional().default(''),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

const RESET_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function addMinutes(iso, minutes) {
  const d = new Date(iso);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString();
}

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeProfileFromRegister(fullName = '') {
  const split = splitFullName(fullName);
  return {
    firstName: split.firstName,
    lastName: split.lastName,
    fullName: String(fullName || '').trim(),
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign(user, secret, { expiresIn });
}

function toPublicUser(u) {
  if (!u) return null;
  const split = splitFullName(u.fullName || '');
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName || `${u.firstName || split.firstName || ''} ${u.lastName || split.lastName || ''}`.trim(),
    firstName: u.firstName || split.firstName || '',
    lastName: u.lastName || split.lastName || '',
    phone: u.phone || '',
    address: u.address || '',
    city: u.city || '',
    province: u.province || '',
    zip: u.zip || '',
    role: 'buyer',
  };
}

async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await getUserByEmail(body.email);
    if (existing) {
      return res.status(409).json({ error: 'EmailTaken', message: 'Ya existe una cuenta con ese email' });
    }

    const now = new Date().toISOString();
    const profile = normalizeProfileFromRegister(body.fullName || '');
    const user = {
      id: `u-${uuid().slice(0, 8)}`,
      email: body.email.toLowerCase(),
      fullName: profile.fullName || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: '',
      address: '',
      city: '',
      province: '',
      zip: '',
      passwordHash: await bcrypt.hash(body.password, 10),
      createdAt: now,
      updatedAt: now,
    };

    await upsertUser(user);

    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);

    return res.status(201).json({ token, user: publicUser });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await getUserByEmail(body.email);
    if (!user) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'Email o contraseña inválidos' });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash || '');
    if (!ok) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'Email o contraseña inválidos' });
    }

    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);

    return res.json({ token, user: publicUser });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', message: 'Missing auth context' });

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Forbidden', message: 'Buyer role required' });
    }

    const user = await getUserById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });

    return res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Forbidden', message: 'Buyer role required' });
    }

    const body = profileSchema.parse(req.body || {});
    const profile = {
      ...body,
      fullName: `${body.firstName || ''} ${body.lastName || ''}`.trim(),
    };

    const existing = await getUserById(req.user.id);
    if (!existing) return res.status(404).json({ error: 'NotFound', message: 'Cuenta no encontrada' });

    const updated = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    await upsertUser(updated);

    return res.json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
}

async function myOrders(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Forbidden', message: 'Buyer role required' });
    }

    const currentUser = await getUserById(req.user.id);
    const userEmail = String(currentUser?.email || req.user.email || '').toLowerCase();

    const byUserId = await listOrdersByUserId(req.user.id);

    // Recupera compras creadas por MercadoPago antes de guardar user_id en el draft:
    // si el email del pedido coincide con la cuenta logueada, las vinculamos a esta cuenta.
    let recovered = [];
    if (userEmail) {
      const all = await listOrders();
      recovered = all.filter((o) => {
        const orderEmail = String(o.customer?.email || '').toLowerCase();
        return !o.userId && orderEmail && orderEmail === userEmail;
      });

      for (const order of recovered) {
        order.userId = req.user.id;
        order.updatedAt = new Date().toISOString();
        await upsertOrder(order);
      }
    }

    const unique = new Map();
    for (const o of [...byUserId, ...recovered]) unique.set(o.id, o);
    const orders = Array.from(unique.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const out = orders.map((o) => {
      const msgs = Array.isArray(o.messages) ? o.messages : [];
      const unreadAdminMessages = msgs.filter((m) => m.sender === 'admin' && m.readByBuyer === false).length;
      const { accessToken, accessTokens, ...rest } = o;
      return { ...rest, unreadAdminMessages };
    });

    return res.json({ items: out });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const body = forgotSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const user = await getUserByEmail(email);
    const okResponse = { ok: true };

    if (!user) return res.json(okResponse);

    const now = new Date().toISOString();
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = sha256Hex(token);
    const expiresAt = addMinutes(now, RESET_TTL_MINUTES);

    const nextUser = {
      ...user,
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
      updatedAt: now,
    };
    await upsertUser(nextUser);

    try {
      await sendPasswordResetEmail({
        to: nextUser.email,
        email: nextUser.email,
        token,
        customerName: nextUser.fullName || nextUser.email,
      });
    } catch (e) {
      console.error('[EMAIL] Failed to send password reset:', e.message || e);
    }

    return res.json(okResponse);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const body = resetSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const user = await getUserByEmail(email);
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      return res.status(400).json({ error: 'InvalidToken', message: 'Token inválido o expirado' });
    }

    const exp = new Date(user.resetTokenExpiresAt).getTime();
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return res.status(400).json({ error: 'ExpiredToken', message: 'Token inválido o expirado' });
    }

    const hash = sha256Hex(body.token);
    if (hash !== user.resetTokenHash) {
      return res.status(400).json({ error: 'InvalidToken', message: 'Token inválido o expirado' });
    }

    const now = new Date().toISOString();
    const nextUser = {
      ...user,
      passwordHash: await bcrypt.hash(body.newPassword, 10),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      updatedAt: now,
    };

    await upsertUser(nextUser);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, myOrders, forgotPassword, resetPassword };
