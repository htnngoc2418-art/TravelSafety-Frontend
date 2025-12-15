'use client'

import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { Search, ArrowLeft, Layers, ShieldAlert, Maximize2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useMap } from 'react-leaflet'

// Dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any
const Polygon      = dynamic(() => import("react-leaflet").then(m => m.Polygon), { ssr: false }) as any
const Circle       = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false }) as any
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false }) as any 
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false }) as any

const FlyToZone = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.flyTo(center, 10, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

export default function MapPage() {
  const router = useRouter()
  const isDarkMode = useStore((state) => state.isDarkMode)
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  
  const [searchQuery, setSearchQuery] = useState('')
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

  // [FIX] Hàm lấy màu chuẩn - Cải thiện khả năng bắt chuỗi
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

  const getBadgeColor = (severity: string) => {
    if (!severity) return 'bg-gray-500 text-white';
    const s = String(severity).toLowerCase();
    
    if (s === 'no' || s.includes('safe') || s.includes('info')) 
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    if (s.includes('low') || s.includes('caution')) 
        return 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500';
    if (s.includes('mid') || s.includes('medium') || s.includes('mid-high')) 
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
    if (s.includes('high') || s.includes('danger')) 
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
        
    return 'bg-gray-500 text-white';
  };

  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
          const response = await fetch('https://travel-safety-backend.onrender.com/api/v1/map/zones'); 
        const data = await response.json();
        
        if (data && data.features) {
          const formattedZones = data.features.map((feature: any) => {
            const props = feature.properties;
            const geometry = feature.geometry;
            
            let polygonCoords: any[] = [];
            let center: [number, number] = [0, 0];

            if (geometry.type === 'Polygon') {
               polygonCoords = geometry.coordinates[0].map((p: any) => [p[1], p[0]]);
               if (props.center) center = props.center;
               else center = [polygonCoords[0][0], polygonCoords[0][1]];
            } else if (geometry.type === 'Point') {
               center = [geometry.coordinates[1], geometry.coordinates[0]];
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
            };
          });
          setZones(formattedZones);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchRiskZones();
  }, []);


  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="BG" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft className="h-6 w-6" /></button>
            <h1 className="text-3xl font-sans flex-1">{t.riskMap}</h1>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchLocation} className="pl-9 bg-white/10 border-white/20 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
            <div className="lg:col-span-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 relative min-h-[500px] overflow-hidden">
              
              <Button size="sm" className="absolute top-4 right-4 bg-white text-black hover:bg-gray-200 z-[5000] flex items-center gap-2 shadow-lg" onClick={() => router.push('/map-fullscreen')}>
                <Maximize2 className="h-4 w-4" /> Expand
              </Button>

              <MapContainer center={[16.047, 108.206]} zoom={6} className="w-full h-full" scrollWheelZoom={true}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                <FlyToZone center={selectedZone ? selectedZone.center : null} />

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
                   // [FIX] Tách 'key' ra khỏi commonProps
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
                      // [FIX] Truyền key trực tiếp
                      return <Polygon key={uniqueKey} positions={zone.path} {...commonProps}>{popupContent}</Polygon>;
                   } else {
                      return <Circle key={uniqueKey} center={zone.center} radius={zone.radius || 5000} {...commonProps}>{popupContent}</Circle>;
                   }
                })}
              </MapContainer>
              
              <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded-lg text-black text-xs z-[1000] shadow-lg">
                <div className="font-bold mb-1 flex items-center gap-1"><Layers className="w-3 h-3"/> {t.legend}</div>
                <div className="flex items-center gap-1 mb-1"><div className="w-3 h-3 bg-red-600 rounded-full border border-red-600"></div> {t.high}</div>
                <div className="flex items-center gap-1 mb-1"><div className="w-3 h-3 bg-orange-500 rounded-full border border-orange-500"></div> {t.moderate}</div>
                <div className="flex items-center gap-1 mb-1"><div className="w-3 h-3 bg-yellow-500 rounded-full border border-yellow-500"></div> {t.low}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 rounded-full border border-green-600"></div> {t.safe}</div>
              </div>
            </div>

            <div className="space-y-4 flex flex-col h-full">
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4 text-white flex-shrink-0">
                <h3 className="text-sm font-semibold mb-2">Live Updates</h3>
                <p className="text-xs text-slate-400">Sorted by Risk</p>
              </Card>

              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[500px]">
                {loading ? <p className="text-center text-white/50 text-sm">{t.loading}</p> : 
                  zones
                  .filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => {
                    const riskOrder: any = { 'High': 4, 'Medium': 3, 'Low': 2, 'Info': 1, 'Safe': 1, 'No': 1};
                    return (riskOrder[b.severity] || 0) - (riskOrder[a.severity] || 0);
                  })
                  .map((zone, index) => (
                    <Card
                      key={index}
                      onClick={() => setSelectedZone(zone)}
                      className={`bg-black/40 backdrop-blur-md border-white/10 p-3 text-white hover:bg-white/5 transition-all cursor-pointer ${selectedZone?.id === zone.id ? 'ring-1 ring-blue-400 bg-blue-900/20' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                             getBadgeColor(zone.severity).replace('text-white', '').replace('text-black', '').replace('hover:', 'text-')
                          }`}>
                             <ShieldAlert className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{zone.name}</h4>
                            <p className="text-xs text-white/70 truncate">{zone.risk_type}</p>
                          </div>
                        </div>
                        <Badge className={`${getBadgeColor(zone.severity)} border-0`}>
                          {zone.severity}
                        </Badge>
                      </div>
                    </Card>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}