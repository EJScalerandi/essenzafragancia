const { z } = require('zod');
const { v4: uuid } = require('uuid');
const crypto = require('crypto');

const { sendOrderMessageEmail, sendBankTransferVerifiedEmail } = require('../services/email.service');

const { listOrders, getOrderById, patchOrder, upsertOrder } = require('../services/orders.service');
const { nextOrderId } = require('../services/orderNumber.service');

const GUEST_TTL_DAYS = Number(process.env.ORDER_TOKEN_TTL_GUEST_DAYS || 90);
const ACCOUNT_TTL_DAYS = Number(process.env.ORDER_TOKEN_TTL_ACCOUNT_DAYS || 0);
const MAX_ACTIVE_TOKENS = Number(process.env.ORDER_TOKEN_MAX_ACTIVE || 5);

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function getTokenTtlDays(order) {
  if (typeof order?.tokenTtlDays === 'number') return order.tokenTtlDays;
  return order?.userId ? ACCOUNT_TTL_DAYS : GUEST_TTL_DAYS;
}

function computeExpiresAt(nowIso, ttlDays) {
  if (!Number.isFinite(ttlDays) || ttlDays <= 0) return null;
  return addDays(nowIso, ttlDays);
}

function ensureAccessTokens(order) {
  if (Array.isArray(order.accessTokens)) return order.accessTokens;
  order.accessTokens = [];
  if (order.accessToken) {
    const createdAt = order.createdAt || new Date().toISOString();
    const ttlDays = getTokenTtlDays(order);
    const expiresAt = computeExpiresAt(createdAt, ttlDays);
    order.accessTokens.push({ hash: sha256Hex(order.accessToken), createdAt, expiresAt });
    delete order.accessToken;
  }
  return order.accessTokens;
}

function pruneAccessTokens(order, nowIso) {
  const now = new Date(nowIso).getTime();
  const list = ensureAccessTokens(order);

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

function issueNewAccessToken(order, nowIso) {
  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = nowIso;
  const ttlDays = getTokenTtlDays(order);
  const expiresAt = computeExpiresAt(nowIso, ttlDays);

  const list = ensureAccessTokens(order);
  list.push({ hash: sha256Hex(token), createdAt, expiresAt });
  pruneAccessTokens(order, nowIso);
  return { token, expiresAt };
}

const patchFulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(['created', 'processing', 'shipped', 'delivered', 'cancelled']),
});

const manualItemSchema = z.object({
  productId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  qty: z.coerce.number().int().positive(),
  variant: z.object({
    color: z.string().trim().optional().default(''),
    size: z.string().trim().optional().default(''),
  }).nullable().optional(),
});

const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  presencial: 'Venta presencial',
  otro: 'Venta externa',
};

const createManualSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(1),
    email: z.string().trim().optional().default(''),
    phone: z.string().trim().optional().default(''),
    address: z.string().trim().optional().default(''),
    city: z.string().trim().optional().default(''),
    province: z.string().trim().optional().default(''),
    zip: z.string().trim().optional().default(''),
  }),
  items: z.array(manualItemSchema).min(1),
  shipping: z.coerce.number().nonnegative().optional().default(0),
  channel: z.enum(['whatsapp', 'presencial', 'otro']).optional().default('otro'),
  fulfillmentStatus: z.enum(['created', 'processing', 'shipped', 'delivered', 'cancelled']).optional().default('created'),
  note: z.string().max(2000).optional().default(''),
});

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
});

function normalizeMessage(m) {
  const sender = m?.sender === 'admin' ? 'admin' : 'buyer';
  const readByAdmin = typeof m?.readByAdmin === 'boolean' ? m.readByAdmin : true;
  const readByBuyer = typeof m?.readByBuyer === 'boolean' ? m.readByBuyer : true;
  return {
    id: m?.id || `m-${uuid().slice(0, 8)}`,
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

function unreadBuyerMessages(order) {
  const msgs = Array.isArray(order.messages) ? order.messages : [];
  return msgs.filter((m) => m.sender === 'buyer' && m.readByAdmin === false).length;
}

async function list(req, res, next) {
  try {
    const orders = await listOrders();
    const items = orders.map((o) => ({
      ...o,
      unreadBuyerMessages: unreadBuyerMessages(o),
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// Carga manual de una venta hecha por fuera de la web (WhatsApp, en persona,
// etc.). El admin elige los productos/cantidades y precios a mano; queda
// registrada como cualquier otra orden (stock, reportes, historial), pero con
// payment.provider = 'manual' para distinguirla de las ventas online.
async function create(req, res, next) {
  try {
    const body = createManualSchema.parse(req.body);
    const now = new Date().toISOString();
    const id = await nextOrderId('manual');

    const items = body.items.map((item, idx) => {
      const variant = item.variant && (item.variant.color || item.variant.size)
        ? { color: item.variant.color || '', size: item.variant.size || '' }
        : null;
      const itemId = variant ? `${item.productId}__${variant.color}__${variant.size}` : `${item.productId}__manual-${idx}`;

      return {
        id: itemId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        variant,
      };
    });

    const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    const shipping = body.shipping;
    const total = subtotal + shipping;
    const channelLabel = CHANNEL_LABELS[body.channel] || CHANNEL_LABELS.otro;

    const order = {
      id,
      createdAt: now,
      updatedAt: now,
      userId: null,
      customer: body.customer,
      items,
      totals: { subtotal, shipping, total },
      note: body.note,
      payment: {
        provider: 'manual',
        status: 'approved',
        statusDetail: `Carga manual (${channelLabel}) por ${req.user?.username || 'admin'}`,
        paymentId: null,
        preferenceId: null,
      },
      fulfillmentStatus: body.fulfillmentStatus,
      tokenTtlDays: GUEST_TTL_DAYS,
      accessTokens: [],
      messages: [],
    };

    await upsertOrder(order);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

async function inbox(req, res, next) {
  try {
    const orders = await listOrders();
    const items = orders
      .map((o) => ({ ...o, unreadBuyerMessages: unreadBuyerMessages(o) }))
      .filter((o) => (o.unreadBuyerMessages || 0) > 0);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });
    res.json({ ...order, unreadBuyerMessages: unreadBuyerMessages(order) });
  } catch (err) {
    next(err);
  }
}

async function patchFulfillment(req, res, next) {
  try {
    const id = req.params.id;
    const patch = patchFulfillmentSchema.parse(req.body);
    const updated = await patchOrder(id, patch);
    if (!updated) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function verifyBankTransferPayment(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });

    if (order.payment?.provider !== 'bank_transfer') {
      return res.status(400).json({
        error: 'InvalidPaymentProvider',
        message: 'Esta orden no fue creada con transferencia bancaria',
      });
    }

    const now = new Date().toISOString();
    const updated = await patchOrder(id, {
      payment: {
        ...order.payment,
        provider: 'bank_transfer',
        status: 'approved',
        statusDetail: `Pago verificado por admin el ${now}`,
        verifiedAt: now,
      },
      updatedAt: now,
    });

    try {
      await sendBankTransferVerifiedEmail({
        to: updated.customer.email,
        customerName: updated.customer.fullName,
        orderId: updated.id,
      });
    } catch (e) {
      console.error('[EMAIL] Failed to send bank transfer verified email:', e.message || e);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const id = req.params.id;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });

    const messages = ensureMessages(order);

    let changed = false;
    for (const m of messages) {
      if (m.sender === 'buyer' && m.readByAdmin === false) {
        m.readByAdmin = true;
        changed = true;
      }
    }

    if (changed) {
      const now = new Date().toISOString();
      await patchOrder(id, { messages, updatedAt: now });
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
    if (!order) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });

    const now = new Date().toISOString();
    const msg = {
      id: `m-${uuid().slice(0, 8)}`,
      sender: 'admin',
      text: body.text,
      createdAt: now,
      readByAdmin: true,
      readByBuyer: false,
    };

    const messages = ensureMessages(order);
    messages.push(msg);

    const { token: buyerToken, expiresAt } = issueNewAccessToken(order, now);

    const updated = await patchOrder(id, {
      messages,
      accessTokens: order.accessTokens,
      buyerTokenExpiresAt: expiresAt,
      updatedAt: now,
    });
    if (!updated) return res.status(404).json({ error: 'NotFound', message: 'Orden no encontrada' });

    try {
      await sendOrderMessageEmail({
        to: updated.customer.email,
        customerName: updated.customer.fullName,
        orderId: updated.id,
        token: buyerToken,
        expiresAt,
        messagePreview: msg.text,
      });
    } catch (e) {
      console.error('[EMAIL] Failed to send message notification:', e.message || e);
    }

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  inbox,
  getById,
  patchFulfillment,
  verifyBankTransferPayment,
  listMessages,
  postMessage,
};
