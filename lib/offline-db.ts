// frontend/lib/offline-db.ts
import axios from 'axios'
import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "safe-travel-offline";
const DB_VERSION = 3; // Incremented version to add new store

interface OfflineDBSchema {
  routes: {
    id: string;
    userLat: number;
    userLng: number;
    destLat: number;
    destLng: number;
    destName: string;
    destPhone: string;
    destAddress: string;
    routeCoordinates: Array<[number, number]>;
    distance: number;
    duration: number;
    timestamp: number;
  };
  tiles: {
    url: string;
    imageData: Blob;
    timestamp: number;
  };
  emergencyContacts: {
    id: string;
    name: string;
    phone: string;
    email: string;
    relation_type: string;
    savedAt: number;
  };
  sosLogs: {
    id: string;
    latitude: number;
    longitude: number;
    rescueStation: string;
    medicalNotes: string;
    timestamp: number;
    status: "pending" | "synced";
  };
  rescueStations: {
    id: string;
    Name: string;
    Type: string;
    Phone: string;
    Lat: number;
    Lon: number;
    Address: string;
    timestamp: number;
  };
  generalData: {
    id: string;
    data: any;
    timestamp: number;
  };
}

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export const initDB = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Routes store - lưu lộ trình tìm kiếm
      if (!db.objectStoreNames.contains("routes")) {
        db.createObjectStore("routes", { keyPath: "id" });
      }

      // Tiles store - lưu hình ảnh bản đồ
      if (!db.objectStoreNames.contains("tiles")) {
        db.createObjectStore("tiles", { keyPath: "url" });
      }

      // Emergency contacts
      if (!db.objectStoreNames.contains("emergencyContacts")) {
        db.createObjectStore("emergencyContacts", { keyPath: "id" });
      }

      // SOS logs - lưu yêu cầu SOS chưa gửi
      if (!db.objectStoreNames.contains("sosLogs")) {
        db.createObjectStore("sosLogs", { keyPath: "id" });
      }

      // Rescue stations - lưu danh sách các nơi cứu hộ cho offline mode
      if (!db.objectStoreNames.contains("rescueStations")) {
        db.createObjectStore("rescueStations", { keyPath: "id" });
      }

      // General data
      if (!db.objectStoreNames.contains("generalData")) {
        db.createObjectStore("generalData", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
};

// === ROUTE OPERATIONS ===
export const saveRoute = async (
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number,
  destName: string,
  destPhone: string,
  destAddress: string,
  routeCoordinates: Array<[number, number]>,
  distance: number,
  duration: number
) => {
  const db = await initDB();
  const routeId = `route-${Date.now()}`;

  await db.put("routes", {
    id: routeId,
    userLat,
    userLng,
    destLat,
    destLng,
    destName,
    destPhone,
    destAddress,
    routeCoordinates,
    distance,
    duration,
    timestamp: Date.now(),
  });

  return routeId;
};

export const getAllSavedRoutes = async () => {
  const db = await initDB();
  return await db.getAll("routes");
};

export const getLastRoute = async () => {
  const db = await initDB();
  const routes = await db.getAll("routes");
  if (routes.length === 0) return null;
  return routes[routes.length - 1];
};

export const deleteRoute = async (routeId: string) => {
  const db = await initDB();
  await db.delete("routes", routeId);
};

// === UTILITY: Haversine Distance ===
/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 * @returns Khoảng cách tính bằng km
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// === ROUTE OPERATIONS: Multi-Route Caching ===
/**
 * Lưu nhiều routes cùng một lúc và tự động clear routes cũ nếu vượt 20
 */
export const saveMultipleRoutes = async (
  routesToSave: Array<{
    userLat: number;
    userLng: number;
    destLat: number;
    destLng: number;
    destName: string;
    destPhone: string;
    destAddress: string;
    routeCoordinates: Array<[number, number]>;
    distance: number;
    duration: number;
  }>
) => {
  const db = await initDB();

  // Lưu từng route
  for (const route of routesToSave) {
    const routeId = `route-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await db.put("routes", {
      id: routeId,
      ...route,
      timestamp: Date.now(),
    });
  }

  // Auto cleanup: Giữ chỉ 20 routes gần nhất
  await keepTopRoutes(20);

  console.log(
    `✅ Saved ${routesToSave.length} routes, total:`,
    await getOfflineStats().then((s) => s.routes)
  );
};

/**
 * Tìm routes gần nhất với vị trí hiện tại
 * @param userLat - Latitude hiện tại
 * @param userLng - Longitude hiện tại
 * @param maxResults - Số routes trả về (mặc định 20)
 * @param maxDistanceKm - Khoảng cách tối đa (mặc định 50km)
 */
export const getNearestRoutes = async (
  userLat: number,
  userLng: number,
  maxResults: number = 20,
  maxDistanceKm: number = 50
) => {
  const db = await initDB();
  const allRoutes = await db.getAll("routes");

  if (!allRoutes || allRoutes.length === 0) {
    return [];
  }

  // Tính khoảng cách từ user location đến destination của mỗi route
  const routesWithDistance = allRoutes.map((route) => ({
    ...route,
    distanceFromUser: calculateDistance(
      userLat,
      userLng,
      route.destLat,
      route.destLng
    ),
  }));

  // Filter routes trong vùng
  const nearbyRoutes = routesWithDistance.filter(
    (r) => r.distanceFromUser <= maxDistanceKm
  );

  // Sort by distance (gần nhất trước)
  return nearbyRoutes
    .sort((a, b) => a.distanceFromUser - b.distanceFromUser)
    .slice(0, maxResults);
};

/**
 * Tìm route trùng khớp gần nhất (trong 5km)
 * Fallback: Nếu không có chính xác, lấy route gần nhất
 */
export const findBestMatchingRoute = async (
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number,
  toleranceKm: number = 5
) => {
  const db = await initDB();
  const allRoutes = await db.getAll("routes");

  if (!allRoutes || allRoutes.length === 0) {
    return null;
  }

  // Tính khoảng cách từ dest hiện tại đến dest của mỗi route
  const routesWithDistance = allRoutes.map((route) => ({
    ...route,
    destDistance: calculateDistance(
      destLat,
      destLng,
      route.destLat,
      route.destLng
    ),
  }));

  // Priority 1: Route với destination gần nhất (< 5km)
  const exactMatch = routesWithDistance.find(
    (r) => r.destDistance < toleranceKm
  );

  if (exactMatch) {
    console.log(
      `✅ Found exact route match (${exactMatch.destDistance.toFixed(
        2
      )}km away)`
    );
    return exactMatch;
  }

  // Priority 2: Route gần nhất overall
  const sortedByDest = routesWithDistance.sort(
    (a, b) => a.destDistance - b.destDistance
  );

  if (sortedByDest.length > 0) {
    console.log(
      `⚠️ Using nearest route (${sortedByDest[0].destDistance.toFixed(
        2
      )}km away)`
    );
    return sortedByDest[0];
  }

  return null;
};

/**
 * Giữ chỉ top N routes (oldest routes sẽ bị xóa)
 */
export const keepTopRoutes = async (maxRoutes: number = 20) => {
  const db = await initDB();
  const allRoutes = await db.getAll("routes");

  if (allRoutes.length <= maxRoutes) {
    return;
  }

  // Sort by timestamp (cũ nhất trước)
  const sortedByTime = allRoutes.sort((a, b) => a.timestamp - b.timestamp);

  // Xóa các routes cũ nhất
  const routesToDelete = sortedByTime.slice(0, allRoutes.length - maxRoutes);

  for (const route of routesToDelete) {
    await db.delete("routes", route.id);
  }

  console.log(`🧹 Cleaned up ${routesToDelete.length} old routes`);
};

/**
 * Clear routes offline cache
 */
export const clearRouteCache = async () => {
  const db = await initDB();
  await db.clear("routes");
  console.log("✅ Route cache cleared");
};

// === TILE OPERATIONS (Map Caching) ===
export const saveTile = async (url: string, imageData: Blob) => {
  const db = await initDB();
  await db.put("tiles", {
    url,
    imageData,
    timestamp: Date.now(),
  });
};

export const getCachedTile = async (url: string) => {
  const db = await initDB();
  return await db.get("tiles", url);
};

// === EMERGENCY CONTACTS ===
const API_BASE_URL = "https://your-backend-name.onrender.com/api/v1/profile";

// 1. SỬA LẠI HÀM LƯU LIÊN HỆ KHẨN CẤP
export const saveEmergencyContacts = async (token: string, contacts: any[]) => {
    try {
        // Lặp qua danh sách và gửi từng cái lên Server
        for (const contact of contacts) {
            const response = await fetch(`${API_BASE_URL}/contacts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // <--- QUAN TRỌNG: Gửi Token để Server biết ai đang lưu
                },
                body: JSON.stringify({
                    // Tên biến khớp với Backend Pydantic Model
                    name: contact.name,
                    phone: contact.phone,
                    relation_type: contact.relation_type || "Người thân",
                    email: contact.email || ""
                })
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                console.error(`❌ Lỗi lưu liên hệ ${contact.name}:`, errorDetail);
                // Có thể throw lỗi ở đây nếu muốn dừng ngay lập tức
            }
        }
        console.log("✅ Đã lưu tất cả liên hệ lên Server thành công!");
    } catch (error) {
        console.error("❌ Lỗi kết nối Server:", error);
        throw error;
    }
};

// 2. SỬA LẠI HÀM LẤY LIÊN HỆ (Cần truyền thêm token)
export const getEmergencyContacts = async (token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // <--- QUAN TRỌNG
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch contacts");
        }

        // Trả về dữ liệu từ Server
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ Không lấy được dữ liệu từ Server:", error);
        return []; // Trả về mảng rỗng để không bị crash app
    }
};// 3. SỬA LẠI HÀM SOS LOGS (Gửi lên Server)
export const saveSosLog = async (
    latitude: number,
    longitude: number,
    rescueStation: string,
    medicalNotes: string
) => {
    try {
        const response = await axios.post("https://your-backend-name.onrender.com/api/v1/sos/send", {
            latitude,
            longitude,
            rescue_station: rescueStation, // Chú ý gạch dưới theo chuẩn Python
            medical_notes: medicalNotes
        }, {
            withCredentials: true
        });
        return response.data.id;
    } catch (error) {
        console.error("❌ Lỗi gửi SOS:", error);
    }
};
export const getPendingSosLogs = async () => {
  const db = await initDB();
  const logs = await db.getAll("sosLogs");
  return logs.filter((log) => log.status === "pending");
};

export const markSosSynced = async (sosId: string) => {
  const db = await initDB();
  const log = await db.get("sosLogs", sosId);
  if (log) {
    log.status = "synced";
    await db.put("sosLogs", log);
  }
};

// === GENERAL DATA ===
export const saveOfflineData = async (key: string, data: any) => {
  const db = await initDB();
  await db.put("generalData", { id: key, data, timestamp: Date.now() });
};

export const getOfflineData = async (key: string) => {
  const db = await initDB();
  return await db.get("generalData", key);
};

// === STATS ===
export const getOfflineDataSize = async () => {
  const db = await initDB();

  const routes = await db.getAll("routes");
  const tiles = await db.getAll("tiles");
  const contacts = await db.getAll("emergencyContacts");
  const sosLogs = await db.getAll("sosLogs");

  let totalSize = 0;

  // Routes: ~1KB each
  totalSize += routes.length * 1;

  // Tiles: actual blob size
  totalSize += tiles.reduce(
    (sum, tile) => sum + tile.imageData.size / 1024 / 1024,
    0
  );

  // Contacts: ~0.5KB each
  totalSize += contacts.length * 0.5;

  // SOS logs: ~1KB each
  totalSize += sosLogs.length * 1;

  return Math.round(totalSize * 100) / 100; // MB
};

// === RESCUE STATIONS OPERATIONS ===
export const saveRescueStations = async (
  stations: Array<{
    Name: string;
    Type: string;
    Phone: string;
    Lat: number;
    Lon: number;
    Address: string;
  }>
) => {
  const db = await initDB();

  // Clear old data first
  await db.clear("rescueStations");

  // Save new stations
  const timestamp = Date.now();
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    await db.put("rescueStations", {
      id: `station-${i}`,
      ...station,
      timestamp,
    });
  }
};

export const getAllRescueStations = async () => {
  const db = await initDB();
  return await db.getAll("rescueStations");
};

export const getRescueStationsByType = async (type: string) => {
  const db = await initDB();
  const allStations = await db.getAll("rescueStations");
  return allStations.filter((station) => station.Type === type);
};

export const findNearestOfflineRescueStation = (
  stations: any[],
  userLat: number,
  userLng: number
): any | null => {
  if (!stations || stations.length === 0) return null;

  const haversine = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let nearest = stations[0];
  let minDistance = haversine(userLat, userLng, nearest.Lat, nearest.Lon);

  for (let i = 1; i < stations.length; i++) {
    const distance = haversine(
      userLat,
      userLng,
      stations[i].Lat,
      stations[i].Lon
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = stations[i];
    }
  }

  return nearest;
};

// === STORAGE OPTIMIZATION ===
/**
 * Clear old tiles to optimize storage (keep only last 7 days)
 */
export const cleanOldTiles = async () => {
  const db = await initDB();
  const allTiles = await db.getAll("tiles");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const tile of allTiles) {
    if (tile.timestamp < sevenDaysAgo) {
      await db.delete("tiles", tile.url);
    }
  }
};

/**
 * Clear old routes to optimize storage (keep only last 30)
 */
export const cleanOldRoutes = async () => {
  const db = await initDB();
  const allRoutes = await db.getAll("routes");

  if (allRoutes.length > 30) {
    // Sort by timestamp and delete oldest
    allRoutes.sort((a, b) => a.timestamp - b.timestamp);
    const toDelete = allRoutes.slice(0, allRoutes.length - 30);

    for (const route of toDelete) {
      await db.delete("routes", route.id);
    }
  }
};

/**
 * Clear all offline data completely
 */
export const clearAllOfflineData = async () => {
  const db = await initDB();

  const stores = [
    "routes",
    "tiles",
    "emergencyContacts",
    "sosLogs",
    "rescueStations",
    "generalData",
  ];

  for (const store of stores) {
    await db.clear(store);
  }

  console.log("✅ Offline database cleared");
};

/**
 * Get storage statistics
 */
export const getOfflineStats = async () => {
  const db = await initDB();

  const routes = await db.getAll("routes");
  const tiles = await db.getAll("tiles");
  const contacts = await db.getAll("emergencyContacts");
  const sosLogs = await db.getAll("sosLogs");
  const stations = await db.getAll("rescueStations");

  // Estimate storage usage (rough estimate)
  let estimatedSize = 0;
  estimatedSize += routes.length * 2048; // ~2KB per route
  estimatedSize += tiles.reduce((acc, t) => acc + (t.imageData?.size || 0), 0);
  estimatedSize += contacts.length * 256; // ~256B per contact
  estimatedSize += sosLogs.length * 512; // ~512B per log
  estimatedSize += stations.length * 256; // ~256B per station

  return {
    routes: routes.length,
    tiles: tiles.length,
    contacts: contacts.length,
    sosLogs: sosLogs.length,
    stations: stations.length,
    estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
  };
};

/**
 * Optimize storage by cleaning old data
 */
export const optimizeStorage = async () => {
  try {
    await cleanOldTiles();
    await cleanOldRoutes();
    console.log("✅ Storage optimized");
  } catch (error) {
    console.error("Error optimizing storage:", error);
  }
};
