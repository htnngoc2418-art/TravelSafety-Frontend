"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        // 1. Chỉ chạy khi ở trình duyệt (client-side)
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {

            const registerSW = async () => {
                try {
                    const registration = await navigator.serviceWorker.register("/sw.js", {
                        scope: "/",
                        updateViaCache: "none",
                    });

                    console.log("[SW] ✅ Registered successfully:", registration.scope);

                    // Logic theo dõi update (giữ lại từ code cũ của bạn)
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "activated") {
                                    console.log("[SW] ✅ New Service Worker activated!");
                                }
                            });
                        }
                    });

                } catch (error) {
                    console.error("[SW] ❌ Registration failed:", error);
                }
            };

            // 2. [QUAN TRỌNG] Kiểm tra xem trang đã load xong chưa
            // Nếu load xong rồi (readyState === complete) thì chạy luôn, không cần đợi event 'load' nữa
            if (document.readyState === "complete") {
                registerSW();
            } else {
                window.addEventListener("load", registerSW);
                // Cleanup function
                return () => window.removeEventListener("load", registerSW);
            }
        }
    }, []);

    return null; // Component này không hiển thị gì cả
}