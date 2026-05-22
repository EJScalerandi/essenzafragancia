function getMinPrice(product) {
  if (!product) return 0;
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n));
    if (prices.length > 0) return Math.min(...prices);
  }
  const base = Number(product.basePrice);
  if (Number.isFinite(base)) return base;
  const p = Number(product.price);
  if (Number.isFinite(p)) return p;
  return 0;
}

module.exports = { getMinPrice };
