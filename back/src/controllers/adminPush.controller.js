const { z } = require('zod');
const { getPublicKey, saveSubscription, removeSubscription } = require('../services/push.service');

const subscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

async function publicKey(req, res, next) {
  try {
    res.json({ publicKey: getPublicKey() });
  } catch (e) {
    next(e);
  }
}

async function subscribe(req, res, next) {
  try {
    const subscription = subscriptionSchema.parse(req.body);
    await saveSubscription(subscription);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function unsubscribe(req, res, next) {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    await removeSubscription(endpoint);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { publicKey, subscribe, unsubscribe };
