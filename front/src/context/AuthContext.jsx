import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/http.js";
import { STORAGE_KEYS } from "../branding/brand.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    if (!token) {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        const me = await apiFetch("/api/auth/me");
        setUser(me?.user ?? null);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const api = useMemo(() => {
    const login = async (username, password) => {
      try {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });

        if (res?.token) localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.token);
        setUser(res?.user ?? null);

        return { ok: true };
      } catch (e) {
        return { ok: false, message: e.message || "Usuario o contraseña inválidos" };
      }
    };

    const logout = () => {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      setUser(null);
    };

    return { user, booting, login, logout };
  }, [user, booting]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
