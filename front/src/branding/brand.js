export const BRAND = {
  name: "Karolin Active",
  segment: "Indumentaria",
  tagline: "Gracias por tu compra!",
  shortName: "KA",
};

export const BANK_TRANSFER_MESSAGE =
  "Las transferencias bancarias pueden demorar un poco debido a que se debe conciliar el pago. Recibirás un correo cuando se haya realizado.";

export const DEFAULT_MUSIC = {
  enabled: true,
  mode: "sequential",
  tracks: [
    {
      id: "default-revive-the-light",
      title: "Revive the Light",
      fileName: "hvrgnd-schallraum-revive-the-light-343766.mp3",
      url: "/music/hvrgnd-schallraum-revive-the-light-343766.mp3",
      enabled: true,
      sortOrder: 1,
      uploadedAt: "2026-05-04T00:00:00.000Z",
    },
  ],
};

export const DEFAULT_HOME_IMAGES = [
  {
    id: "hero-active-set",
    title: "Set Active Essential",
    fileName: "active-set.png",
    url: "/products/active-set.png",
    enabled: true,
    sortOrder: 1,
    uploadedAt: "2026-05-04T00:00:00.000Z",
  },
  {
    id: "hero-windbreaker",
    title: "Campera Rompeviento Aura",
    fileName: "windbreaker.png",
    url: "/products/windbreaker.png",
    enabled: true,
    sortOrder: 2,
    uploadedAt: "2026-05-04T00:00:00.000Z",
  },
  {
    id: "hero-hoodie-set",
    title: "Hoodie Set Comfort",
    fileName: "hoodie-set.png",
    url: "/products/hoodie-set.png",
    enabled: true,
    sortOrder: 3,
    uploadedAt: "2026-05-04T00:00:00.000Z",
  },
  {
    id: "hero-basic-tee",
    title: "Remera Motion Basic",
    fileName: "basic-tee.png",
    url: "/products/basic-tee.png",
    enabled: true,
    sortOrder: 4,
    uploadedAt: "2026-05-04T00:00:00.000Z",
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
    cuit: "",
    instructions: BANK_TRANSFER_MESSAGE,
  },
};

export const DEFAULT_CONTACT_LINKS = {
  instagramUrl: "",
  facebookUrl: "",
  whatsappNumber: "",
  addressText: "",
  addressUrl: "",
};

export const STORAGE_KEYS = {
  ADMIN_TOKEN: "karolin_active_admin_token",
  BUYER_TOKEN: "karolin_active_buyer_token",
  CART: "karolin_active_cart_v1",
  PRODUCTS: "karolin_active_products_v1",
  PRODUCTS_UPDATED: "karolin_active_products_updated",
  LAST_ORDER: "karolin_active_last_order_id",
  ORDER_TOKEN_PREFIX: "karolin_active_order_token_",
  PAYMENT_CLEARED_PREFIX: "karolin_active_payment_cleared_",
};

export function normalizeStoreName(value) {
  const name = String(value || "").trim();
  if (!name || /storefront/i.test(name)) return BRAND.name;
  return name;
}

export function normalizeMusicSettings(value = DEFAULT_MUSIC) {
  const music = value && typeof value === "object" ? value : DEFAULT_MUSIC;
  const tracks = Array.isArray(music.tracks) ? music.tracks : [];

  return {
    enabled: music.enabled !== false,
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
