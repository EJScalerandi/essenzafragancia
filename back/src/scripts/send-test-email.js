require('dotenv').config();

// Env expected:
// - SMTP_HOST=smtp.gmail.com
// - SMTP_PORT=587 (or 465)
// - SMTP_SECURE=false (or true for 465)
// - SMTP_USER=yourgmail@gmail.com
// - SMTP_PASS=YOUR_16_CHAR_APP_PASSWORD
// - SMTP_FROM="Your Store <yourgmail@gmail.com>"
// Optional:
// - TEST_EMAIL_TO=destination@example.com (defaults to SMTP_USER)

const { sendOrderCreatedEmail } = require('../services/email.service');

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.env.SMTP_USER;
  if (!to) {
    console.error('[email:test] Missing TEST_EMAIL_TO or SMTP_USER in .env');
    process.exit(1);
  }

  const res = await sendOrderCreatedEmail({
    to,
    customerName: 'Test',
    orderId: 'o-test',
    token: 'testtoken',
    expiresAt: null,
  });

  if (res.mocked) {
    console.log('[email:test] SMTP not configured. Email was mocked.');
  } else {
    console.log('[email:test] Email sent OK. messageId:', res.messageId);
  }
}

main().catch((e) => {
  console.error('[email:test] Failed:', e && e.message ? e.message : e);
  process.exit(1);
});
