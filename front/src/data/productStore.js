import { products as seedProducts } from "./products.js";

const KEY = "dflex_products_v1";

export function initProducts() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seedProducts));
    }
  } catch {
    // ignore
  }
}

export function getProducts() {
  initProducts();
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setProducts(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("dflex_products_updated"));
}

export function resetProductsToSeed() {
  setProducts(seedProducts);
}

export function upsertProduct(product) {
  const list = getProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  const next = idx >= 0 ? list.map((p, i) => (i === idx ? product : p)) : [...list, product];
  setProducts(next);
}

export function deleteProduct(id) {
  const list = getProducts();
  setProducts(list.filter((p) => p.id !== id));
}