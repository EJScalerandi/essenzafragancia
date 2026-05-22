const nodemailer = require('nodemailer');

function hasSmtpEnv() {
  if (!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM)) return false;
  if (process.env.SMTP_USER && !process.env.SMTP_PASS) return false;
  return true;
}

async function createTransport() {
  if (!hasSmtpEnv()) return null;

  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getBranding() {
  const storeName = process.env.EMAIL_BRAND_NAME || process.env.STORE_NAME || 'Karolin Active';
  const brandColor = process.env.EMAIL_BRAND_COLOR || '#111111';
  const supportEmail = process.env.EMAIL_SUPPORT || '';
  return { storeName, brandColor, supportEmail };
}

function emailWrapper({ title, preheader, bodyHtml }) {
  const { storeName, brandColor, supportEmail } = getBranding();
  const footerLine = supportEmail
    ? `¿Necesitás ayuda? Escribinos a <a href="mailto:${escapeHtml(supportEmail)}" style="color:${brandColor}">${escapeHtml(supportEmail)}</a>.`
    : '';

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${escapeHtml(title || storeName)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f2ec;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || '')}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f2ec;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #eee;">
                <div style="font-size:18px;font-weight:800;color:${brandColor}">${escapeHtml(storeName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-family:Arial, sans-serif;line-height:1.5;color:#111;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #eee;font-family:Arial, sans-serif;color:#666;font-size:12px;line-height:1.4;">
                ${footerLine}
                <div style="margin-top:8px;">© ${new Date().getFullYear()} ${escapeHtml(storeName)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function primaryButton({ href, label }) {
  const { brandColor } = getBranding();
  return `
    <a href="${href}"
       style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:12px 16px;border-radius:999px;font-weight:700">
       ${escapeHtml(label)}
    </a>
  `.trim();
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return 'no expira';
  try {
    return new Date(expiresAt).toLocaleString('es-AR');
  } catch {
    return String(expiresAt);
  }
}

async function sendMail({ to, subject, text, html }) {
  const transport = await createTransport();
  const payload = { from: process.env.SMTP_FROM, to, subject, text, html };

  if (!transport) {
    console.log('[EMAIL MOCK] To:', Array.isArray(to) ? to.join(', ') : to);
    console.log('[EMAIL MOCK] Subject:', subject);
    console.log('[EMAIL MOCK] Text:', text);
    return { ok: true, mocked: true };
  }

  const info = await transport.sendMail(payload);
  return { ok: true, mocked: false, messageId: info.messageId };
}

function buildOrderCreatedEmail({ orderId, link, customerName, expiresAt }) {
  const { storeName } = getBranding();
  const subject = `Confirmación de compra (${orderId}) - ${storeName}`;
  const preheader = `Tu pedido ${orderId} fue creado.`;

  const text = [
    `Hola ${customerName},`,
    '',
    `¡Gracias por tu compra! Tu pedido es: ${orderId}`,
    '',
    'Canal de comunicación privado:',
    link,
    '',
    `Validez del link: ${formatExpiry(expiresAt)}`,
    '',
    storeName,
  ].join('\n');

  const bodyHtml = `
    <h2 style="margin:0 0 10px 0;font-size:20px;">Gracias por tu compra</h2>
    <p>Hola <b>${escapeHtml(customerName)}</b>,</p>
    <p>Tu pedido es: <b>${escapeHtml(orderId)}</b></p>
    <div style="margin:16px 0;">
      ${primaryButton({ href: link, label: 'Abrir pedido y chat' })}
      <p style="font-size:12px;word-break:break-all;color:#666;">Link directo: <a href="${link}">${link}</a></p>
      <p style="font-size:12px;color:#666;">Validez del link: <b>${escapeHtml(formatExpiry(expiresAt))}</b></p>
    </div>
  `.trim();

  return { subject, text, html: emailWrapper({ title: subject, preheader, bodyHtml }) };
}

function buildOrderMessageEmail({ orderId, link, customerName, messagePreview, expiresAt }) {
  const { storeName } = getBranding();
  const subject = `Nuevo mensaje en tu pedido (${orderId}) - ${storeName}`;
  const preheader = `Tenés un nuevo mensaje en tu pedido ${orderId}.`;
  const preview = String(messagePreview || '').trim().slice(0, 240) || '(mensaje)';

  const text = [
    `Hola ${customerName},`,
    '',
    `Tenés un nuevo mensaje sobre tu pedido ${orderId}:`,
    '',
    `"${preview}"`,
    '',
    link,
    '',
    `Validez del link: ${formatExpiry(expiresAt)}`,
  ].join('\n');

  const bodyHtml = `
    <h2 style="margin:0 0 10px 0;font-size:20px;">Nuevo mensaje en tu pedido</h2>
    <p>Hola <b>${escapeHtml(customerName)}</b>,</p>
    <p>Tenés un nuevo mensaje sobre tu pedido <b>${escapeHtml(orderId)}</b>:</p>
    <div style="margin:12px 0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:10px;">
      ${escapeHtml(preview)}
    </div>
    <div style="margin:16px 0;">
      ${primaryButton({ href: link, label: 'Responder en el chat' })}
      <p style="font-size:12px;word-break:break-all;color:#666;">Link directo: <a href="${link}">${link}</a></p>
      <p style="font-size:12px;color:#666;">Validez del link: <b>${escapeHtml(formatExpiry(expiresAt))}</b></p>
    </div>
  `.trim();

  return { subject, text, html: emailWrapper({ title: subject, preheader, bodyHtml }) };
}

function buildAdminNewMessageEmail({ orderId, customerName, customerEmail, messagePreview, mode }) {
  const { storeName } = getBranding();
  const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const adminLink = `${base}/admin/orders/${encodeURIComponent(orderId)}`;
  const subject = mode === 'order_note'
    ? `Nueva consulta en la compra (${orderId}) - ${storeName}`
    : `Nuevo mensaje del comprador (${orderId}) - ${storeName}`;
  const preview = String(messagePreview || '').trim().slice(0, 240) || '(mensaje)';

  const text = [
    'Nuevo mensaje del comprador',
    `Orden: ${orderId}`,
    `Cliente: ${customerName || ''} <${customerEmail || ''}>`.trim(),
    '',
    `"${preview}"`,
    '',
    `Abrir en admin: ${adminLink}`,
  ].join('\n');

  const bodyHtml = `
    <h2 style="margin:0 0 10px 0;font-size:20px;">Nuevo mensaje del comprador</h2>
    <p>Orden: <b>${escapeHtml(orderId)}</b></p>
    <p>Cliente: <b>${escapeHtml(customerName || '')}</b> <span style="color:#666">${escapeHtml(customerEmail || '')}</span></p>
    <div style="margin:12px 0;padding:12px;border-left:4px solid #ddd;background:#fafafa;border-radius:10px;">${escapeHtml(preview)}</div>
    <div style="margin:16px 0;">${primaryButton({ href: adminLink, label: 'Abrir orden en Admin' })}</div>
  `.trim();

  return { subject, text, html: emailWrapper({ title: subject, preheader: subject, bodyHtml }) };
}

function buildPasswordResetEmail({ link, customerName }) {
  const { storeName } = getBranding();
  const subject = `Recuperar contraseña - ${storeName}`;
  const text = [
    `Hola ${customerName || ''}`.trim(),
    '',
    'Recibimos una solicitud para restablecer tu contraseña.',
    link,
    '',
    'Si no fuiste vos, ignorá este email.',
  ].join('\n');

  const bodyHtml = `
    <h2 style="margin:0 0 10px 0;font-size:20px;">Restablecer contraseña</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <div style="margin:16px 0;">${primaryButton({ href: link, label: 'Restablecer contraseña' })}</div>
    <p>Si no fuiste vos, ignorá este email.</p>
  `.trim();

  return { subject, text, html: emailWrapper({ title: subject, preheader: 'Restablecé tu contraseña.', bodyHtml }) };
}

function buildBankTransferVerifiedEmail({ customerName, orderId }) {
  const { storeName } = getBranding();
  const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${base}/order/${encodeURIComponent(orderId)}`;
  const subject = `Pago verificado (${orderId}) - ${storeName}`;

  const text = [
    `Hola ${customerName || ''}`.trim(),
    '',
    `Ya verificamos la transferencia bancaria de tu pedido ${orderId}.`,
    'Te avisaremos cuando el pedido avance de estado.',
    '',
    `Ver pedido: ${link}`,
    '',
    storeName,
  ].join('\n');

  const bodyHtml = `
    <h2 style="margin:0 0 10px 0;font-size:20px;">Pago verificado</h2>
    <p>Hola <b>${escapeHtml(customerName || '')}</b>,</p>
    <p>Ya verificamos la transferencia bancaria de tu pedido <b>${escapeHtml(orderId)}</b>.</p>
    <p>Te avisaremos cuando el pedido avance de estado.</p>
    <div style="margin:16px 0;">${primaryButton({ href: link, label: 'Ver pedido' })}</div>
  `.trim();

  return { subject, text, html: emailWrapper({ title: subject, preheader: subject, bodyHtml }) };
}

async function sendOrderCreatedEmail({ to, customerName, orderId, token, expiresAt }) {
  const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${base}/order/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`;
  const { subject, text, html } = buildOrderCreatedEmail({ orderId, link, customerName, expiresAt });
  const res = await sendMail({ to, subject, text, html });
  if (res.mocked) console.log('[EMAIL MOCK] Link:', link);
  return { ...res, link };
}

async function sendOrderMessageEmail({ to, customerName, orderId, token, messagePreview, expiresAt }) {
  const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${base}/order/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`;
  const { subject, text, html } = buildOrderMessageEmail({ orderId, link, customerName, messagePreview, expiresAt });
  const res = await sendMail({ to, subject, text, html });
  if (res.mocked) console.log('[EMAIL MOCK] Link:', link);
  return { ...res, link };
}

async function sendAdminNewMessageEmail({ to, orderId, customerName, customerEmail, messagePreview, mode }) {
  const { subject, text, html } = buildAdminNewMessageEmail({ orderId, customerName, customerEmail, messagePreview, mode });
  const res = await sendMail({ to, subject, text, html });

  if (res.mocked) {
    const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    console.log('[EMAIL MOCK] Admin link:', `${base}/admin/orders/${orderId}`);
  }

  return res;
}

async function sendPasswordResetEmail({ to, token, email, customerName }) {
  const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const link = `${base}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const { subject, text, html } = buildPasswordResetEmail({ link, customerName });
  const res = await sendMail({ to, subject, text, html });
  if (res.mocked) console.log('[EMAIL MOCK] Link:', link);
  return { ...res, link };
}

async function sendBankTransferVerifiedEmail({ to, customerName, orderId }) {
  const { subject, text, html } = buildBankTransferVerifiedEmail({ customerName, orderId });
  return sendMail({ to, subject, text, html });
}

module.exports = {
  sendOrderCreatedEmail,
  sendOrderMessageEmail,
  sendAdminNewMessageEmail,
  sendPasswordResetEmail,
  sendBankTransferVerifiedEmail,
};
