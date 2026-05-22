const { z } = require('zod');

const {
  sendOrderMessageEmail,
  sendAdminNewMessageEmail,
} = require('../services/email.service');
const { upsertOrder, getOrderById, getOrderPaymentProofById } = require('../services/orders.service');
const {
  createOrderFromCheckout,
  issueNewAccessToken,
  sha256Hex,
  stripSensitive,
} = require('../services/checkoutOrder.service');

const MAX_ACTIVE_TOKENS = Number(process.env.ORDER_TOKEN_MAX_ACTIVE || 5);
const PAYMENT_PROOF_MAX_BYTES = Number(process.env.PAYMENT_PROOF_MAX_BYTES || 10 * 1024 * 1024);

const itemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  variant: z.object({ color: z.string(), size: z.string() }).nullable().optional(),
});

const customerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  zip: z.string().min(1),
});

const paymentProofSchema = z.object({
  fileName: z.string().min(1).max(240),
  mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  sizeBytes: z.number().int().positive().max(PAYMENT_PROOF_MAX_BYTES),
  data: z.string().min(1),
}).optional().nullable();

const createSchema = z.object({
  customer: customerSchema,
  items: z.array(itemSchema).min(1),
  note: z.string().max(2000).optional().default(''),
  paymentMethod: z.enum(['mercadopago', 'bank_transfer']).optional().default('bank_transfer'),
  paymentProof: paymentProofSchema,
  createAccount: z.boolean().optional().default(false),
  password: z.string().min(6).optional(),
});

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
});

function getOrderToken(req) {
  return (
    (req.query && req.query.token) ||
    req.headers['x-order-token'] ||
    req.headers['x_order_token'] ||
    null
  );
}

function pruneAccessTokens(order, nowIso) {
  const now = new Date(nowIso).getTime();
  const list = Array.isArray(order.accessTokens) ? order.accessTokens : [];
  const active = list
    .filter((t) => {
      if (!t || !t.hash || !t.createdAt) return false;
      if (t.expiresAt === null || t.expiresAt === undefined) return true;
      const exp = new Date(t.expiresAt).getTime();
      return Number.isFinite(exp) && exp > now;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  order.accessTokens = active.slice(0, MAX_ACTIVE_TOKENS);
}

function normalizeMessage(m) {
  const sender = m?.sender === 'admin' ? 'admin' : 'buyer';
  const readByAdmin = typeof m?.readByAdmin === 'boolean' ? m.readByAdmin : true;
  const readByBuyer = typeof m?.readByBuyer === 'boolean' ? m.readByBuyer : true;
  return {
    id: m?.id || `m-${Math.random().toString(16).slice(2, 10)}`,
    sender,
    text: String(m?.text || ''),
    createdAt: m?.createdAt || new Date().toISOString(),
    readByAdmin,
    readByBuyer,
  };
}

function ensureMessages(order) {
  if (!Array.isArray(order.messages)) order.messages = [];
  order.messages = order.messages.map(normalizeMessage);
  return order.messages;
}

function parseAdminEmails() {
  const raw = process.env.ADMIN_NOTIFY_EMAILS || process.env.ADMIN_NOTIFY_EMAIL || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);

    if (body.paymentMethod === 'mercadopago') {
      return res.status(400).json({
        error: 'InvalidFlow',
        message: 'MercadoPago se inicia desde /api/payments/mp/create-checkout. La compra se crea recién cuando el pago se aprueba.',
      });
    }

    if (!body.paymentProof) {
      return res.status(400).json({
        error: 'MissingPaymentProof',
        message: 'Cargá el comprobante de pago para confirmar la compra por transferencia.',
      });
    }

    const result = await createOrderFromCheckout({
      body,
      paymentMethod: 'bank_transfer',
      reqUser: req.user || null,
    });

    return res.status(201).json({
      ...result.order,
      buyerToken: result.buyerToken,
      buyerTokenExpiresAt: result.buyerTokenExpiresAt,
      accountToken: result.accountToken,
      accountUser: result.accountUser,
    });
  } catch (err) {
    next(err);
  }
}

async function authorizeOrderAccess(req, order) {
  if (req.user && req.user.role === 'admin') return { ok: true, mode: 'admin' };

  if (req.user && req.user.role === 'buyer') {
    if (order.userId && req.user.id === order.userId) {
      return { ok: true, mode: 'buyer-auth' };
    }

    const orderEmail = String(order.customer?.email || '').toLowerCase();
    const userEmail = String(req.user.email || '').toLowerCase();

    if (!order.userId && orderEmail && userEmail && orderEmail === userEmail) {
      order.userId = req.user.id;
      order.updatedAt = new Date().toISOString();
      await upsertOrder(order);
      return { ok: true, mode: 'buyer-auth' };
    }
  }

  const token = getOrderToken(req);
  if (!token) return { ok: false, status: 401, message: 'Token de pedido requerido' };

  const nowIso = new Date().toISOString();
  pruneAccessTokens(order, nowIso);

  const hash = sha256Hex(token);
  const tokens = Array.isArray(order.accessTokens) ? order.accessTokens : [];
  const match = tokens.find((t) => t.hash === hash);
  if (!match) return { ok: false, status: 403, message: 'Token de pedido inválido' };

  if (match.expiresAt !== null && match.expiresAt !== undefined) {
    const exp = new Date(match.expiresAt).getTime();
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return { ok: false, status: 410, message: 'El enlace privado expiró. Solicitá uno nuevo.' };
    }
  }

  await upsertOrder(order);
  return { ok: true, mode: 'buyer' };
}

async function getById(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Pedido no encontrado' });

    const auth = await authorizeOrderAccess(req, order);
    if (!auth.ok) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    if (auth.mode === 'buyer' || auth.mode === 'buyer-auth') return res.json(stripSensitive(order));
    return res.json(order);
  } catch (err) {
    next(err);
  }
}

async function getPaymentProof(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Pedido no encontrado' });

    const auth = await authorizeOrderAccess(req, order);
    if (!auth.ok) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    const proof = await getOrderPaymentProofById(id);
    if (!proof) return res.status(404).json({ error: 'NotFound', message: 'Comprobante no encontrado' });

    res.setHeader('Content-Type', proof.mimeType);
    res.setHeader('Content-Length', proof.sizeBytes || proof.fileData.length);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(proof.fileName)}"`);
    return res.send(proof.fileData);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Pedido no encontrado' });

    const auth = await authorizeOrderAccess(req, order);
    if (!auth.ok) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    if (auth.mode === 'buyer') {
      return res.status(403).json({
        error: 'ChatRequiresAccount',
        message: 'El chat directo es exclusivo para clientes con cuenta. Contactate por correo para consultas sobre este pedido.',
      });
    }

    const messages = ensureMessages(order);

    let changed = false;
    if (auth.mode === 'admin') {
      for (const m of messages) {
        if (m.sender === 'buyer' && m.readByAdmin === false) {
          m.readByAdmin = true;
          changed = true;
        }
      }
    } else {
      for (const m of messages) {
        if (m.sender === 'admin' && m.readByBuyer === false) {
          m.readByBuyer = true;
          changed = true;
        }
      }
    }

    if (changed) {
      order.messages = messages;
      order.updatedAt = new Date().toISOString();
      await upsertOrder(order);
    }

    res.json({ items: messages });
  } catch (err) {
    next(err);
  }
}

async function postMessage(req, res, next) {
  try {
    const id = req.params.id;
    const body = messageSchema.parse(req.body);

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Pedido no encontrado' });

    const auth = await authorizeOrderAccess(req, order);
    if (!auth.ok) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    if (auth.mode === 'buyer') {
      return res.status(403).json({
        error: 'ChatRequiresAccount',
        message: 'El chat directo es exclusivo para clientes con cuenta. Contactate por correo para consultas sobre este pedido.',
      });
    }

    const now = new Date().toISOString();
    const sender = auth.mode === 'admin' ? 'admin' : 'buyer';

    const msg = {
      id: `m-${Math.random().toString(16).slice(2, 10)}`,
      sender,
      text: body.text,
      createdAt: now,
      readByAdmin: sender === 'admin',
      readByBuyer: sender === 'buyer',
    };

    const messages = ensureMessages(order);
    messages.push(msg);

    order.messages = messages;
    order.updatedAt = now;
    await upsertOrder(order);

    if (sender === 'admin') {
      try {
        const { token, expiresAt } = issueNewAccessToken(order, now);
        order.buyerTokenExpiresAt = expiresAt;
        await upsertOrder(order);

        await sendOrderMessageEmail({
          to: order.customer.email,
          customerName: order.customer.fullName,
          orderId: order.id,
          token,
          expiresAt,
          messagePreview: msg.text,
        });
      } catch (e) {
        console.error('[EMAIL] Failed to send buyer notification:', e.message || e);
      }
    } else {
      const adminEmails = parseAdminEmails();
      if (adminEmails.length) {
        try {
          await sendAdminNewMessageEmail({
            to: adminEmails,
            orderId: order.id,
            customerName: order.customer.fullName,
            customerEmail: order.customer.email,
            messagePreview: msg.text,
            mode: 'buyer_message',
          });
        } catch (e) {
          console.error('[EMAIL] Failed to notify admin:', e.message || e);
        }
      }
    }

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
}

async function rotateToken(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Pedido no encontrado' });

    const auth = await authorizeOrderAccess(req, order);
    if (!auth.ok) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    const now = new Date().toISOString();
    const { token, expiresAt } = issueNewAccessToken(order, now);
    order.buyerTokenExpiresAt = expiresAt;
    order.updatedAt = now;
    await upsertOrder(order);

    return res.json({ buyerToken: token, buyerTokenExpiresAt: expiresAt });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, getPaymentProof, listMessages, postMessage, rotateToken };
