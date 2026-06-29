import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/http.js";
import { products as seedProducts } from "../data/products.js";

async function fetchAllProducts() {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const all = [];

  while (page <= totalPages) {
    const res = await apiFetch(`/api/products?page=${page}&pageSize=${pageSize}&sort=relevance`);
    const items = Array.isArray(res?.items) ? res.items : [];
    all.push(...items);
    totalPages = Number(res?.totalPages) || 1;
    page += 1;
  }

  return all;
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchAllProducts();
      setProducts(all.length ? all : seedProducts);
    } catch {
      setProducts(seedProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsertProduct = async (product) => {
    const exists = products.some((p) => p.id === product.id);

    if (exists) {
      await apiFetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        body: JSON.stringify(product),
      });
    } else {
      await apiFetch(`/api/admin/products`, {
        method: "POST",
        body: JSON.stringify(product),
      });
    }
    await refresh();
  };

  const deleteProduct = async (id) => {
    await apiFetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refresh();
  };

  const resetProductsToSeed = async () => {
    const res = await apiFetch("/api/admin/products");
    const items = Array.isArray(res?.items) ? res.items : [];

    for (const p of items) {
      await apiFetch(`/api/admin/products/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    }

    for (const p of seedProducts) {
      await apiFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(p),
      });
    }

    await refresh();
  };

  return {
    products,
    loading,
    refresh,
    upsertProduct,
    deleteProduct,
    resetProductsToSeed,
  };
}
