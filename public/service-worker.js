const CACHE_NAME = "nova-store-v7";
const STATIC_ASSETS = [
  "/favicon.svg",
  "/brand/logo.png",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_ASSETS.some(asset => url.pathname === asset);
  const isImage = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i);
  const isFont = url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/i);
  const isApi = url.pathname.startsWith("/api/");

  if (isApi) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  if (isStaticAsset || isImage || isFont) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "NOVA Store", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/brand/icon-192.png",
    badge: data.badge || "/brand/icon-96.png",
    tag: data.tag || "nova-notification",
    data: data.data || {},
    actions: [],
    vibrate: [100, 50, 100],
  };

  if (data.url) {
    options.data.url = data.url;
  }

  event.waitUntil(self.registration.showNotification(data.title || "NOVA Store", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) {
        self.clients.openWindow(url);
      }
    })
  );
});
