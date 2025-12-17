'use client'

import { Card } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { History, Bell, ShieldAlert, ChevronLeft, MapPin } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import Image from 'next/image'

export default function HistoryPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const sosHistory = useStore((state) => state.sosHistory)
  const t = useTranslation(language)
  
  const [activeTab, setActiveTab] = useState<'alerts' | 'sos'>('alerts')
  const [alertHistory, setAlertHistory] = useState<any[]>([]) 
  const isDarkMode = useStore((state) => state.isDarkMode)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1. Lấy dữ liệu từ API (những tin còn sống)
        let apiAlerts = [];
        try {
            const res = await fetch('https://travel-safety-backend.onrender.com/api/v1/alerts/all?limit=50');
            const data = await res.json();
            if (data.success && data.data?.combined) {
                apiAlerts = data.data.combined;
            }
        } catch (e) { console.log("Lỗi API history, dùng local only"); }

        // 2. [QUAN TRỌNG] Lấy dữ liệu đã xóa từ LocalStorage
        let localAlerts = [];
        try {
            const stored = localStorage.getItem('alert_history_storage');
            if (stored) localAlerts = JSON.parse(stored);
        } catch (e) {}

        // 3. Gộp 2 nguồn lại (API + Local)
        const combined = [...apiAlerts, ...localAlerts];

        // 4. Loại bỏ trùng lặp (Ưu tiên local nếu có chỉnh sửa, hoặc đơn giản theo ID)
        const uniqueAlerts = Array.from(new Map(combined.map(item => [item.id, item])).values());

        // Map sang format hiển thị
        const formattedAlerts = uniqueAlerts.map((alert: any) => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity.toLowerCase(),
            timestamp: new Date(alert.issued_at),
            location: typeof alert.location === 'object' ? alert.location.province : alert.location
        }));
        
        // Sắp xếp mới nhất lên đầu
        formattedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setAlertHistory(formattedAlerts);

      } catch (error) {
        console.error("Lỗi tải lịch sử cảnh báo:", error);
      }
    };

    if (activeTab === 'alerts') {
        fetchHistory();
    }
  }, [activeTab]);
  
  const formatDate = (date: Date) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '' }
  }
  
  const formatTime = (date: Date) => {
    try { return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }
  
  const groupByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {}
    items.forEach(item => {
      const dateObj = new Date(item.timestamp);
      const dateKey = formatDate(dateObj);
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(item)
    })
    return groups
  }
  
  const alertGroups = groupByDate(alertHistory)
  const sosGroups = groupByDate(sosHistory)
  
  const getSeverityClass = (severity: string) => {
      switch(severity) {
          case 'critical': return 'bg-red-500/20 text-red-400';
          case 'high': return 'bg-red-500/20 text-red-400';
          case 'medium': return 'bg-orange-500/20 text-orange-400';
          case 'moderate': return 'bg-yellow-500/20 text-yellow-400';
          case 'low': return 'bg-green-500/20 text-green-400';
          default: return 'bg-blue-500/20 text-blue-400';
      }
  }

  // --- RETURN JSX (Phần UI giữ nguyên, chỉ thay đổi logic trên) ---
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />
        
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="h-6 w-6" /></button>
            <h1 className="text-3xl font-sans flex-1">{t.history}</h1>
            <History className="h-6 w-6 text-white/60" />
          </div>
          
          <div className="flex gap-2">
            <Button variant={activeTab === 'alerts' ? 'default' : 'outline'} className="flex-1" onClick={() => setActiveTab('alerts')}><Bell className="h-4 w-4 mr-2" />{t.alertHistory}</Button>
            <Button variant={activeTab === 'sos' ? 'default' : 'outline'} className="flex-1" onClick={() => setActiveTab('sos')}><ShieldAlert className="h-4 w-4 mr-2" />{t.sosEvents}</Button>
          </div>
          
          {activeTab === 'alerts' ? (
            Object.keys(alertGroups).length === 0 ? (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 text-center text-white">
                <Bell className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">{t.noHistory || 'No alert history'}</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(alertGroups).map(([date, items]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{date}</h3>
                    {items.map((alert) => (
                      <Card key={alert.id} className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => router.push(`/alerts/${alert.id}`)}>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-white">{alert.title}</h4>
                              <span className="text-xs text-white/50 whitespace-nowrap">{formatTime(alert.timestamp)}</span>
                            </div>
                            <p className="text-sm text-white/70 line-clamp-1 mb-2">{alert.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-xs px-2 py-1 rounded-full font-medium uppercase', getSeverityClass(alert.severity))}>{alert.severity}</span>
                              <span className="text-xs text-white/50 flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )
          ) : (
            // SOS Content (Giữ nguyên)
            Object.keys(sosGroups).length === 0 ? (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 text-center text-white">
                <ShieldAlert className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">{t.noHistory || 'No SOS history'}</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(sosGroups).map(([date, items]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">{date}</h3>
                    {items.map((event) => (
                      <Card key={event.id} className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex items-center justify-center w-10 h-10 rounded-full', event.status === 'sent' && 'bg-green-500/20', event.status === 'pending' && 'bg-yellow-500/20', event.status === 'failed' && 'bg-red-500/20')}>
                            <ShieldAlert className={cn('h-5 w-5', event.status === 'sent' && 'text-green-400', event.status === 'pending' && 'text-yellow-400', event.status === 'failed' && 'text-red-400')} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1"><span className="font-semibold text-white">SOS Alert</span><span className="text-xs text-white/50">{formatTime(event.timestamp)}</span></div>
                            <p className="text-sm text-white/70">{event.location}</p>
                            <span className={cn('inline-block text-xs px-2 py-1 rounded-full font-medium mt-2', event.status === 'sent' && 'bg-green-500/20 text-green-400', event.status === 'pending' && 'bg-yellow-500/20 text-yellow-400', event.status === 'failed' && 'bg-red-500/20 text-red-400')}>{event.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}