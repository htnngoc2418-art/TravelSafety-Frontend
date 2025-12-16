"use client";

// Service Worker Register
if (typeof window !== "undefined") {
  console.log("[SW] Checking SW support...");

  if ("serviceWorker" in navigator) {
    console.log("[SW] SW supported, waiting for page load...");

    window.addEventListener("load", async () => {
      console.log("[SW] Page loaded, registering SW from /sw.js");

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("[SW] ✅ Registered successfully!", registration);
        console.log(
          "[SW] Current state:",
          registration.active?.state || "no active worker"
        );

        // Monitor state changes
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

        // Check current active worker
        if (registration.active) {
          console.log(
            "[SW] ✅ Active worker found:",
            registration.active.state
          );
        } else if (registration.installing) {
          console.log("[SW] 🔄 Worker installing...");
        } else if (registration.waiting) {
          console.log("[SW] ⏳ Worker waiting...");
        }
      } catch (error) {
        console.error("[SW] ❌ Registration failed:", error);
        if (error instanceof Error) {
          console.error("[SW] Error details:", error.message);
        }
      }
    });
  } else {
    console.warn("[SW] ⚠️ Service Workers not supported in this browser");
  }
}
