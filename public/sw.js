const CACHE_NAME = "pwa-cache-v2";
const RUNTIME_CACHE = "runtime-cache-v1";
const PAGES_CACHE = "pages-cache-v1";
const TILES_CACHE = "osm-tiles-v1";

const PRECACHE_URLS = [
    "/offline.html",
    "/manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.map((n) => {
                    if (![CACHE_NAME, RUNTIME_CACHE, PAGES_CACHE, TILES_CACHE].includes(n)) {
                        return caches.delete(n);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET") return;

    // ⭐ CÁCH 2: HTML navigation (QUAN TRỌNG NHẤT)
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(PAGES_CACHE).then((cache) => {
                        cache.put(request.url, copy);
                    });
                    return response;
                })
                .catch(() =>
                    caches.open(PAGES_CACHE)
                        .then((cache) => cache.match(request.url))
                        .then((cached) => cached || caches.match("/offline.html"))
                )
        );
        return;
    }

    // OSM tiles – cache first
    if (url.hostname.includes("openstreetmap") || url.hostname.includes("tile")) {
        event.respondWith(
            caches.match(request).then((res) => {
                if (res) return res;
                return fetch(request).then((netRes) => {
                    caches.open(TILES_CACHE).then((c) => c.put(request, netRes.clone()));
                    return netRes;
                });
            })
        );
        return;
    }

    // API – network first
    if (
        url.origin === "https://travel-safety-backend.onrender.com" ||
        url.pathname.startsWith("/api")
    ) {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    caches.open(RUNTIME_CACHE).then((c) => c.put(request, res.clone()));
                    return res;
                })
                .catch(() => caches.match(request))
        );
        return;
    }
});

console.log("[SW] Service Worker loaded (CACH 2)");
