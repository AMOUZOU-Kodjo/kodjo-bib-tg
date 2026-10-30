const CACHE_NAME = "archives-pwa-v2";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("archives-pwa-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put("/index.html", response.clone());
          return response;
        } catch {
          const cached = await caches.match("/index.html");
          return cached || (await caches.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const network = fetch(request)
          .then(async (response) => {
            if (response && response.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Archives de Documents";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "archives-notification",
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      const exact = windowClients.find((client) => client.url === target);
      if (exact) {
        await exact.focus();
        return;
      }
      const client = windowClients.find((item) => "focus" in item);
      if (client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
      await clients.openWindow(target);
    })()
  );
});
