const webpush = require('web-push');
const { query } = require('../db/postgres');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

const isConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

function getPublicKey() {
  return VAPID_PUBLIC_KEY;
}

async function saveSubscription(subscription) {
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    const err = new Error('Suscripción de notificaciones inválida.');
    err.status = 400;
    throw err;
  }

  await query(
    `insert into public.push_subscriptions (endpoint, p256dh, auth)
     values ($1, $2, $3)
     on conflict (endpoint) do update set
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       updated_at = now()`,
    [endpoint, p256dh, auth]
  );
}

async function removeSubscription(endpoint) {
  if (!endpoint) return;
  await query('delete from public.push_subscriptions where endpoint = $1', [endpoint]);
}

async function notifyNewSale({ orderId, customerName, total }) {
  if (!isConfigured) return;

  const { rows } = await query('select endpoint, p256dh, auth from public.push_subscriptions');
  if (!rows.length) return;

  const money = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  const payload = JSON.stringify({
    title: '¡Nueva venta! 🎉',
    body: `${customerName || 'Un cliente'} compró ${money.format(Number(total || 0))} (pedido ${orderId})`,
    url: `/admin/orders/${orderId}`,
  });

  await Promise.all(
    rows.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await removeSubscription(row.endpoint);
        } else {
          console.error('[PUSH] Failed to send notification:', e.message || e);
        }
      }
    })
  );
}

module.exports = { isConfigured, getPublicKey, saveSubscription, removeSubscription, notifyNewSale };
