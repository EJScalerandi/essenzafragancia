import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetchBuyer } from "../api/http.js";
import { STORAGE_KEYS } from "../branding/brand.js";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.BUYER_TOKEN);
    if (!token) {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        const me = await apiFetchBuyer("/api/account/me");
        setUser(me?.user ?? null);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.BUYER_TOKEN);
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const api = useMemo(() => {
    const login = async (email, password) => {
      try {
        const res = await apiFetchBuyer("/api/account/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (res?.token) localStorage.setItem(STORAGE_KEYS.BUYER_TOKEN, res.token);
        setUser(res?.user ?? null);
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e.message || "Login inválido" };
      }
    };

    const register = async ({ email, password, fullName }) => {
      try {
        const res = await apiFetchBuyer("/api/account/register", {
          method: "POST",
          body: JSON.stringify({ email, password, fullName }),
        });

        if (res?.token) localStorage.setItem(STORAGE_KEYS.BUYER_TOKEN, res.token);
        setUser(res?.user ?? null);
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e.message || "No se pudo crear la cuenta" };
      }
    };

    const setSession = ({ token, user }) => {
      if (token) localStorage.setItem(STORAGE_KEYS.BUYER_TOKEN, token);
      if (user) setUser(user);
    };

    const updateUser = (nextUser) => {
      setUser(nextUser ?? null);
    };

    const logout = () => {
      localStorage.removeItem(STORAGE_KEYS.BUYER_TOKEN);
      setUser(null);
    };

    return { user, booting, login, register, logout, setSession, updateUser };
  }, [user, booting]);

  return <CustomerAuthContext.Provider value={api}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
