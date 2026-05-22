export const BRAND = {
  name: "Essenza Fragancia",
  segment: "Perfumería",
  tagline: "Fragancias originales, decants y perfumes árabes seleccionados.",
  shortName: "EF",
};

export const BANK_TRANSFER_MESSAGE =
  "Con transferencia o depósito tenés precio especial. Coordinamos la acreditación y el envío por WhatsApp.";

export const DEFAULT_MUSIC = {
  enabled: false,
  mode: "sequential",
  tracks: [],
};

export const DEFAULT_HOME_IMAGES = [
  {
    id: "hero-hawas-malibu",
    title: "HAWAS MALIBU",
    fileName: "hawas-malibu.svg",
    url: "/products/hawas-malibu.svg",
    enabled: true,
    sortOrder: 1,
    uploadedAt: "2026-05-22T00:00:00.000Z",
  },
  {
    id: "hero-yara-candy",
    title: "YARA CANDY",
    fileName: "yara-candy.svg",
    url: "/products/yara-candy.svg",
    enabled: true,
    sortOrder: 2,
    uploadedAt: "2026-05-22T00:00:00.000Z",
  },
  {
    id: "hero-the-most-wanted",
    title: "The Most Wanted Azzaro 100ML",
    fileName: "the-most-wanted-azzaro.svg",
    url: "/products/the-most-wanted-azzaro.svg",
    enabled: true,
    sortOrder: 3,
    uploadedAt: "2026-05-22T00:00:00.000Z",
  },
  {
    id: "hero-combo-decants",
    title: "COMBO 5 DECANTS DE 5ML",
    fileName: "combo-5-decants-5ml.svg",
    url: "/products/combo-5-decants-5ml.svg",
    enabled: true,
    sortOrder: 4,
    uploadedAt: "2026-05-22T00:00:00.000Z",
  },
];

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
  };
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
