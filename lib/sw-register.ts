"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        // 1. Chỉ chạy trên browser (client-side)
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            console.warn("[SW] ⚠️ Service Workers not supported or running on server");
            return;
        }

        // 2. Hàm đăng ký tách riêng
        const registerSW = async () => {
            console.log("[SW] 🚀 Starting registration...");
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                console.log("[SW] ✅ Registered successfully!", registration);

                // --- LOGIC MONITOR CŨ CỦA BẠN (Giữ nguyên) ---
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    console.log("[SW] 🔄 Update found, installing...");
                    if (newWorker) {
                        newWorker.addEventListener("statechange", () => {
                            console.log("[SW] State changed to:", newWorker.state);
                            if (newWorker.state === "activated") {
                                console.log("[SW] ✅ New Service Worker activated!");
                            }
                        });
                    }
                });
                // ---------------------------------------------

            } catch (error) {
                console.error("[SW] ❌ Registration failed:", error);
            }
        };

        // 3. LOGIC QUAN TRỌNG NHẤT (SỬA LỖI):
        // Kiểm tra xem trang đã load xong chưa?
        if (document.readyState === "complete") {
            // Nếu load xong rồi -> Chạy luôn, không đợi nữa
            registerSW();
        } else {
            // Nếu chưa xong -> Mới add event listener để đợi
            window.addEventListener("load", registerSW);
            return () => window.removeEventListener("load", registerSW); // Cleanup
        }

    }, []); // Chạy 1 lần duy nhất khi mount

    return null; // Component này không cần render giao diện
}