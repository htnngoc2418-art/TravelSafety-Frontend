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
// ... (Phần trên giữ nguyên) ...

// Fetch handler
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") {
        return;
    }

    // 1. OSM Tiles - Cache first (Giữ nguyên logic của bạn)
    if (url.hostname.includes("openstreetmap") || url.hostname.includes("tile")) {
        event.respondWith(
            caches.match(request).then((response) => {
                if (response) return response;
                return fetch(request).then((response) => {
                    const responseToCache = response.clone();
                    caches.open(TILES_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                });
                // Tile lỗi thì kệ, không trả về /offline ở đây
            })
        );
        return;
    }

    // 2. API calls - Network first (Giữ nguyên)
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
                    return caches.match(request); // Chỉ trả về nếu có trong cache, không fallback về offline
                })
        );
        return;
    }

    // 3. Pages & Assets - Logic Mới (Sửa lỗi crash)
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Chỉ cache những request hợp lệ (status 200)
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(PAGES_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Bước 1: Tìm trong cache xem có không
                return caches.match(request).then((response) => {
                    if (response) {
                        return response;
                    }

                    // Bước 2: QUAN TRỌNG - Chỉ trả về trang /offline nếu đây là request điều hướng (HTML)
                    // Kiểm tra header accept có chứa 'text/html' không
                    if (request.headers.get("accept").includes("text/html")) {
                        return caches.match("/offline");
                    }

                    // Nếu là ảnh/css/js mà lỗi mạng + không có cache -> Thì chịu chết (hoặc trả về ảnh placeholder)
                    // Chứ tuyệt đối không trả về /offline
                });
            })
    );
});
console.log("[SW] Service Worker loaded");
