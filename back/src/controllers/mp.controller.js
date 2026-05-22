const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');

const { query } = require('../db/postgres');
const { calcTotals, createOrderFromCheckout } = require('../services/checkoutOrder.service');
const { createPreference, getPayment } = require('../services/mp.service');
const { getOrderById, upsertOrder } = require('../services/orders.service');
const { getUserById } = require('../services/users.service');

const itemSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  qty: z.coerce.number().int().positive(),
  variant: z.object({
    color: z.string().optional().default(''),
    size: z.string().optional().default(''),
  }).nullable().optional(),
});

const customerSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  province: z.string().trim().min(1),
  zip: z.string().trim().min(1),
});

const createCheckoutSchema = z.object({
  customer: customerSchema,
  items: z.array(itemSchema).min(1),
  note: z.string().max(2000).optional().default(''),
  createAccount: z.boolean().optional().default(false),
  password: z.preprocess(
    (value) => value === '' || value === null ? undefined : value,
    z.string().min(6).optional()
  ),
});

const syncSchema = z.object({
  draftId: z.string().optional().nullable(),
  externalReference: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  statusDetail: z.string().optional().nullable(),
  preferenceId: z.string().optional().nullable(),
  merchantOrderId: z.string().optional().nullable(),
});

function getInitPoint(pref) {
  const useSandbox = String(process.env.MP_USE_SANDBOX || 'true').toLowerCase() === 'true';
  return useSandbox ? (pref.sandbox_init_point || pref.init_point) : pref.init_point;
}

function publicKey() {
  return process.env.MP_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY || '';
}

function mapDraft(row) {
  if (!row) return null;
  return {
    id: row.id,
    customer: row.customer_json || {},
    items: row.items_json || [],
    note: row.note || '',
    createAccount: row.create_account === true,
    passwordHash: row.password_hash || null,
    status: row.status || 'created',
    preferenceId: row.preference_id || null,
    paymentId: row.payment_id || null,
    merchantOrderId: row.merchant_order_id || null,
    orderId: row.order_id || null,
    userId: row.user_id || null,
    totals: {
      subtotal: Number(row.subtotal || 0),
      shipping: Number(row.shipping || 0),
      total: Number(row.total || 0),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getDraftById(id) {
  const { rows } = await query(
    `select id, customer_json, items_json, note, create_account, password_hash,
            user_id, status, preference_id, payment_id, merchant_order_id, order_id,
            subtotal, shipping, total, created_at, updated_at
       from public.mp_checkout_drafts
      where id = $1
      limit 1`,
    [id]
  );
  return mapDraft(rows[0]);
}

async function createDraft({ body, userId = null }) {
  const id = `mpd-${crypto.randomUUID()}`;
  const totals = calcTotals(body.items);
  const passwordHash = body.createAccount && body.password ? await bcrypt.hash(body.password, 10) : null;

  const { rows } = await query(
    `insert into public.mp_checkout_drafts
      (id, customer_json, items_json, note, create_account, password_hash,
       user_id, status, subtotal, shipping, total, expires_at)
     values ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, 'created', $8, $9, $10, now() + interval '2 hours')
     returning id, customer_json, items_json, note, create_account, password_hash,
               user_id, status, preference_id, payment_id, merchant_order_id, order_id,
               subtotal, shipping, total, created_at, updated_at`,
    [
      id,
      JSON.stringify(body.customer),
      JSON.stringify(body.items),
      body.note || '',
      body.createAccount === true,
      passwordHash,
      userId,
      totals.subtotal,
      totals.shipping,
      totals.total,
    ]
  );

  return mapDraft(rows[0]);
}

async function patchDraft(id, patch) {
  const current = await getDraftById(id);
  if (!current) return null;

  const next = {
    status: patch.status || current.status,
    preferenceId: patch.preferenceId === undefined ? current.preferenceId : patch.preferenceId,
    paymentId: patch.paymentId === undefined ? current.paymentId : patch.paymentId,
    merchantOrderId: patch.merchantOrderId === undefined ? current.merchantOrderId : patch.merchantOrderId,
    orderId: patch.orderId === undefined ? current.orderId : patch.orderId,
  };

  const { rows } = await query(
    `update public.mp_checkout_drafts
        set status = $2,
            preference_id = $3,
            payment_id = $4,
            merchant_order_id = $5,
            order_id = $6,
            updated_at = now()
      where id = $1
      returning id, customer_json, items_json, note, create_account, password_hash,
                user_id, status, preference_id, payment_id, merchant_order_id, order_id,
                subtotal, shipping, total, created_at, updated_at`,
    [id, next.status, next.preferenceId, next.paymentId, next.merchantOrderId, next.orderId]
  );

  return mapDraft(rows[0]);
}

async function createCheckout(req, res, next) {
  try {
    const body = createCheckoutSchema.parse(req.body);

    let buyerUserId = null;
    if (req.user && req.user.role === 'buyer') {
      const buyer = await getUserById(req.user.id);
      if (buyer) {
        buyerUserId = buyer.id;
        // Si ya está logueado, el checkout de MercadoPago NO debe intentar crear otra cuenta.
        body.createAccount = false;
        body.password = undefined;
      }
    }

    if (body.createAccount && !body.password) {
      return res.status(400).json({ error: 'MissingPassword', message: 'Contraseña requerida para crear cuenta' });
    }

    const draft = await createDraft({
      body,
      userId: buyerUserId,
    });

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const webhookUrl = process.env.MP_WEBHOOK_URL || '';

    const pref = await createPreference({ draft, webhookUrl, frontendBaseUrl });
    const preferenceId = pref.id;
    const initPoint = getInitPoint(pref);

    await patchDraft(draft.id, {
      status: 'preference_created',
      preferenceId,
    });

    res.json({
      draftId: draft.id,
      preferenceId,
      initPoint,
      publicKey: publicKey(),
      amount: draft.totals.total,
      total: draft.totals.total,
    });
  } catch (err) {
    next(err);
  }
}

function shouldCreateSaleForMpStatus(status) {
  return ['approved', 'pending', 'in_process', 'authorized'].includes(String(status || '').toLowerCase());
}

function mpSaleStatusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'authorized') return 'authorized';
  if (s === 'in_process') return 'in_process';
  return 'pending';
}

async function finalizeApprovedDraft({ draft, paymentStatus, statusDetail, paymentId, preferenceId, merchantOrderId }) {
  const normalizedStatus = mpSaleStatusLabel(paymentStatus);

  if (draft.orderId) {
    const existingOrder = await getOrderById(draft.orderId);
    if (existingOrder) {
      existingOrder.payment = {
        ...existingOrder.payment,
        provider: 'mercadopago',
        status: normalizedStatus,
        statusDetail: statusDetail || existingOrder.payment?.statusDetail || null,
        paymentId: paymentId || existingOrder.payment?.paymentId || null,
        preferenceId: preferenceId || draft.preferenceId || existingOrder.payment?.preferenceId || null,
        merchantOrderId: merchantOrderId || existingOrder.payment?.merchantOrderId || null,
      };
      existingOrder.updatedAt = new Date().toISOString();
      await upsertOrder(existingOrder);
    }

    const updatedDraft = await patchDraft(draft.id, {
      status: normalizedStatus,
      paymentId,
      merchantOrderId,
      preferenceId: preferenceId || draft.preferenceId,
    });

    return {
      draft: updatedDraft || draft,
      order: existingOrder || { id: draft.orderId },
      alreadyFinalized: true,
    };
  }

  const checkoutBody = {
    customer: draft.customer,
    items: draft.items,
    note: draft.note,
    createAccount: draft.createAccount,
  };

  const reqUser = draft.userId ? { id: draft.userId, role: 'buyer' } : null;

  const result = await createOrderFromCheckout({
    body: checkoutBody,
    paymentMethod: 'mercadopago',
    reqUser,
    passwordHash: draft.passwordHash,
    paymentOverride: {
      status: normalizedStatus,
      statusDetail,
      paymentId,
      preferenceId: preferenceId || draft.preferenceId,
      merchantOrderId,
    },
  });

  const updatedDraft = await patchDraft(draft.id, {
    status: normalizedStatus,
    paymentId,
    merchantOrderId,
    orderId: result.order.id,
    preferenceId: preferenceId || draft.preferenceId,
  });

  return {
    draft: updatedDraft,
    order: result.order,
    buyerToken: result.buyerToken,
    buyerTokenExpiresAt: result.buyerTokenExpiresAt,
    accountToken: result.accountToken,
    accountUser: result.accountUser,
    alreadyFinalized: false,
  };
}

async function syncReturn(req, res, next) {
  try {
    const body = syncSchema.parse(req.body);
    const draftId = body.draftId || body.externalReference;
    if (!draftId) return res.status(400).json({ error: 'MissingDraft', message: 'Falta el identificador de pago' });

    const draft = await getDraftById(draftId);
    if (!draft) return res.status(404).json({ error: 'NotFound', message: 'Pago pendiente no encontrado' });

    let paymentStatus = body.status || 'pending';
    let statusDetail = body.statusDetail || null;
    let paymentId = body.paymentId || null;
    let preferenceId = body.preferenceId || draft.preferenceId || null;
    let merchantOrderId = body.merchantOrderId || draft.merchantOrderId || null;

    if (!paymentId && paymentStatus === 'approved') {
      await patchDraft(draft.id, {
        status: 'waiting_payment_id',
        preferenceId,
        merchantOrderId,
      });
      return res.json({
        draft,
        order: null,
        message: 'MercadoPago volvió sin payment_id. Esperando webhook o reintento de sincronización.',
      });
    }

    if (paymentId) {
      try {
        const payment = await getPayment(paymentId);
        paymentStatus = payment.status || paymentStatus;
        statusDetail = payment.status_detail || statusDetail;
        paymentId = payment.id ? String(payment.id) : paymentId;
        preferenceId = preferenceId || draft.preferenceId;
        merchantOrderId = payment.order?.id ? String(payment.order.id) : merchantOrderId;
      } catch (err) {
        console.error('[mp:sync-return] getPayment failed', err.message || err);
      }
    }

    if (shouldCreateSaleForMpStatus(paymentStatus)) {
      const result = await finalizeApprovedDraft({
        draft,
        paymentStatus,
        statusDetail,
        paymentId,
        preferenceId,
        merchantOrderId,
      });
      return res.json(result);
    }

    const updatedDraft = await patchDraft(draft.id, {
      status: paymentStatus || 'pending',
      paymentId,
      merchantOrderId,
      preferenceId,
    });

    return res.json({ draft: updatedDraft, order: null });
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    const type = req.body?.type || req.query?.type;
    const dataId = req.body?.data?.id || req.query?.data_id || req.body?.id;

    res.status(200).json({ ok: true });

    if (!dataId) return;
    if (type && type !== 'payment') return;

    const payment = await getPayment(dataId);
    const draftId = payment.external_reference;
    if (!draftId) return;

    const draft = await getDraftById(draftId);
    if (!draft) return;

    if (shouldCreateSaleForMpStatus(payment.status)) {
      await finalizeApprovedDraft({
        draft,
        paymentStatus: payment.status,
        statusDetail: payment.status_detail,
        paymentId: String(payment.id),
        preferenceId: draft.preferenceId,
        merchantOrderId: payment.order?.id ? String(payment.order.id) : null,
      });
      return;
    }

    await patchDraft(draft.id, {
      status: payment.status || 'pending',
      paymentId: String(payment.id),
      preferenceId: draft.preferenceId,
      merchantOrderId: payment.order?.id ? String(payment.order.id) : null,
    });
  } catch (err) {
    console.error('[mp:webhook] error', err);
  }
}

async function getPaymentById(req, res, next) {
  try {
    const paymentId = req.params.id;
    const data = await getPayment(paymentId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createCheckout, getPaymentById, syncReturn, webhook };
