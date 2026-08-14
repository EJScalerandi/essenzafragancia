import { useCallback, useMemo, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "./useProducts.js";

// Se usa en cualquier lugar que lleve al comprador hacia /checkout (el botón
// "Comprar" del mini-carrito del navbar, y "Finalizar compra" en /cart) para
// que, en los dos casos, se ofrezcan los mismos accesorios "Sugerido" antes
// de continuar.
export function useAccessoryUpsell() {
  const { items, addItem } = useCart();
  const { products } = useProducts();

  const [open, setOpen] = useState(false);
  const pendingActionRef = useRef(null);

  const inCartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const suggestedAccessories = useMemo(
    () =>
      products.filter(
        (p) => p.category === "Accesorios" && (p.tags ?? []).includes("Sugerido") && !inCartIds.has(p.id)
      ),
    [products, inCartIds]
  );

  const goOrPrompt = useCallback(
    (action) => {
      if (suggestedAccessories.length > 0) {
        pendingActionRef.current = action;
        setOpen(true);
      } else {
        action();
      }
    },
    [suggestedAccessories]
  );

  const confirm = useCallback(() => {
    setOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  const cancel = useCallback(() => {
    setOpen(false);
    pendingActionRef.current = null;
  }, []);

  return { open, suggestedAccessories, addItem, goOrPrompt, confirm, cancel };
}
