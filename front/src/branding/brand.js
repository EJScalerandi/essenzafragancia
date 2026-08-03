export const BRAND = {
  name: "Essenza Fragancia",
  segment: "Perfumería",
  tagline: "Fragancias originales, decants y perfumes árabes seleccionados.",
  shortName: "EF",
};

export const BANK_TRANSFER_MESSAGE =
  "Con transferencia o depósito tenés precio especial. Coordinamos la acreditación y el envío por WhatsApp.";

export const CHAT_PAYMENT_SUBTITLE =
  "¿Preferís coordinar tu pago vos mismo? Escribinos por WhatsApp y lo resolvemos directo con vos.";

export const CHAT_PAYMENT_WARNING =
  "El monto puede variar según la cantidad de cuotas: el pago financiado puede estar sujeto a intereses.";

export const DEFAULT_MUSIC = {
  enabled: false,
  mode: "sequential",
  tracks: [],
};

export const DEFAULT_WELCOME_POPUP = {
  enabled: true,
  title: "Hola",
  subtitle: "Hacé tu pedido en simples pasos:",
  steps: [
    "Elegí los productos que quieras",
    "Revisá y completá tu pedido",
    "¡Listo! Generamos tu pedido para que el comercio lo reciba por WhatsApp",
  ],
};

export const DEFAULT_PROMOTIONS = [
  {
    id: "perk-decant-5ml",
    title: "Decant de 5ML de regalo",
    description: "En compras desde $150.000 te llevás un decant de 5ML de regalo.",
    minAmount: 150000,
    enabled: true,
    sortOrder: 1,
  },
];

export const DEFAULT_HOME_IMAGES = [];

export const DEFAULT_PAYMENTS = {
  mercadopago: {
    enabled: true,
  },
  bankTransfer: {
    enabled: true,
    accountHolder: "",
    bankName: "",
    alias: "",
    cbu: "",
    cuit: "20462263970",
    instructions: BANK_TRANSFER_MESSAGE,
  },
  chatPayment: {
    enabled: true,
    subtitle: CHAT_PAYMENT_SUBTITLE,
    warning: CHAT_PAYMENT_WARNING,
  },
};

export const DEFAULT_CONTACT_LINKS = {
  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "543572585775",
  addressText: "",
  addressUrl: "",
};

export const STORAGE_KEYS = {
  ADMIN_TOKEN: "essenza_fragancia_admin_token",
  BUYER_TOKEN: "essenza_fragancia_buyer_token",
  CART: "essenza_fragancia_cart_v1",
  WELCOME_POPUP_SEEN: "essenza_fragancia_welcome_popup_seen",
  PRODUCTS: "essenza_fragancia_products_v1",
  PRODUCTS_UPDATED: "essenza_fragancia_products_updated",
  LAST_ORDER: "essenza_fragancia_last_order_id",
  ORDER_TOKEN_PREFIX: "essenza_fragancia_order_token_",
  PAYMENT_CLEARED_PREFIX: "essenza_fragancia_payment_cleared_",
};

export function normalizeStoreName(value) {
  const name = String(value || "").trim();
  if (!name || /storefront/i.test(name) || /karolin/i.test(name)) return BRAND.name;
  return name;
}

export function normalizeMusicSettings(value = DEFAULT_MUSIC) {
  const music = value && typeof value === "object" ? value : DEFAULT_MUSIC;
  const tracks = Array.isArray(music.tracks) ? music.tracks : [];

  return {
    enabled: music.enabled === true,
    mode: music.mode === "random" ? "random" : "sequential",
    tracks: tracks
      .filter((track) => track && track.url)
      .slice(0, 10)
      .map((track, index) => ({
        id: String(track.id || `track-${index + 1}`),
        title: String(track.title || track.fileName || `Tema ${index + 1}`),
        fileName: String(track.fileName || ""),
        url: String(track.url),
        enabled: track.enabled !== false,
        sortOrder: Number.isFinite(Number(track.sortOrder)) ? Number(track.sortOrder) : index + 1,
        uploadedAt: track.uploadedAt || null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function normalizeHomeImages(value = DEFAULT_HOME_IMAGES) {
  const images = Array.isArray(value) ? value : DEFAULT_HOME_IMAGES;

  return images
    .filter((image) => image && image.url)
    .slice(0, 8)
    .map((image, index) => ({
      id: String(image.id || `home-image-${index + 1}`),
      title: String(image.title || image.fileName || `Imagen ${index + 1}`),
      fileName: String(image.fileName || ""),
      url: String(image.url),
      enabled: image.enabled !== false,
      sortOrder: Number.isFinite(Number(image.sortOrder)) ? Number(image.sortOrder) : index + 1,
      uploadedAt: image.uploadedAt || null,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizePayments(value = DEFAULT_PAYMENTS) {
  const payments = value && typeof value === "object" ? value : DEFAULT_PAYMENTS;
  const bank = payments.bankTransfer && typeof payments.bankTransfer === "object" ? payments.bankTransfer : {};
  const mp = payments.mercadopago && typeof payments.mercadopago === "object" ? payments.mercadopago : {};
  const chat = payments.chatPayment && typeof payments.chatPayment === "object" ? payments.chatPayment : {};

  return {
    mercadopago: {
      enabled: mp.enabled !== false,
    },
    bankTransfer: {
      enabled: bank.enabled !== false,
      accountHolder: String(bank.accountHolder || ""),
      bankName: String(bank.bankName || ""),
      alias: String(bank.alias || ""),
      cbu: String(bank.cbu || ""),
      cuit: String(bank.cuit || ""),
      instructions: String(bank.instructions || BANK_TRANSFER_MESSAGE),
    },
    chatPayment: {
      enabled: chat.enabled !== false,
      subtitle: String(chat.subtitle || CHAT_PAYMENT_SUBTITLE),
      warning: String(chat.warning || CHAT_PAYMENT_WARNING),
    },
  };
}

export function normalizeWelcomePopup(value = DEFAULT_WELCOME_POPUP) {
  const popup = value && typeof value === "object" ? value : DEFAULT_WELCOME_POPUP;
  const steps = Array.isArray(popup.steps) ? popup.steps : DEFAULT_WELCOME_POPUP.steps;

  return {
    enabled: popup.enabled !== false,
    title: String(popup.title || DEFAULT_WELCOME_POPUP.title).trim() || DEFAULT_WELCOME_POPUP.title,
    subtitle: String(popup.subtitle || DEFAULT_WELCOME_POPUP.subtitle).trim(),
    steps: steps.map((step) => String(step || "").trim()).filter(Boolean).slice(0, 6),
  };
}

export function normalizePromotions(value = DEFAULT_PROMOTIONS) {
  const promotions = Array.isArray(value) ? value : DEFAULT_PROMOTIONS;

  return promotions
    .filter((promo) => promo && String(promo.title || "").trim())
    .slice(0, 20)
    .map((promo, index) => ({
      id: String(promo.id || `perk-${index + 1}`),
      title: String(promo.title || "").trim(),
      description: String(promo.description || "").trim(),
      minAmount: Number.isFinite(Number(promo.minAmount)) ? Number(promo.minAmount) : 0,
      enabled: promo.enabled !== false,
      sortOrder: Number.isFinite(Number(promo.sortOrder)) ? Number(promo.sortOrder) : index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizeContactLinks(value = DEFAULT_CONTACT_LINKS) {
  const contact = value && typeof value === "object" ? value : DEFAULT_CONTACT_LINKS;

  return {
    instagramUrl: String(contact.instagramUrl || "").trim(),
    facebookUrl: String(contact.facebookUrl || "").trim(),
    whatsappNumber: String(contact.whatsappNumber || "").trim(),
    addressText: String(contact.addressText || "").trim(),
    addressUrl: String(contact.addressUrl || "").trim(),
  };
}
