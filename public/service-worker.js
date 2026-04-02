self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(function (key) {
            return caches.delete(key);
          }),
        );
      } finally {
        await self.registration.unregister();
        if (self.clients && self.clients.matchAll) {
          const clients = await self.clients.matchAll({
            includeUncontrolled: true,
            type: "window",
          });
          clients.forEach(function (client) {
            client.navigate(client.url);
          });
        }
      }
    })(),
  );
});

self.addEventListener("fetch", function () {
  // Intentionally no-op. This file only exists to retire stale localhost service workers.
});
