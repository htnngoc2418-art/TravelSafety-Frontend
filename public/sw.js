const CACHE_NAME = "pwa-cache-v3"; // Đã đổi tên lên v3 để ép trình duyệt cập nhật
const RUNTIME_CACHE = "runtime-cache-v3";
const PAGES_CACHE = "pages-cache-v3";
const TILES_CACHE = "osm-tiles-v3";

// Danh sách file cần tải ngay lập tức. 
// Nếu bạn có file css/js chính (ví dụ: /style.css, /script.js), hãy thêm vào mảng này.
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

// 1. INSTALL - Cài đặt
self.addEventListener("install", (event) => {
    self.skipWaiting(); // Ép SW mới chạy ngay lập tức, không chờ user đóng tab
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
});

// 2. ACTIVATE - Dọn dẹp cache cũ
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Xóa hết các cache cũ không phải là v3
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
    self.clients.claim(); // Chiếm quyền điều khiển ngay lập tức
});

// 3. FETCH HANDLER - Xử lý logic mạng
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // A. XỬ LÝ OSM TILES (Bản đồ) - Cache First
    if (url.hostname.includes("openstreetmap") || url.hostname.includes("tile")) {
        event.respondWith(
            caches.match(request).then((response) => {
                return (
                    response ||
                    fetch(request).then((networkResponse) => {
                        caches.open(TILES_CACHE).then((cache) => {
                            cache.put(request, networkResponse.clone());
                        });
                        return networkResponse;
                    })
                );
            })
        );
        return;
    }

    // B. XỬ LÝ API (Backend) - Network First -> Cache -> JSON Fallback
    // Logic: Ưu tiên lấy mới -> Nếu lỗi mạng thì lấy cache -> Nếu không có cache thì trả về JSON rỗng (để không crash App)
    if (
        url.origin === "https://travel-safety-backend.onrender.com" ||
        url.pathname.includes("/api")
    ) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, resClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;

                        // QUAN TRỌNG: Trả về JSON giả để App không bị lỗi đỏ "Failed to fetch"
                        return new Response(
                            JSON.stringify({ error: "No internet connection", data: [] }),
                            {
                                status: 503,
                                headers: { "Content-Type": "application/json" },
                            }
                        );
                    });
                })
        );
        return;
    }

    // C. XỬ LÝ HTML/NAVIGATE (SPA Routing) - Network First -> Cache -> App Shell
    // Logic: Đây là phần sửa lỗi mở tab mới bị trắng trang/mất mạng
    if (request.mode === "navigate" || request.headers.get("accept").includes("text/html")) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(PAGES_CACHE).then((cache) => cache.put(request, resClone));
                    return response;
                })
                .catch(() => {
                    // Mất mạng:
                    return caches.match(request).then((response) => {
                        // 1. Có cache đúng trang đó thì trả về
                        if (response) return response;

                        // 2. Không có thì trả về trang chủ (App Shell) để App tự chạy routing
                        return caches.match("/")
                            .then(root => root || caches.match("/index.html"))
                            .then(finalRes => finalRes || caches.match("/offline")); // Đường cùng mới về offline
                    });
                })
        );
        return;
    }

    // D. CÁC FILE KHÁC (JS, CSS, IMG) - Stale-while-revalidate
    // Dùng cache cũ cho nhanh, đồng thời tải ngầm cái mới để lần sau dùng
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(PAGES_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
                }
                return networkResponse;
            }).catch(err => console.log(err));

            return cachedResponse || fetchPromise;
        })
    );
});