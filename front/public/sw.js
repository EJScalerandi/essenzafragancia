self.addEventListener("push", (event) => {
  let data = { title: "Nueva venta", body: "Tenés una nueva venta.", url: "/admin/orders" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // ignore payloads that aren't JSON
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/essenza-favicon.png",
      badge: "/essenza-favicon.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
