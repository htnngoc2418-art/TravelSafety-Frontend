"use client";

import dynamic from "next/dynamic";

// Load Marker dynamically on client to avoid importing leaflet during SSR
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

export default function UserMarker({
  position,
  L,
}: {
  position: { lat: number; lon: number };
  L: any;
}) {
  if (!L || !position) return null;

  const icon = L.divIcon({
    className: "",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateY(-50%);
      ">
        <div style="
          width: 18px;
          height: 18px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Marker is client-only
  return <Marker position={[position.lat, position.lon]} icon={icon} /> as any;
}
