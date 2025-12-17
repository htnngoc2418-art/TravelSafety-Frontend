"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function FlyToLocation({
  lat,
  lon,
  zoom = 14,
}: {
  lat: number;
  lon: number;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!lat || !lon) return;

    // Fly every time lat/lon change; default zoom is 14
    try {
      map.flyTo([lat, lon], zoom, { duration: 0.8 });
    } catch (e) {
      // fallback to setView if flyTo fails for some reason
      map.setView([lat, lon], zoom);
    }

  }, [map, lat, lon]);

  return null;
}
