const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const {
  sendOrderCreatedEmail,
  sendAdminNewMessageEmail,
} = require('./email.service');
const { getUserByEmail, getUserById, upsertUser } = require('./users.service');
const { upsertOrder } = require('./orders.service');
const { nextOrderId } = require('./orderNumber.service');

const GUEST_TTL_DAYS = Number(process.env.ORDER_TOKEN_TTL_GUEST_DAYS || 90);
const ACCOUNT_TTL_DAYS = Number(process.env.ORDER_TOKEN_TTL_ACCOUNT_DAYS || 0);
const MAX_ACTIVE_TOKENS = Number(process.env.ORDER_TOKEN_MAX_ACTIVE || 5);
const PAYMENT_PROOF_MAX_BYTES = Number(process.env.PAYMENT_PROOF_MAX_BYTES || 10 * 1024 * 1024);
const PAYMENT_PROOF_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function calcTotals(items) {
  const subtotal = items.reduce((acc, i) => acc + Number(i.price || 0) * Number(i.qty || 1), 0);
  const shipping = subtotal >= 80000 ? 0 : 5000;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function computeExpiresAt(nowIso, ttlDays) {
  if (!Number.isFinite(ttlDays) || ttlDays <= 0) return null;
  return addDays(nowIso, ttlDays);
}

function pruneAccessTokens(order, nowIso) {
  const now = new Date(nowIso).getTime();
  const active = (Array.isArray(order.accessTokens) ? order.accessTokens : [])
    .filter((t) => {
      if (!t || !t.hash || !t.createdAt) return false;
      if (t.expiresAt === null || t.expiresAt === undefined) return true;
      const exp = new Date(t.expiresAt).getTime();
      return Number.isFinite(exp) && exp > now;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  order.accessTokens = active.slice(0, MAX_ACTIVE_TOKENS);
}

function issueNewAccessToken(order, nowIso) {
  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = nowIso;
  const ttlDays = order.userId ? ACCOUNT_TTL_DAYS : GUEST_TTL_DAYS;
  const expiresAt = computeExpiresAt(nowIso, ttlDays);

  if (!Array.isArray(order.accessTokens)) order.accessTokens = [];
  order.accessTokens.push({ hash: sha256Hex(token), createdAt, expiresAt });
  pruneAccessTokens(order, nowIso);
  return { token, expiresAt };
}

function parseAdminEmails() {
  const raw = process.env.ADMIN_NOTIFY_EMAILS || process.env.ADMIN_NOTIFY_EMAIL || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function profileFromCustomer(customer = {}) {
  const split = splitFullName(customer.fullName || '');
  return {
    fullName: customer.fullName || `${split.firstName} ${split.lastName}`.trim(),
    firstName: split.firstName,
    lastName: split.lastName,
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    province: customer.province || '',
    zip: customer.zip || '',
  };
}

async function persistLatestCheckoutProfile(userId, customer) {
  if (!userId) return null;
  try {
    const existing = await getUserById(userId);
    if (!existing) return null;

    const profile = profileFromCustomer(customer);
    const nextUser = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    await upsertUser(nextUser);
    return nextUser;
  } catch (err) {
    console.error('[account] Failed to persist latest checkout profile:', err.message || err);
    return null;
  }
}

function stripSensitive(order) {
  if (!order) return order;
  const { accessToken, accessTokens, ...rest } = order;
  if (rest.payment?.proof?.fileData) {
    rest.payment = {
      ...rest.payment,
      proof: {
        fileName: rest.payment.proof.fileName,
        mimeType: rest.payment.proof.mimeType,
        sizeBytes: rest.payment.proof.sizeBytes,
        uploadedAt: rest.payment.proof.uploadedAt,
      },
    };
  }
  return rest;
}

async function resolveBuyerAccount({ body, reqUser, passwordHash }) {
  if (reqUser && reqUser.role === 'buyer') {
    const existingBuyer = await getUserById(reqUser.id);
    if (existingBuyer) {
      await persistLatestCheckoutProfile(existingBuyer.id, body.customer);
      return { userId: existingBuyer.id, accountToken: null, accountUser: null };
    }
  }

  if (!body.createAccount) {
    return { userId: null, accountToken: null, accountUser: null };
  }

  const email = String(body.customer.email || '').toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error('Ese email ya tiene cuenta. Iniciá sesión o comprá como invitado.');
    err.status = 409;
    err.code = 'EmailTaken';
    throw err;
  }

  if (!passwordHash && !body.password) {
    const err = new Error('Contraseña requerida para crear cuenta');
    err.status = 400;
    err.code = 'MissingPassword';
    throw err;
  }

  const now = new Date().toISOString();
  const idUser = `u-${uuid().slice(0, 8)}`;
  const finalPasswordHash = passwordHash || await bcrypt.hash(body.password, 10);

  const user = {
    id: idUser,
    email,
    fullName: body.customer.fullName || '',
    ...profileFromCustomer(body.customer),
    passwordHash: finalPasswordHash,
    createdAt: now,
    updatedAt: now,
  };

  await upsertUser(user);

  const secret = process.env.JWT_SECRET || 'dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  const accountUser = {
    id: idUser,
    email,
    fullName: user.fullName || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    province: user.province || '',
    zip: user.zip || '',
    role: 'buyer',
  };
  const accountToken = jwt.sign(accountUser, secret, { expiresIn });

  return { userId: idUser, accountToken, accountUser };
}

function paymentForMethod(paymentMethod, override = {}) {
  if (paymentMethod === 'mercadopago') {
    return {
      provider: 'mercadopago',
      status: override.status || 'approved',
      statusDetail: override.statusDetail || null,
      paymentId: override.paymentId || null,
      preferenceId: override.preferenceId || null,
      merchantOrderId: override.merchantOrderId || null,
    };
  }

  return {
    provider: 'bank_transfer',
    status: 'pending_verification',
    statusDetail: 'Transferencia bancaria pendiente de conciliación',
    paymentId: null,
    preferenceId: null,
  };
}

function cleanFileName(fileName = '') {
  const cleaned = String(fileName || 'comprobante')
    .replace(/[\\/]/g, '-')
    .replace(/[^\w.()\- áéíóúÁÉÍÓÚñÑ]/g, '')
    .trim();
  return cleaned || 'comprobante';
}

function normalizePaymentProof(paymentProof, nowIso) {
  if (!paymentProof) return null;

  const mimeType = String(paymentProof.mimeType || '').toLowerCase();
  if (!PAYMENT_PROOF_ALLOWED_MIME_TYPES.has(mimeType)) {
    const err = new Error('El comprobante tiene que ser PDF o imagen.');
    err.status = 400;
    err.code = 'InvalidPaymentProofType';
    throw err;
  }

  const raw = String(paymentProof.data || '').replace(/^data:[^;]+;base64,/, '');
  const fileData = Buffer.from(raw, 'base64');

  if (!fileData.length) {
    const err = new Error('El comprobante está vacío.');
    err.status = 400;
    err.code = 'EmptyPaymentProof';
    throw err;
  }

  if (fileData.length > PAYMENT_PROOF_MAX_BYTES) {
    const err = new Error('El comprobante no puede superar los 10 MB.');
    err.status = 400;
    err.code = 'PaymentProofTooLarge';
    throw err;
  }

  return {
    fileName: cleanFileName(paymentProof.fileName),
    mimeType,
    sizeBytes: fileData.length,
    fileData,
    uploadedAt: nowIso,
  };
}

async function createOrderFromCheckout({ body, paymentMethod, reqUser = null, passwordHash = null, paymentOverride = {} }) {
  const now = new Date().toISOString();
  const { userId, accountToken, accountUser } = await resolveBuyerAccount({ body, reqUser, passwordHash });

  const id = await nextOrderId(paymentMethod);
  const totals = calcTotals(body.items);
  const payment = paymentForMethod(paymentMethod, paymentOverride);

  if (paymentMethod === 'bank_transfer') {
    payment.proof = normalizePaymentProof(body.paymentProof, now);
    if (!payment.proof) {
      const err = new Error('Cargá el comprobante de pago para confirmar la compra por transferencia.');
      err.status = 400;
      err.code = 'MissingPaymentProof';
      throw err;
    }
  }

  const order = {
    id,
    createdAt: now,
    updatedAt: now,
    userId,
    customer: body.customer,
    items: body.items,
    totals,
    note: body.note || '',
    payment,
    fulfillmentStatus: 'created',
    tokenTtlDays: userId ? ACCOUNT_TTL_DAYS : GUEST_TTL_DAYS,
    accessTokens: [],
    messages: [],
  };

  const { token: buyerToken, expiresAt: buyerTokenExpiresAt } = issueNewAccessToken(order, now);
  order.buyerTokenExpiresAt = buyerTokenExpiresAt;

  if (order.note) {
    order.messages.push({
      id: `m-${uuid().slice(0, 8)}`,
      sender: 'buyer',
      text: order.note,
      createdAt: now,
      readByBuyer: true,
      readByAdmin: false,
    });
  }

  await upsertOrder(order);

  try {
    await sendOrderCreatedEmail({
      to: order.customer.email,
      customerName: order.customer.fullName,
      orderId: order.id,
      token: buyerToken,
      expiresAt: buyerTokenExpiresAt,
    });
  } catch (e) {
    console.error('[EMAIL] Failed to send order email:', e.message || e);
  }

  if (order.note) {
    const adminEmails = parseAdminEmails();
    if (adminEmails.length) {
      try {
        await sendAdminNewMessageEmail({
          to: adminEmails,
          orderId: order.id,
          customerName: order.customer.fullName,
          customerEmail: order.customer.email,
          messagePreview: order.note,
          mode: 'order_note',
        });
      } catch (e) {
        console.error('[EMAIL] Failed to notify admin:', e.message || e);
      }
    }
  }

  return {
    order: stripSensitive(order),
    fullOrder: order,
    buyerToken,
    buyerTokenExpiresAt,
    accountToken,
    accountUser,
  };
}

module.exports = {
  calcTotals,
  createOrderFromCheckout,
  issueNewAccessToken,
  sha256Hex,
  stripSensitive,
};
