# 🗺️ THÊM ENDPOINT MAP ZONES VÀO BACKEND

## 📝 Thêm vào file `Test.py` (hoặc file main backend):

```python
from fastapi import APIRouter
from typing import List, Dict, Any
import csv
import os

# Tạo router cho map
map_router = APIRouter(prefix="/api/v1/map", tags=["map"])

@map_router.get("/zones")
async def get_risk_zones() -> List[Dict[str, Any]]:
    """
    Trả về danh sách các vùng rủi ro để vẽ trên bản đồ
    """
    zones = []
    
    try:
        # Đọc từ file CSV hoặc database
        csv_file = "data/app_data.csv"  # Điều chỉnh đường dẫn cho đúng
        
        if not os.path.exists(csv_file):
            # Nếu không có file, trả về mock data
            return [
                {
                    "id": "hanoi_flood",
                    "center": [21.0285, 105.8542],
                    "path": [],  # Để trống nếu là circle
                    "risk_level": "Medium",
                    "info": {
                        "type": "Flood Risk",
                        "description": "Heavy rain expected"
                    }
                },
                {
                    "id": "haiphong_storm",
                    "center": [20.8449, 106.6881],
                    "path": [],
                    "risk_level": "High",
                    "info": {
                        "type": "Storm Warning",
                        "description": "Tropical storm approaching"
                    }
                }
            ]
        
        # Đọc từ CSV
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    lat = float(row.get('lat', row.get('latitude', 0)))
                    lon = float(row.get('lon', row.get('longitude', 0)))
                    
                    zone = {
                        "id": row.get('location_name', f"zone_{len(zones)}"),
                        "center": [lat, lon],
                        "path": [],  # Có thể thêm logic vẽ polygon nếu cần
                        "risk_level": row.get('severity', 'Medium').capitalize(),
                        "info": {
                            "type": row.get('type', row.get('disaster_type', 'Unknown')),
                            "description": row.get('description', 'No description')
                        }
                    }
                    zones.append(zone)
                except (ValueError, KeyError) as e:
                    continue
        
        return zones
        
    except Exception as e:
        print(f"Error loading zones: {e}")
        # Trả về mock data nếu có lỗi
        return [
            {
                "id": "default_zone",
                "center": [21.0285, 105.8542],
                "path": [],
                "risk_level": "Medium",
                "info": {
                    "type": "Test Zone",
                    "description": "Default test zone"
                }
            }
        ]

# Đăng ký router vào app
# Thêm dòng này vào phần khởi tạo FastAPI app:
# app.include_router(map_router)
```

---

## 🔧 CẬP NHẬT FILE `Test.py`:

Tìm dòng khởi tạo app và thêm router:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== THÊM DÒNG NÀY =====
app.include_router(map_router)
# =========================

# ... các routes khác ...
```

---

## ✅ HOẶC NẾU MUỐN ĐƠN GIẢN HƠN:

Thêm trực tiếp vào `Test.py`:

```python
@app.get("/api/v1/map/zones")
async def get_map_zones():
    """Endpoint đơn giản trả về mock data"""
    return [
        {
            "id": "hanoi_rain",
            "center": [21.0285, 105.8542],
            "path": [],
            "risk_level": "Medium",
            "info": {"type": "Heavy Rain", "description": "Expected in 2 hours"}
        },
        {
            "id": "danang_wind",
            "center": [16.0544, 108.2022],
            "path": [],
            "risk_level": "Low",
            "info": {"type": "Strong Wind", "description": "Wind speed 40km/h"}
        },
        {
            "id": "hcm_safe",
            "center": [10.8231, 106.6297],
            "path": [],
            "risk_level": "Safe",
            "info": {"type": "Clear Weather", "description": "No threats detected"}
        }
    ]
```

---

## 🚀 TEST:

1. **Restart backend:**
   ```bash
   python Test.py
   ```

2. **Test endpoint:**
   ```bash
   curl http://localhost:8000/api/v1/map/zones
   ```

3. **Reload frontend** và xem Console (F12)

---

## 📊 FORMAT DỮ LIỆU BACKEND PHẢI TRẢ VỀ:

```json
[
  {
    "id": "location_name",
    "center": [21.0285, 105.8542],  // [lat, lon]
    "path": [],  // Để trống nếu là circle, hoặc [[lat1,lon1], [lat2,lon2],...] nếu là polygon
    "risk_level": "High",  // High, Medium, Low, Safe
    "info": {
      "type": "Storm",
      "description": "Tropical storm approaching"
    }
  }
]
```
