import { apiFetch } from "../api/http.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Este navegador no soporta notificaciones. En iPhone, agregá la app a la pantalla de inicio primero.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("No se dieron permisos de notificaciones.");
  }

  const { publicKey } = await apiFetch("/api/admin/push/public-key");
  if (!publicKey) {
    throw new Error("El servidor no tiene configuradas las notificaciones (falta VAPID_PUBLIC_KEY).");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await apiFetch("/api/admin/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription.toJSON()),
  });

  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await apiFetch("/api/admin/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint }),
  });
}
