'use client'

import { Card } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { Bell, AlertTriangle, Info, AlertCircle, ArrowLeft, MapPin, Clock, Wind, CloudRain, Zap, CheckCheck, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AppHeader } from '@/components/app-header'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import LocationService from '@/services/LocationService'
import { Button } from '@/components/ui/button'

interface AlertData {
  id: string
  title: string
  description: string
  severity: string
  category: string
  location: {
    province: string
    coordinates: number[]
  }
  issued_at: string
  source: string
  distance_km?: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const userLocation = useStore((state) => state.userLocation)
  const setUserLocation = useStore((state) => state.setUserLocation)

  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)
  const [clearedAlerts, setClearedAlerts] = useState<string[]>([])
  const checkSeverityLevel = (alertSeverity: string, minSettings: string) => {
      const levels = ['low', 'medium', 'high', 'critical'];
      const alertLevel = levels.indexOf(alertSeverity.toLowerCase());
      const settingLevel = levels.indexOf(minSettings.toLowerCase());
      return alertLevel >= settingLevel;
  };

  useEffect(() => {
    if (!userLocation) {
      LocationService.getCurrentLocation()
        .then(loc => setUserLocation(loc))
        .catch(err => console.error('Location error:', err))
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('cleared_notifications');
    if (stored) {
        try { setClearedAlerts(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const radius = localStorage.getItem('user_radius_km') || '50';
        const minSeverity = localStorage.getItem('user_min_severity') || 'low';
        let allAlerts: AlertData[] = [];

        // Helper: Tính điểm độ nguy hiểm
        const getSeverityScore = (severity: string) => {
            const map: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'safe': 0 };
            return map[String(severity).toLowerCase()] || 0;
        };

        // 1. Lấy tin Nearby (Gần bạn) - Giữ nguyên logic cũ
        if (userLocation) {
            try {
                const nearRes = await fetch(`https://travel-safety-backend.onrender.com/api/v1/alerts/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`);
                const nearData = await nearRes.json();
                if (nearData.success && Array.isArray(nearData.data)) {
                    allAlerts = [...nearData.data.map((item: any) => ({ ...item, isNearby: true, severity: item.severity.toLowerCase() }))];
                }
            } catch (e) {}
        }

        // 2. Lấy tin National (Trong nước) - Logic MỚI
        try {
            // [FIX] Tăng limit lên 50 để có đủ dữ liệu mà lọc
            const natRes = await fetch('https://travel-safety-backend.onrender.com/api/v1/alerts/national?limit=50');
            const natData = await natRes.json();
            
            if (natData.success && Array.isArray(natData.data)) {
                const existingIds = new Set(allAlerts.map(a => a.id));
                
                // Lọc trùng & Map dữ liệu
                let natItems = natData.data
                    .filter((item: any) => !existingIds.has(item.id))
                    .map((item: any) => ({ ...item, isNearby: false, severity: item.severity.toLowerCase() }));

                // [FIX] Sắp xếp theo độ nguy hiểm (Cao -> Thấp)
                natItems.sort((a: any, b: any) => getSeverityScore(b.severity) - getSeverityScore(a.severity));

                // [FIX] Chỉ lấy đúng 2 tin nguy hiểm nhất
                natItems = natItems.slice(0, 2);

                // Gộp vào danh sách chung
                allAlerts = [...allAlerts, ...natItems];
            }
        } catch (e) {}

        // 3. Bộ lọc cuối cùng (check minSeverity & cleared) - Giữ nguyên
        const validAlerts = allAlerts.filter(a => {
            if (clearedAlerts.includes(a.id)) return false;

            if (!checkSeverityLevel(a.severity, minSeverity)) {
                return false; 
            }

            if ((a as any).isNearby) return true;
            return true; 
        });

        // Sắp xếp hiển thị cuối cùng (Nearby lên đầu, sau đó đến độ nguy hiểm)
        validAlerts.sort((a, b) => {
            if ((a as any).isNearby && !(b as any).isNearby) return -1;
            if (!(a as any).isNearby && (b as any).isNearby) return 1;
            return getSeverityScore(b.severity) - getSeverityScore(a.severity);
        });
          
        setAlerts(validAlerts)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [userLocation, clearedAlerts])

  // [LOGIC MỚI] Hàm lưu thông báo vào lịch sử
  const saveToHistory = (itemsToSave: AlertData[]) => {
      try {
          const currentHistory = JSON.parse(localStorage.getItem('alert_history_storage') || '[]');
          
          // Gộp danh sách mới và cũ
          const merged = [...itemsToSave, ...currentHistory];
          
          // Loại bỏ trùng lặp (theo ID)
          const uniqueHistory = Array.from(new Map(merged.map(item => [item.id, item])).values());
          
          // Lưu lại
          localStorage.setItem('alert_history_storage', JSON.stringify(uniqueHistory));
      } catch (e) {
          console.error("Lỗi lưu lịch sử:", e);
      }
  }

  const handleClearOne = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      
      // 1. Lưu vào lịch sử trước khi xóa
      const alertToDelete = alerts.find(a => a.id === id);
      if (alertToDelete) {
          saveToHistory([alertToDelete]);
      }

      // 2. Ẩn khỏi màn hình hiện tại
      const newList = [...clearedAlerts, id];
      setClearedAlerts(newList);
      localStorage.setItem('cleared_notifications', JSON.stringify(newList));
  }

  const handleClearAll = () => {
      if (alerts.length === 0) return;
      const confirm = window.confirm("Xóa tất cả thông báo? (Chúng sẽ được chuyển vào Lịch sử)");
      if (!confirm) return;

      // 1. Lưu TẤT CẢ vào lịch sử
      saveToHistory(alerts);

      // 2. Ẩn hết
      const newIds = alerts.map(a => a.id);
      const combinedList = [...clearedAlerts, ...newIds];
      const uniqueList = Array.from(new Set(combinedList));
      setClearedAlerts(uniqueList);
      localStorage.setItem('cleared_notifications', JSON.stringify(uniqueList));
  }

  const getAlertIcon = (alert: AlertData) => { /* Giữ nguyên code cũ */
    const title = alert.title.toLowerCase();
    if (title.includes('safe') || title.includes('an toàn')) return <Info className="h-5 w-5" />;
    if (title.includes('wind') || title.includes('gió')) return <Wind className="h-5 w-5" />;
    if (title.includes('rain') || title.includes('mưa')) return <CloudRain className="h-5 w-5" />;
    if (title.includes('storm') || title.includes('bão')) return <Zap className="h-5 w-5" />;
    switch (alert.severity) {
      case 'high': return <AlertTriangle className="h-5 w-5" />
      case 'medium': return <AlertCircle className="h-5 w-5" />
      default: return <Info className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => { /* Giữ nguyên code cũ */
    switch (severity) {
      case 'high': case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'low': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'safe': case 'no': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    }
  }

  const formatTime = (dateString: string) => { /* Giữ nguyên code cũ */
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = (now.getTime() - date.getTime()) / 1000 / 60 
      if (diff < 1) return 'Vừa xong'
      if (diff < 60) return `${Math.floor(diff)} phút trước`
      if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
      return date.toLocaleDateString('vi-VN')
    } catch { return '' }
  }

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/85' : 'bg-black/40'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-sans">Thông báo</h1>
            </div>
            
            {alerts.length > 0 && (
                <Button 
                    variant="ghost" size="sm" className="text-white/70 hover:text-red-400 hover:bg-white/5"
                    onClick={handleClearAll}
                >
                    <CheckCheck className="w-4 h-4 mr-2" /> Đánh dấu đã đọc
                </Button>
            )}
          </div>

          {loading && (
            <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"/><p className="text-white/60">Đang cập nhật...</p></div>
          )}

          {!loading && alerts.length === 0 && (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Bell className="h-8 w-8 text-white/40" /></div>
              <h3 className="text-xl font-medium mb-2">Không có thông báo mới</h3>
              <p className="text-white/60 max-w-xs mb-4">Bạn đã xem hết các thông báo quan trọng.</p>
              <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10" onClick={() => router.push('/history')}>Xem lại lịch sử</Button>
            </Card>
          )}

          {!loading && alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Card key={`${alert.id}-${index}`} className={`bg-black/60 backdrop-blur-md border border-white/10 p-4 cursor-pointer hover:bg-black/80 transition-all active:scale-[0.99] group relative pr-10`} onClick={() => router.push(`/alerts/${alert.id}`)}>
                  <button onClick={(e) => handleClearOne(e, alert.id)} className="absolute top-3 right-3 p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors z-10" title="Xóa thông báo này"><X className="w-4 h-4" /></button>
                  <div className="flex gap-4">
                    <div className={cn('flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 border', getSeverityColor(alert.severity))}>{getAlertIcon(alert)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 mr-6"><h3 className="font-semibold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-1">{alert.title}</h3></div>
                      <span className="text-xs text-white/50 whitespace-nowrap flex items-center gap-1 mb-2"><Clock className="w-3 h-3" />{formatTime(alert.issued_at)}</span>
                      <p className="text-sm text-white/70 line-clamp-2 mb-3">{alert.description}</p>
                      <div className="flex items-center gap-3">
                        {(alert as any).isNearby ? (<span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border text-blue-400 bg-blue-500/10 border-blue-500/20">GẦN BẠN</span>) : (<span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border', getSeverityColor(alert.severity))}>{alert.severity}</span>)}
                        <div className="flex items-center gap-1 text-xs text-white/60"><MapPin className="w-3 h-3" /><span>{alert.location.province}</span>{alert.distance_km && <span className="text-white/40">({alert.distance_km} km)</span>}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}