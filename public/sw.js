/* PortFuel service worker — Web Push for watchlist alerts */

self.addEventListener("push", (event) => {
  let data = { title: "PortFuel", body: "", href: "/dashboard/notifications" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore malformed payload */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/pwa-192.png",
      badge: "/icons/pwa-192.png",
      data: { href: data.href },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/dashboard/notifications";
  event.waitUntil(self.clients.openWindow(href));
});
