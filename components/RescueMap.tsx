"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

// --- 1. Fix Icon Leaflet ---
const iconFix = () => {
  if (
    typeof window !== "undefined" &&
    !(L.Icon.Default.prototype as any)._fixed
  ) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
    (L.Icon.Default.prototype as any)._fixed = true; 
  }
};

interface RescueMapProps {
  userLocation: { lat: number; lng: number } | null;
  destination: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null;
  onRouteFound?: (summary: {
    totalDistance: number;
    totalTime: number;
  }) => void;
}

// --- 2. Component Routing Nâng Cao ---
const RoutingMachine = ({ userLocation, destination, onRouteFound }: any) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);
  // [FIX] Ref để quản lý đường kẻ dự phòng (khi mất mạng/lỗi server)
  const fallbackLineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !userLocation?.lat || !userLocation?.lng) return;

    // Xóa đường kẻ dự phòng cũ nếu có
    if (fallbackLineRef.current) {
        map.removeLayer(fallbackLineRef.current);
        fallbackLineRef.current = null;
    }

    const waypoints = [L.latLng(userLocation.lat, userLocation.lng)];

    if (destination?.lat && destination?.lng) {
      waypoints.push(L.latLng(destination.lat, destination.lng));
    }

    // Nếu chưa có đích đến thì chưa cần tìm đường
    if (waypoints.length < 2) return;

    if (!routingControlRef.current) {
      try {
        const routingControl = (L as any).Routing.control({
          waypoints: waypoints,
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          show: false, 
          collapsible: true,
          addWaypoints: false, 
          draggableWaypoints: false,
          lineOptions: {
            styles: [{ color: "#3b82f6", opacity: 0.8, weight: 6 }],
          },
          createMarker: () => null, 
          router: new (L as any).Routing.OSRMv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "driving" // Thêm profile rõ ràng
          }),
        });

        routingControl.on("routesfound", (e: any) => {
          // Nếu tìm thấy đường -> Xóa đường dự phòng (nếu đang hiện)
          if (fallbackLineRef.current) {
            map.removeLayer(fallbackLineRef.current);
            fallbackLineRef.current = null;
          }

          const routes = e.routes;
          const summary = routes[0].summary;

          try {
            const midIndex = Math.floor(routes[0].coordinates.length / 2);
            const midPoint = routes[0].coordinates[midIndex];

            if (map) {
              map.closePopup();
              const popupDiv = document.createElement("div");
              popupDiv.style.textAlign = "center";
              popupDiv.innerHTML = `
                <b style="color: #ea580c;">${(summary.totalDistance / 1000).toFixed(1)} km</b><br/>
                ~ ${Math.round(summary.totalTime / 60)} phút
              `;
              L.popup().setLatLng(midPoint).setContent(popupDiv).openOn(map);
            }
          } catch (err) {}

          if (onRouteFound) onRouteFound(summary);
        });

        // [FIX QUAN TRỌNG] Xử lý khi Lỗi Routing (Offline hoặc Server chết)
        routingControl.on("routingerror", (e: any) => {
             console.warn("Routing failed (Offline/Server Error). Switching to Fallback Line.", e);
             
             // 1. Vẽ đường thẳng nối 2 điểm (Polyline)
             if (map && userLocation && destination) {
                 // Xóa line cũ nếu có
                 if (fallbackLineRef.current) map.removeLayer(fallbackLineRef.current);
                 
                 const fallbackLine = L.polyline([
                     [userLocation.lat, userLocation.lng],
                     [destination.lat, destination.lng]
                 ], {
                     color: '#ef4444', // Màu đỏ để báo hiệu đường dự phòng
                     weight: 4,
                     dashArray: '10, 10', // Nét đứt
                     opacity: 0.7
                 }).addTo(map);

                 fallbackLineRef.current = fallbackLine;
                 
                 // 2. Zoom map để thấy toàn bộ đường thẳng
                 map.fitBounds(fallbackLine.getBounds(), { padding: [50, 50] });

                 // 3. Tính khoảng cách chim bay (Haversine đơn giản) để hiện popup
                 const dist = map.distance(
                     [userLocation.lat, userLocation.lng], 
                     [destination.lat, destination.lng]
                 );
                 
                 const midLat = (userLocation.lat + destination.lat) / 2;
                 const midLng = (userLocation.lng + destination.lng) / 2;

                 L.popup()
                  .setLatLng([midLat, midLng])
                  .setContent(`<div style="text-align:center; color:#ef4444;"><b>${(dist/1000).toFixed(1)} km</b><br/>(Đường chim bay)</div>`)
                  .openOn(map);
             }
        });

        try {
          routingControl.addTo(map);
          routingControlRef.current = routingControl;
        } catch (e) {}
      } catch (e) {}
    } else {
      try {
        if (routingControlRef.current?.setWaypoints) {
          routingControlRef.current.setWaypoints(waypoints);
        }
      } catch (e) {}
    }

    // Cleanup
    return () => {
      // Xóa đường dự phòng khi unmount
      if (fallbackLineRef.current && map) {
          try { map.removeLayer(fallbackLineRef.current); } catch(e){}
      }
      
      if (routingControlRef.current) {
        try { routingControlRef.current.setWaypoints([]); } catch (e) {}
      }
    };
  }, [map, userLocation, destination]); 

  return null;
};

// --- 3. Component Chính ---
const RescueMap = ({
  userLocation,
  destination,
  onRouteFound,
}: RescueMapProps) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      iconFix();
      setReady(true);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Lỗi khởi tạo bản đồ");
      setReady(true);
    }
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-red-500 rounded-lg border border-red-700">
        <div className="text-center"><p className="text-sm">{error}</p></div>
      </div>
    );
  }

  if (
    !ready ||
    !userLocation ||
    typeof userLocation.lat !== "number" ||
    typeof userLocation.lng !== "number"
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 rounded-lg border border-slate-700">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-xs">Đang tải bản đồ...</span>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      key="unique-rescue-map-id" 
      center={[userLocation.lat, userLocation.lng]}
      zoom={14}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "0.5rem",
        zIndex: 0,
      }} 
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[userLocation.lat, userLocation.lng]}>
        <Popup>Vị trí hiện tại</Popup>
      </Marker>

      {destination && destination.lat && destination.lng && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>
            <div className="font-bold">{destination.name || "Trạm cứu hộ"}</div>
          </Popup>
        </Marker>
      )}

      <RoutingMachine
        userLocation={userLocation}
        destination={destination}
        onRouteFound={onRouteFound}
      />
    </MapContainer>
  );
};

export default RescueMap;