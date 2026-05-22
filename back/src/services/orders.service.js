const { query, withClient } = require('../db/postgres');

function iso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function proofMetaFromRow(row) {
  if (!row.payment_proof_file_name) return null;
  return {
    fileName: row.payment_proof_file_name,
    mimeType: row.payment_proof_mime_type || 'application/octet-stream',
    sizeBytes: Number(row.payment_proof_size_bytes || 0),
    uploadedAt: iso(row.payment_proof_uploaded_at),
  };
}

function mapOrderRow(row) {
  return {
    id: row.id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    userId: row.user_id || null,
    customer: {
      fullName: row.customer_full_name || '',
      email: row.customer_email || '',
      phone: row.customer_phone || '',
      address: row.customer_address || '',
      city: row.customer_city || '',
      province: row.customer_province || '',
      zip: row.customer_zip || '',
    },
    items: [],
    totals: {
      subtotal: toNumber(row.subtotal),
      shipping: toNumber(row.shipping),
      total: toNumber(row.total),
    },
    note: row.note || '',
    payment: {
      provider: row.payment_provider || null,
      status: row.payment_status || 'created',
      statusDetail: row.payment_status_detail || null,
      paymentId: row.payment_id || null,
      preferenceId: row.payment_preference_id || null,
      proof: proofMetaFromRow(row),
    },
    fulfillmentStatus: row.fulfillment_status || 'created',
    tokenTtlDays: Number.isFinite(Number(row.token_ttl_days)) ? Number(row.token_ttl_days) : 90,
    buyerTokenExpiresAt: iso(row.buyer_token_expires_at),
    accessTokens: [],
    messages: [],
  };
}

function mapItem(row) {
  return {
    id: row.cart_item_id,
    productId: row.product_id || '',
    name: row.product_name || '',
    price: toNumber(row.unit_price),
    qty: Number(row.quantity || 0),
    variant: row.variant_color || row.variant_size
      ? { color: row.variant_color || '', size: row.variant_size || '' }
      : null,
  };
}

function mapToken(row) {
  return {
    hash: row.token_hash,
    createdAt: iso(row.created_at),
    expiresAt: row.expires_at ? iso(row.expires_at) : null,
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    sender: row.sender === 'admin' ? 'admin' : 'buyer',
    text: row.body || '',
    createdAt: iso(row.created_at),
    readByAdmin: row.read_by_admin === true,
    readByBuyer: row.read_by_buyer === true,
  };
}

async function hydrateOrder(order) {
  if (!order) return null;
  const [itemsRes, tokensRes, messagesRes] = await Promise.all([
    query(
      `select cart_item_id, product_id, product_name, unit_price, quantity, variant_color, variant_size
         from public.order_items
        where order_id = $1
        order by created_at asc`,
      [order.id]
    ),
    query(
      `select token_hash, created_at, expires_at
         from public.order_access_tokens
        where order_id = $1
        order by created_at desc`,
      [order.id]
    ),
    query(
      `select id, sender, body, read_by_admin, read_by_buyer, created_at
         from public.order_messages
        where order_id = $1
        order by created_at asc`,
      [order.id]
    ),
  ]);

  order.items = itemsRes.rows.map(mapItem);
  order.accessTokens = tokensRes.rows.map(mapToken);
  order.messages = messagesRes.rows.map(mapMessage);
  return order;
}

const ORDER_SELECT = `id, user_id, customer_full_name, customer_email::text as customer_email, customer_phone,
            customer_address, customer_city, customer_province, customer_zip, note,
            subtotal, shipping, total, payment_provider, payment_status, payment_status_detail,
            payment_id, payment_preference_id, fulfillment_status, token_ttl_days,
            buyer_token_expires_at, payment_proof_file_name, payment_proof_mime_type,
            payment_proof_size_bytes, payment_proof_uploaded_at, created_at, updated_at`;

async function listOrders() {
  const { rows } = await query(
    `select ${ORDER_SELECT}
       from public.orders
      order by created_at desc`
  );

  const orders = [];
  for (const row of rows) {
    orders.push(await hydrateOrder(mapOrderRow(row)));
  }
  return orders;
}

async function getOrderById(id) {
  const { rows } = await query(
    `select ${ORDER_SELECT}
       from public.orders
      where id = $1
      limit 1`,
    [id]
  );
  return rows[0] ? hydrateOrder(mapOrderRow(rows[0])) : null;
}

async function getOrderPaymentProofById(id) {
  const { rows } = await query(
    `select payment_proof_file_name, payment_proof_mime_type, payment_proof_size_bytes,
            payment_proof_file_data, payment_proof_uploaded_at
       from public.orders
      where id = $1
      limit 1`,
    [id]
  );

  const row = rows[0];
  if (!row || !row.payment_proof_file_name || !row.payment_proof_file_data) return null;

  return {
    fileName: row.payment_proof_file_name,
    mimeType: row.payment_proof_mime_type || 'application/octet-stream',
    sizeBytes: Number(row.payment_proof_size_bytes || 0),
    uploadedAt: iso(row.payment_proof_uploaded_at),
    fileData: row.payment_proof_file_data,
  };
}

async function upsertOrder(order) {
  await withClient(async (client) => {
    const customer = order.customer || {};
    const totals = order.totals || {};
    const payment = order.payment || {};
    const proof = payment.proof || null;

    await client.query(
      `insert into public.orders
        (id, user_id, customer_full_name, customer_email, customer_phone, customer_address,
         customer_city, customer_province, customer_zip, note, subtotal, shipping, total,
         payment_provider, payment_status, payment_status_detail, payment_id, payment_preference_id,
         fulfillment_status, token_ttl_days, buyer_token_expires_at,
         payment_proof_file_name, payment_proof_mime_type, payment_proof_size_bytes,
         payment_proof_file_data, payment_proof_uploaded_at, created_at, updated_at)
       values
        ($1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19, $20, $21,
         $22, $23, $24, $25, $26,
         coalesce($27::timestamptz, now()), coalesce($28::timestamptz, now()))
       on conflict (id) do update set
         user_id = excluded.user_id,
         customer_full_name = excluded.customer_full_name,
         customer_email = excluded.customer_email,
         customer_phone = excluded.customer_phone,
         customer_address = excluded.customer_address,
         customer_city = excluded.customer_city,
         customer_province = excluded.customer_province,
         customer_zip = excluded.customer_zip,
         note = excluded.note,
         subtotal = excluded.subtotal,
         shipping = excluded.shipping,
         total = excluded.total,
         payment_provider = excluded.payment_provider,
         payment_status = excluded.payment_status,
         payment_status_detail = excluded.payment_status_detail,
         payment_id = excluded.payment_id,
         payment_preference_id = excluded.payment_preference_id,
         fulfillment_status = excluded.fulfillment_status,
         token_ttl_days = excluded.token_ttl_days,
         buyer_token_expires_at = excluded.buyer_token_expires_at,
         payment_proof_file_name = coalesce(excluded.payment_proof_file_name, public.orders.payment_proof_file_name),
         payment_proof_mime_type = coalesce(excluded.payment_proof_mime_type, public.orders.payment_proof_mime_type),
         payment_proof_size_bytes = coalesce(excluded.payment_proof_size_bytes, public.orders.payment_proof_size_bytes),
         payment_proof_file_data = coalesce(excluded.payment_proof_file_data, public.orders.payment_proof_file_data),
         payment_proof_uploaded_at = coalesce(excluded.payment_proof_uploaded_at, public.orders.payment_proof_uploaded_at),
         updated_at = coalesce(excluded.updated_at, now())`,
      [
        order.id,
        order.userId || null,
        customer.fullName || '',
        String(customer.email || '').toLowerCase(),
        customer.phone || '',
        customer.address || '',
        customer.city || '',
        customer.province || '',
        customer.zip || '',
        order.note || '',
        toNumber(totals.subtotal),
        toNumber(totals.shipping),
        toNumber(totals.total),
        payment.provider || null,
        payment.status || 'created',
        payment.statusDetail || null,
        payment.paymentId || null,
        payment.preferenceId || null,
        order.fulfillmentStatus || 'created',
        Number.isFinite(Number(order.tokenTtlDays)) ? Number(order.tokenTtlDays) : 90,
        order.buyerTokenExpiresAt || null,
        proof?.fileName || null,
        proof?.mimeType || null,
        proof?.sizeBytes == null ? null : Number(proof.sizeBytes),
        proof?.fileData || null,
        proof?.uploadedAt || null,
        order.createdAt || null,
        order.updatedAt || null,
      ]
    );

    await client.query('delete from public.order_items where order_id = $1', [order.id]);
    for (const item of Array.isArray(order.items) ? order.items : []) {
      await client.query(
        `insert into public.order_items
          (order_id, cart_item_id, product_id, product_name, unit_price, quantity, variant_color, variant_size)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          item.id,
          item.productId || null,
          item.name || '',
          toNumber(item.price),
          Number(item.qty || 1),
          item.variant?.color || null,
          item.variant?.size || null,
        ]
      );
    }

    await client.query('delete from public.order_access_tokens where order_id = $1', [order.id]);
    for (const token of Array.isArray(order.accessTokens) ? order.accessTokens : []) {
      if (!token?.hash) continue;
      await client.query(
        `insert into public.order_access_tokens (order_id, token_hash, created_at, expires_at)
         values ($1, $2, coalesce($3::timestamptz, now()), $4::timestamptz)`,
        [order.id, token.hash, token.createdAt || null, token.expiresAt || null]
      );
    }

    await client.query('delete from public.order_messages where order_id = $1', [order.id]);
    for (const msg of Array.isArray(order.messages) ? order.messages : []) {
      if (!msg?.id) continue;
      await client.query(
        `insert into public.order_messages
           (id, order_id, sender, body, read_by_admin, read_by_buyer, created_at)
         values ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()))`,
        [
          msg.id,
          order.id,
          msg.sender === 'admin' ? 'admin' : 'buyer',
          msg.text || '',
          msg.readByAdmin === true,
          msg.readByBuyer === true,
          msg.createdAt || null,
        ]
      );
    }
  });

  return order;
}

async function patchOrder(id, patch) {
  const order = await getOrderById(id);
  if (!order) return null;
  const next = { ...order, ...patch, updatedAt: new Date().toISOString() };
  await upsertOrder(next);
  return getOrderById(id);
}

async function listOrdersByUserId(userId) {
  const { rows } = await query(
    `select ${ORDER_SELECT}
       from public.orders
      where user_id = $1
      order by created_at desc`,
    [userId]
  );

  const orders = [];
  for (const row of rows) {
    orders.push(await hydrateOrder(mapOrderRow(row)));
  }
  return orders;
}

module.exports = { listOrders, listOrdersByUserId, getOrderById, getOrderPaymentProofById, upsertOrder, patchOrder };
