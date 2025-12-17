'use client'

import 'leaflet/dist/leaflet.css'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Plus, Minus, MapPin, Layers, ShieldAlert } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
// [FIX] Import thêm useMapEvents
import { useMap, useMapEvents } from 'react-leaflet'

// Dynamic imports
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as any
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false }) as any
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false }) as any
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false }) as any
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false }) as any
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false }) as any

// [FIX] Component MapController thông minh hơn
// Nó sẽ đồng bộ 2 chiều: Từ State -> Map (khi bấm nút) và Từ Map -> State (khi FlyTo/Lăn chuột)
function MapController({ zoom, center, onZoomChange }: { zoom: number, center: [number, number] | null, onZoomChange: (z: number) => void }) {
  const map = useMap()
  
  // 1. Khi bấm nút +/-, cập nhật Map
  useEffect(() => {
    if (map && map.getZoom() !== zoom) {
      map.setZoom(zoom)
    }
  }, [map, zoom])

  // 2. Khi chọn địa điểm, bay tới đó (FlyTo)
  useEffect(() => {
    if (map && center && center[0] !== 0) {
      map.flyTo(center, 10, { duration: 1.5 })
    }
  }, [map, center])

  // 3. [QUAN TRỌNG] Khi Map tự zoom (do FlyTo hoặc lăn chuột), cập nhật ngược lại State
  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom())
    }
  })
  
  return null
}

export default function MapFullscreenPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(6)
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<any | null>(null)

  useEffect(() => {
    import('leaflet').then((mod) => {
      const leaf = mod.default;
      delete (leaf.Icon.Default.prototype as any)._getIconUrl;
      leaf.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    });
  }, []);

  const getRiskColorHex = (severity: string) => {
    // 1. Chuyển về chữ thường và xóa khoảng trắng thừa
    const s = String(severity || '').toLowerCase().trim();
    
    // 2. Kiểm tra các từ khóa quan trọng (Keyword matching)
    
    // Mức AN TOÀN / KHÔNG CÓ RỦI RO -> Xanh lá
    if (s === 'no' || s === 'safe' || s.includes('safe') || s.includes('info') || s.includes('no risk')) {
        return '#16a34a'; // green-600
    }

    // Mức TRUNG BÌNH -> Cam
    if (s.includes('mid') || s.includes('medium') || s.includes('moderate') || s.includes('mid-high')) {
        return '#f97316'; // orange-500
    }
    // Mức CAO / NGUY HIỂM -> Đỏ (Check trước để ưu tiên)
    if (s.includes('high') || s.includes('danger') || s.includes('critical') || s.includes('severe')) {
        return '#dc2626'; // red-600
    }
    
    // Mức THẤP -> Vàng
    if (s.includes('low') || s.includes('caution') || s.includes('minor')) {
        return '#eab308'; // yellow-500
    }
        
    // [DEBUG] Nếu vẫn không khớp, in ra console để kiểm tra xem backend trả về cái gì
    console.warn(`Unknown severity level: "${severity}" -> Defaulting to Gray`);
    return '#6b7280'; // gray-500 (Mặc định)
  };
  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
          const response = await fetch('https://travel-safety-backend.onrender.com/api/v1/map/zones')
        const data = await response.json()

        if (data && data.features) {
          const formattedZones = data.features.map((feature: any) => {
            const props = feature.properties
            const geometry = feature.geometry
            
            let polygonCoords: any[] = []
            let center: [number, number] = [0, 0]

            if (geometry.type === 'Polygon') {
               polygonCoords = geometry.coordinates[0].map((p: any) => [p[1], p[0]])
               if (props.center) center = props.center
               else center = [polygonCoords[0][0], polygonCoords[0][1]]
            } 
            else if (geometry.type === 'Point') {
               center = [geometry.coordinates[1], geometry.coordinates[0]]
            }

            return {
              id: props.id,
              name: props.name,
              description: props.description,
              risk_type: props.risk_type,
              severity: props.risk_level, 
              color: getRiskColorHex(props.risk_level),
              radius: props.radius,
              time: props.time,
              center: center,
              path: polygonCoords
            }
          })
          setZones(formattedZones)
        }
      } catch (error) {
        console.error("Failed to fetch map data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRiskZones()
  }, [])

  const getBadgeColor = (severity: string) => {
    if (!severity) return 'bg-gray-500 text-white';
    const s = String(severity).toLowerCase();
    
    if (s === 'no' || s.includes('safe') || s.includes('info')) 
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    if (s.includes('low') || s.includes('caution')) 
        return 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500';
    if (s.includes('mid') || s.includes('medium')) 
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
    if (s.includes('high') || s.includes('danger')) 
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
        
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="w-screen h-screen relative text-white overflow-hidden bg-slate-950">
      <div className="w-full h-full">
        <MapContainer 
            center={[16.047, 108.206]} 
            zoom={6} 
            className="w-full h-full"
            zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {/* [FIX] Truyền thêm hàm onZoomChange để đồng bộ state */}
          <MapController 
            zoom={zoom} 
            center={selectedZone ? selectedZone.center : null} 
            onZoomChange={(newZoom) => setZoom(newZoom)}
          />
          
          {selectedZone && selectedZone.center && (
            <CircleMarker 
              center={selectedZone.center} 
              radius={8}
              pathOptions={{ 
                color: 'white',
                fillColor: '#3b82f6',
                fillOpacity: 1,
                weight: 3
              }} 
            >
               <Popup offset={[0, -5]}>
                  <span className="font-bold text-black">{selectedZone.name}</span>
               </Popup>
            </CircleMarker>
          )}

          {zones.map((zone, index) => {
             const uniqueKey = zone.id || index;
             const commonProps = {
                pathOptions: { 
                  color: zone.color,       
                  fillColor: zone.color,   
                  fillOpacity: 0.2,
                  weight: 1
                },
                eventHandlers: { click: () => setSelectedZone(zone) }
             };

             const popupContent = (
                <Popup>
                  <div className="text-black">
                    <strong className="text-sm">{zone.name}</strong><br/>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getBadgeColor(zone.severity).split(' ')[0]} text-white`}>
                      {zone.severity} Risk
                    </span>
                    <p className="text-xs mt-1">{zone.risk_type}</p>
                    <p className="text-[10px] text-gray-500">{zone.time}</p>
                  </div>
                </Popup>
             );

             if (zone.path && zone.path.length > 0) {
                return <Polygon key={uniqueKey} positions={zone.path} {...commonProps}>{popupContent}</Polygon>;
             } else {
                return <Circle key={uniqueKey} center={zone.center} radius={zone.radius || 5000} {...commonProps}>{popupContent}</Circle>;
             }
          })}
        </MapContainer>
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 flex items-center gap-3 flex-1 max-w-md shadow-lg">
            <Search className="h-4 w-4 text-white/60 flex-shrink-0" />
            <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 text-sm"
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-white/10 rounded-full">
                    <X className="h-4 w-4 text-white/70" />
                </button>
            )}
            </div>
            
            <button
                onClick={() => router.back()}
                className="p-3 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-2xl border border-white/10 text-white transition-colors shadow-lg ml-auto"
            >
                <X className="h-6 w-6" />
            </button>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] space-y-2 flex flex-col">
        <Button
          size="icon"
          className="bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-xl shadow-lg w-10 h-10"
          onClick={() => setZoom(Math.min(zoom + 1, 18))}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-xl shadow-lg w-10 h-10"
          onClick={() => setZoom(Math.max(zoom - 1, 2))}
        >
          <Minus className="h-5 w-5" />
        </Button>
      </div>

      <div className="absolute bottom-8 left-4 z-[1000] bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 text-white shadow-lg">
        <h3 className="text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3 h-3" /> Risk Levels
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 border border-red-400" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-400" />
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-400" />
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600 border border-green-400" />
            <span>Safe / Info</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-4 z-[1000] w-72 max-h-[40vh] flex flex-col">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 text-white shadow-lg flex flex-col max-h-[60vh]">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 flex-shrink-0">
            <MapPin className="h-4 w-4 text-blue-400" />
            Active Zones ({zones.length})
            </h3>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-2 min-h-0">
            {loading ? (
                <p className="text-xs text-white/50 text-center py-4">Loading data...</p>
            ) : zones.length === 0 ? (
                <p className="text-xs text-white/50 text-center py-4">No risks found.</p>
            ) : (
                zones
                .filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => {
                    const riskOrder: any = { 'High': 4, 'Medium': 3, 'Low': 2, 'Info': 1, 'Safe': 1, 'No': 1 };
                    return (riskOrder[b.severity] || 0) - (riskOrder[a.severity] || 0);
                })
                .map((zone) => (
                <div 
                    key={zone.id} 
                    className={`bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/20 ${selectedZone?.id === zone.id ? 'bg-blue-600/20 border-blue-500/50' : ''}`}
                    onClick={() => setSelectedZone(zone)}
                >
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold truncate flex-1 mr-2">{zone.name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getBadgeColor(zone.severity)} border-0`}>
                            {zone.severity}
                        </Badge>
                    </div>
                    <p className="text-xs text-white/60 truncate">{zone.risk_type}</p>
                </div>
                ))
            )}
            </div>
        </div>
      </div>
    </div>
  )
}