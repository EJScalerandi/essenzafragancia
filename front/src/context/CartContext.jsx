import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { STORAGE_KEYS } from "../branding/brand.js";

const CartContext = createContext(null);

function toCartItem(productOrItem, variant) {
  if (productOrItem?.productId) return productOrItem;

  const product = productOrItem;
  let chosenVariant = variant ?? null;

  if (!chosenVariant && Array.isArray(product.variants) && product.variants.length > 0) {
    chosenVariant = product.variants[0];
  }

  if (!chosenVariant) {
    return {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price ?? product.basePrice ?? 0,
      image: product.image,
      category: product.category,
      variant: null,
    };
  }

  const color = chosenVariant.color;
  const size = chosenVariant.size;

  return {
    id: `${product.id}__${color}__${size}`,
    productId: product.id,
    name: product.name,
    price: chosenVariant.price ?? product.basePrice ?? 0,
    image: product.image,
    category: product.category,
    variant: { color, size },
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, qty, variant } = action.payload;
      const cartItem = toCartItem(product, variant);
      const existing = state.items.find((i) => i.id === cartItem.id);

      const items = existing
        ? state.items.map((i) => (i.id === cartItem.id ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { ...cartItem, qty }];

      return { ...state, items };
    }

    case "REMOVE_ONE": {
      const { id } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return state;

      const items = item.qty <= 1
        ? state.items.filter((i) => i.id !== id)
        : state.items.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));

      return { ...state, items };
    }

    case "DELETE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

function loadInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed?.items) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state));
  }, [state]);

  const api = useMemo(() => {
    const addItem = (product, qty = 1, variant = null) =>
      dispatch({ type: "ADD_ITEM", payload: { product, qty, variant } });

    const removeOne = (id) => dispatch({ type: "REMOVE_ONE", payload: { id } });
    const deleteItem = (id) => dispatch({ type: "DELETE_ITEM", payload: { id } });
    const clear = () => dispatch({ type: "CLEAR" });
    const count = state.items.reduce((acc, i) => acc + i.qty, 0);
    const total = state.items.reduce((acc, i) => acc + i.qty * i.price, 0);

    return { items: state.items, addItem, removeOne, deleteItem, clear, count, total };
  }, [state.items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
