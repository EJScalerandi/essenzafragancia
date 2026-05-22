const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

function mpClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token });
}

function splitName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { name: '', surname: '' };
  if (parts.length === 1) return { name: parts[0], surname: '' };
  return { name: parts.slice(0, -1).join(' '), surname: parts.at(-1) };
}

function normalizePublicUrl(value, fallback = 'https://karolinactive.vercel.app') {
  let raw = String(value || fallback || '').trim();

  // Render/Vercel vars sometimes get pasted with wrapping quotes or spaces.
  raw = raw.replace(/^["']+|["']+$/g, '').trim();

  // Defensive fix for accidental missing leading "h":
  // "ttps://site.com" -> "https://site.com"
  // "ttp://site.com"  -> "http://site.com"
  if (raw.startsWith('ttps://')) raw = `h${raw}`;
  if (raw.startsWith('ttp://')) raw = `h${raw}`;

  // If somebody pasted only the domain, assume https.
  if (raw && !/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  // Final fallback.
  if (!raw || !/^https?:\/\//i.test(raw)) {
    raw = fallback;
  }

  return raw.replace(/\/+$/, '');
}

function buildBackUrls({ frontendBaseUrl, draftId }) {
  const publicFrontendUrl = normalizePublicUrl(frontendBaseUrl || process.env.FRONTEND_BASE_URL);
  const encodedDraftId = encodeURIComponent(draftId);

  return {
    success: `${publicFrontendUrl}/payment/success?draftId=${encodedDraftId}`,
    pending: `${publicFrontendUrl}/payment/pending?draftId=${encodedDraftId}`,
    failure: `${publicFrontendUrl}/payment/failure?draftId=${encodedDraftId}`,
  };
}

async function createPreference({ draft, webhookUrl, frontendBaseUrl }) {
  const client = mpClient();
  if (!client) {
    const err = new Error('MercadoPago no configurado: falta MP_ACCESS_TOKEN');
    err.status = 501;
    err.code = 'NotConfigured';
    throw err;
  }

  const preference = new Preference(client);
  const items = draft.items.map((i) => ({
    id: i.productId,
    title: i.variant ? `${i.name} (${i.variant.color}/${i.variant.size})` : i.name,
    quantity: Number(i.qty) || 1,
    unit_price: Number(i.price) || 0,
    currency_id: 'ARS',
  }));

  const shipping = Number(draft?.totals?.shipping || 0);
  if (shipping > 0) {
    items.push({
      id: 'shipping',
      title: 'Envío',
      quantity: 1,
      unit_price: shipping,
      currency_id: 'ARS',
    });
  }

  const backUrls = buildBackUrls({ frontendBaseUrl, draftId: draft.id });
  const cleanWebhookUrl = webhookUrl
    ? normalizePublicUrl(webhookUrl, 'https://karolinactive.onrender.com/api/payments/mp/webhook')
    : undefined;

  const customer = draft.customer || {};
  const { name, surname } = splitName(customer.fullName || '');

  const body = {
    items,
    external_reference: draft.id,
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: cleanWebhookUrl || undefined,
    payer: {
      name,
      surname,
      email: customer.email || undefined,
      phone: customer.phone ? { number: String(customer.phone) } : undefined,
      address: customer.address ? {
        street_name: String(customer.address),
        zip_code: String(customer.zip || ''),
      } : undefined,
    },
    metadata: {
      checkout_draft_id: draft.id,
      store: 'karolin_active',
    },
    statement_descriptor: 'KAROLIN ACTIVE',
  };

  console.log('[mp] back_urls', body.back_urls);
  console.log('[mp] notification_url', body.notification_url || '');

  return preference.create({ body });
}

async function getPayment(paymentId) {
  const client = mpClient();
  if (!client) {
    const err = new Error('MercadoPago no configurado: falta MP_ACCESS_TOKEN');
    err.status = 501;
    err.code = 'NotConfigured';
    throw err;
  }

  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

module.exports = {
  createPreference,
  getPayment,
  normalizePublicUrl,
};
