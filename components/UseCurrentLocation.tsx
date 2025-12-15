"use client";

import { getNearestLocation } from "@/lib/location/getNearestLocation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";

export default function UseCurrentLocation({
  onGetLocation,
}: {
  onGetLocation: (gps: { lat: number; lon: number }, nearest: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const language = useStore((state) => state.language);
  const t = useTranslation(language);

  async function handleClick() {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          let nearest = null;
          try {
            nearest = await getNearestLocation(latitude, longitude);
          } catch (e) {
            console.error("getNearestLocation failed:", e);
          }

          // Always call onGetLocation with GPS (nearest may be null on error)
          try {
            onGetLocation(
              { lat: latitude, lon: longitude }, // vị trí thật
              nearest // nearest từ CSV or null
            );
          } catch (e) {
            console.error("onGetLocation callback failed:", e);
          }

          setLoading(false);
        },
        () => {
          alert(t.locationError);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-2 bg-blue-500 text-white rounded-xl"
    >
      {loading ? t.locating : t.yourCurrentLocation}
    </button>
  );
}
