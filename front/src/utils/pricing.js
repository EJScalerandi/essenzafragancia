// src/utils/pricing.js

export function getMinPrice(product) {
  if (!product) return 0;

  // Si hay variantes, tomamos el mínimo precio válido
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n));

    if (prices.length > 0) return Math.min(...prices);
  }

  // Fallbacks
  const base = Number(product.basePrice);
  if (Number.isFinite(base)) return base;

  const p = Number(product.price);
  if (Number.isFinite(p)) return p;

  return 0;
}

export function getPriceLabel(product) {
  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  return hasVariants ? "Desde" : "";
}