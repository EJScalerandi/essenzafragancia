const { query } = require('../db/postgres');

function prefixForPaymentMethod(paymentMethod) {
  return paymentMethod === 'mercadopago' ? 'M' : 'T';
}

async function nextOrderId(paymentMethod) {
  const prefix = prefixForPaymentMethod(paymentMethod);
  const sequenceName = prefix === 'M' ? 'public.order_mp_seq' : 'public.order_transfer_seq';
  const { rows } = await query(`select nextval('${sequenceName}')::bigint as value`);
  const value = Number(rows[0]?.value || 1);
  return `${prefix}${String(value).padStart(5, '0')}`;
}

module.exports = { nextOrderId, prefixForPaymentMethod };
