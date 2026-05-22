import { STORAGE_KEYS } from "../branding/brand.js";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

export function buildApiUrl(path) {
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

async function request(path, options = {}, tokenKey) {
  const url = buildApiUrl(path);
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function apiFetch(path, options = {}) {
  return request(path, options, STORAGE_KEYS.ADMIN_TOKEN);
}

export function apiFetchBuyer(path, options = {}) {
  return request(path, options, STORAGE_KEYS.BUYER_TOKEN);
}
