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
    // ... (Phần Install, Activate, Tiles, API giữ nguyên như cũ) ...

    // 3. Pages & Assets - Logic đã sửa (Fix lỗi mất App khi reload/đổi tab)
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Chỉ cache những request hợp lệ
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
                // MẤT MẠNG: Xử lý fallback

                // Bước 1: Tìm chính xác file trong cache (dành cho JS, CSS, Img đã cache)
                return caches.match(request).then((response) => {
                    if (response) {
                        return response;
                    }

                    // Bước 2: Xử lý Navigation (HTML)
                    // Nếu là request điều hướng trang (mode 'navigate') hoặc request lấy HTML
                    if (request.mode === 'navigate' || request.headers.get("accept").includes("text/html")) {
                        // QUAN TRỌNG: Thay vì trả về offline ngay, hãy trả về App Shell ("/")
                        // Vì App của bạn cần load file gốc trước, sau đó JS mới chạy để hiện nội dung
                        return caches.match("/").then((rootResponse) => {
                            return rootResponse || caches.match("/offline");
                        });
                    }

                    // Nếu là ảnh/file khác không có trong cache -> Có thể trả về ảnh placeholder hoặc null
                    return null;
                });
            })
    );
});
console.log("[SW] Service Worker loaded"); console.log("[SW] Service Worker loaded");
