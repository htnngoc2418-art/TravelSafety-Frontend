import Papa from "papaparse";

// Hàm tính khoảng cách Haversine (km)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  let dLat = (lat2 - lat1) * Math.PI / 180;
  let dLon = (lon2 - lon1) * Math.PI / 180;
  let a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Hàm tìm điểm gần nhất
export async function getNearestLocation(userLat: number, userLon: number) {
  const res = await fetch("/data/app_data.csv");
  const text = await res.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });

  let best = null;
  let bestDist = Infinity;

  for (const row of parsed.data as any[]) {
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    const dist = haversine(userLat, userLon, lat, lon);

    if (dist < bestDist) {
      bestDist = dist;
      best = row;
    }
  }

  return best; // {province, area, lat, lon}
}
