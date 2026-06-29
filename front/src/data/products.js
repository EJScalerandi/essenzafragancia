// Pexels CDN - no API key needed, no referrer restrictions
const P = (id, extra = "") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=640&h=800&fit=crop${extra}`;

// Verified perfume/fragrance photos from Pexels
const IMG = {
  // 965989 — D&G + Marc Jacobs Daisy bottles, feminine, warm golden tones
  feminine:    P(965989),
  feminineAlt: P(965989, "&crop=top"),

  // 755992 — Chanel No.5 luxury bottle, elegant, premium
  chanel:    P(755992),
  chanelAlt: P(755992, "&crop=bottom"),

  // 3059609 — Dark masculine cologne bottle on dark background
  dark:    P(3059609),
  darkAlt: P(3059609, "&crop=top"),

  // 4041392 — Amber dropper bottle with roses, oriental/arabic
  oriental:    P(4041392),
  orientalAlt: P(4041391),

  // 4041391 — Amber serum/oil dropper, concentrated fragrance aesthetic
  oil:    P(4041391),
  oilAlt: P(4041392),
};

export const products = [
  {
    "id": "ess-001",
    "name": "HAWAS MALIBU",
    "basePrice": 112000,
    "compareAtPrice": 135000,
    "transferPrice": 84000,
    "installments": "3 cuotas sin interés de $37.333,33",
    "description": "Fragancia árabe masculina de perfil fresco, moderno y tropical.",
    "category": "Árabes Hombre",
    "tags": ["Oferta", "Destacado"],
    "image": IMG.dark,
    "alternateImage": IMG.chanel,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 112000, "compareAtPrice": 135000, "stock": 8 }]
  },
  {
    "id": "ess-002",
    "name": "YARA CANDY",
    "basePrice": 68000,
    "compareAtPrice": 80000,
    "transferPrice": 51000,
    "installments": "3 cuotas sin interés de $22.666,67",
    "description": "Perfume árabe femenino dulce, frutal y envolvente.",
    "category": "Árabes Mujer",
    "tags": ["Oferta", "Destacado"],
    "image": IMG.feminine,
    "alternateImage": IMG.feminineAlt,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 68000, "compareAtPrice": 80000, "stock": 10 }]
  },
  {
    "id": "ess-003",
    "name": "ASAD ELIXIR",
    "basePrice": 92000,
    "compareAtPrice": 106000,
    "transferPrice": 69000,
    "installments": "3 cuotas sin interés de $30.666,67",
    "description": "Fragancia árabe intensa, especiada y elegante para noche.",
    "category": "Árabes Hombre",
    "tags": ["Oferta"],
    "image": IMG.oriental,
    "alternateImage": IMG.dark,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 92000, "compareAtPrice": 106000, "stock": 7 }]
  },
  {
    "id": "ess-004",
    "name": "VULCAN FEU",
    "basePrice": 102000,
    "compareAtPrice": 121000,
    "transferPrice": 76500,
    "installments": "3 cuotas sin interés de $34.000,00",
    "description": "Perfume árabe de carácter cálido, potente y sofisticado.",
    "category": "Árabes",
    "tags": ["Oferta"],
    "image": IMG.oil,
    "alternateImage": IMG.oriental,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 102000, "compareAtPrice": 121000, "stock": 6 }]
  },
  {
    "id": "ess-005",
    "name": "The Most Wanted Azzaro 100ML",
    "basePrice": 215999,
    "compareAtPrice": 250000,
    "transferPrice": 161999,
    "installments": "3 cuotas sin interés de $71.999,67",
    "description": "Perfume diseñador masculino con salida especiada y fondo intenso.",
    "category": "Diseñador Hombre",
    "tags": ["Oferta", "Destacado"],
    "image": IMG.chanel,
    "alternateImage": IMG.dark,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 215999, "compareAtPrice": 250000, "stock": 4 }]
  },
  {
    "id": "ess-006",
    "name": "MANDARIN SKY ELIXIR",
    "basePrice": 115000,
    "compareAtPrice": 142000,
    "transferPrice": 86250,
    "installments": "3 cuotas sin interés de $38.333,33",
    "description": "Fragancia cítrica especiada con impronta moderna.",
    "category": "Árabes",
    "tags": ["Oferta", "Sin stock"],
    "image": IMG.oil,
    "alternateImage": IMG.feminineAlt,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 115000, "compareAtPrice": 142000, "stock": 0 }]
  },
  {
    "id": "ess-007",
    "name": "Scandal Pour Homme Absolu 5ML",
    "basePrice": 21000,
    "compareAtPrice": 28000,
    "transferPrice": 15750,
    "installments": "",
    "description": "Decant de diseñador para probar la fragancia antes del frasco completo.",
    "category": "Decants Diseñador",
    "tags": ["Destacado", "Oferta"],
    "image": IMG.oriental,
    "alternateImage": IMG.oil,
    "variants": [{ "color": "Presentación", "size": "5ML", "price": 21000, "compareAtPrice": 28000, "stock": 12 }]
  },
  {
    "id": "ess-008",
    "name": "LE MALE ELIXIR JEAN PAUL GAULTIER",
    "basePrice": 238000,
    "compareAtPrice": 0,
    "transferPrice": 178500,
    "installments": "3 cuotas sin interés de $79.333,33",
    "description": "Fragancia diseñador masculina intensa, dulce y ambarada.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.dark,
    "alternateImage": IMG.darkAlt,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 238000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-009",
    "name": "LE BEAU LE PARFUM JEAN PAUL GAULTIER",
    "basePrice": 280000,
    "compareAtPrice": 0,
    "transferPrice": 210000,
    "installments": "3 cuotas sin interés de $93.333,33",
    "description": "Perfume diseñador masculino elegante, cálido y seductor.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.chanel,
    "alternateImage": IMG.chanelAlt,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 280000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-010",
    "name": "LE BEAU PARADISE GARDEN JEAN PAUL GAULTIER",
    "basePrice": 240000,
    "compareAtPrice": 0,
    "transferPrice": 180000,
    "installments": "3 cuotas sin interés de $80.000,00",
    "description": "Fragancia diseñador tropical, fresca y con impronta premium.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.feminine,
    "alternateImage": IMG.chanel,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 240000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-011",
    "name": "BAD BOY COBALT ELIXIR",
    "basePrice": 229300,
    "compareAtPrice": 0,
    "transferPrice": 171975,
    "installments": "3 cuotas sin interés de $76.433,33",
    "description": "Diseñador masculino intenso, moderno y de alto impacto.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.dark,
    "alternateImage": IMG.oriental,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 229300, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-012",
    "name": "LE MALE LE PARFUM JEAN PAUL GAULTIER",
    "basePrice": 220000,
    "compareAtPrice": 0,
    "transferPrice": 165000,
    "installments": "3 cuotas sin interés de $73.333,33",
    "description": "Fragancia diseñador masculina con perfil especiado y elegante.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.oil,
    "alternateImage": IMG.dark,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 220000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-013",
    "name": "NAXOS XERJOFF",
    "basePrice": 540000,
    "compareAtPrice": 0,
    "transferPrice": 405000,
    "installments": "3 cuotas sin interés de $180.000,00",
    "description": "Fragancia nicho sofisticada, con carácter dulce, tabacoso y premium.",
    "category": "Nicho",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.chanel,
    "alternateImage": IMG.dark,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 540000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-014",
    "name": "Scandal Pour Homme Absolu Jean Paul Gaultier",
    "basePrice": 230000,
    "compareAtPrice": 0,
    "transferPrice": 172500,
    "installments": "3 cuotas sin interés de $76.666,67",
    "description": "Frasco completo de diseñador con perfil intenso y seductor.",
    "category": "Diseñador Hombre",
    "tags": ["Destacado", "Sin stock"],
    "image": IMG.feminine,
    "alternateImage": IMG.oil,
    "variants": [{ "color": "Presentación", "size": "100ML", "price": 230000, "compareAtPrice": null, "stock": 0 }]
  },
  {
    "id": "ess-015",
    "name": "COMBO 5 DECANTS DE 5ML",
    "basePrice": 90500,
    "compareAtPrice": 0,
    "transferPrice": 67875,
    "installments": "3 cuotas sin interés de $30.166,67",
    "description": "Combo ideal para probar cinco fragancias en presentación decant de 5ML.",
    "category": "COMBO DECANTS 5ML",
    "tags": ["Nuevo", "Destacado"],
    "image": IMG.oriental,
    "alternateImage": IMG.feminine,
    "variants": [{ "color": "Presentación", "size": "5ML x5", "price": 90500, "compareAtPrice": null, "stock": 10 }]
  }
];
