const CACHE_NAME = "pwa-cache-v1";
const RUNTIME_CACHE = "runtime-cache-v1";
const PAGES_CACHE = "pages-cache-v1";
const TILES_CACHE = "osm-tiles-v1";

const PRECACHE_URLS = ["/", "/offline", "/manifest.json"];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((err) => {
        console.log("[SW] Precache error:", err);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== PAGES_CACHE &&
            cacheName !== TILES_CACHE
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch handler - Network first for API, Cache first for tiles
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // OSM Tiles - Cache first
  if (url.hostname.includes("openstreetmap") || url.hostname.includes("tile")) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            const responseToCache = response.clone();
            caches.open(TILES_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            return caches.match("/offline");
          });
      })
    );
    return;
  }

  // API calls - Network first
    if (url.origin === "https://travel-safety-backend.onrender.com" || url.pathname.includes("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            return caches.match("/offline");
          });
        })
    );
    return;
  }

  // Pages - Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(PAGES_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          return caches.match("/offline");
        });
      })
  );
});

console.log("[SW] Service Worker loaded");
