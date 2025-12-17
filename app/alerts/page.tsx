'use client'

import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { BottomNav } from '../../components/bottom-nav'
import { ChevronRight, ArrowLeft, Filter } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import type { Severity } from '../../lib/store'
import { AppHeader } from '../../components/app-header'
import Image from 'next/image'
import { AlertCard } from '../../components/AlertCard'
import { AlertNotificationBar } from '../../components/AlertNotificationBar'
import { AlertPopup } from '../../components/AlertPopup'
import AlertApiService, { type AlertData, type AlertSeverity, type AlertCategory } from '../../services/AlertApiService'
import LocationService from '../../services/LocationService'

type FilterType = 'nearMe' | 'national' | 'all'

export default function AlertsPage() {
    const router = useRouter()
    const language = useStore((state) => state.language)
    const localAlerts = useStore((state) => state.alerts)
    const userLocation = useStore((state) => state.userLocation)
    const setUserLocation = useStore((state) => state.setUserLocation)
    const t = useTranslation(language)

    const [filter, setFilter] = useState<FilterType>('all')
    const [alerts, setAlerts] = useState<AlertData[]>([])
    const [loading, setLoading] = useState(false)
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<AlertCategory | null>(null)
    const [popupAlerts, setPopupAlerts] = useState<AlertData[]>([])
    const [locationDict, setLocationDict] = useState<Record<string, string>>({})

    // [FIX] State lưu danh sách ID đã đọc
    const [readIds, setReadIds] = useState<string[]>([])

    // [FIX] Load danh sách đã đọc từ localStorage
    const updateReadStatus = () => {
        try {
            const stored = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
            setReadIds(stored);
        } catch (e) {
            console.error("Lỗi đọc trạng thái đã đọc:", e);
        }
    }

    useEffect(() => {
        updateReadStatus();
        // Lắng nghe sự kiện update từ trang chi tiết (nếu có dispatch) hoặc storage
        window.addEventListener('notification-updated', updateReadStatus);
        window.addEventListener('storage', updateReadStatus);

        return () => {
            window.removeEventListener('notification-updated', updateReadStatus);
            window.removeEventListener('storage', updateReadStatus);
        }
    }, []);

    const severityColors: Record<Severity, string> = {
        high: 'bg-red-500 text-white',
        medium: 'bg-orange-500 text-white',
        low: 'bg-yellow-500 text-white',
        safe: 'bg-green-500 text-white',
    }

    useEffect(() => {
        loadAlerts()
    }, [filter, severityFilter, categoryFilter])

    useEffect(() => {
        if (!userLocation) {
            LocationService.getCurrentLocation()
                .then(location => {
                    setUserLocation({ lat: location.lat, lng: location.lng })
                })
                .catch(err => {
                    console.error('Failed to get location:', err)
                    setUserLocation({ lat: 10.0452, lng: 105.7469 })
                })
        }
    }, [])

    useEffect(() => {
        if (userLocation && (filter === 'nearMe' || filter === 'all')) {
            loadAlerts()
        }
    }, [userLocation])

    useEffect(() => {
        const file =
            language === "en"
                ? "/data/app_data_eng.csv"
                : "/data/app_data.csv";

        fetch(file)
            .then(res => res.text())
            .then(text => {
                const lines = text.split("\n").slice(1);
                const dict: Record<string, string> = {};

                lines.forEach(line => {
                    const cols = line.split(",");
                    // CSV format: timestamp,area,province,lat,lon,...
                    if (cols.length >= 5) {
                        const name = cols[1]?.trim();  // area name
                        const lat = cols[3]?.trim();    // lat (index 3)
                        const lon = cols[4]?.trim();    // lon (index 4)

                        if (lat && lon && name) {
                            const key = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
                            dict[key] = name;
                        }
                    }
                });

                setLocationDict(dict);
                console.log("✅ locationDict loaded:", Object.keys(dict).length, "locations");
            })
            .catch(err => console.error("CSV load error:", err));
    }, [language]);

    const loadAlerts = async () => {
        setLoading(true)
        try {
            let data: AlertData[]

            switch (filter) {
                case 'national':
                    const nationalResponse = await AlertApiService.fetchNationalAlerts({
                        severity: severityFilter || undefined,
                        category: categoryFilter || undefined,
                        lang: language
                    })
                    data = nationalResponse.data
                    break

                case 'nearMe':
                    if (userLocation) {
                        const nearbyResponse = await AlertApiService.fetchNearbyAlerts(
                            userLocation.lat,
                            userLocation.lng,
                            50,
                            'low',
                            language
                        )
                        data = nearbyResponse.data

                        const needNotify = data.filter(alert => alert.should_notify === true)
                        if (needNotify.length > 0) {
                            setPopupAlerts(needNotify)
                            playNotificationSound()
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200])
                        }
                    } else {
                        data = []
                    }
                    break

                case 'all':
                default:
                    if (userLocation) {
                        const [nationalResp, nearbyResp] = await Promise.all([
                            AlertApiService.fetchNationalAlerts({ limit: 20 }),
                            AlertApiService.fetchNearbyAlerts(
                                userLocation.lat,
                                userLocation.lng,
                                200,
                                'low',
                                language
                            )
                        ])

                        const nationalAlerts = nationalResp.data
                        const nearbyAlerts = nearbyResp.data
                        const nearbyIds = new Set(nearbyAlerts.map(a => a.id))
                        const uniqueNational = nationalAlerts.filter(a => !nearbyIds.has(a.id))
                        data = [...nearbyAlerts, ...uniqueNational]
                    } else {
                        const nationalResponse = await AlertApiService.fetchNationalAlerts({ lang: language })
                        data = nationalResponse.data
                    }
                    break
            }

            setAlerts(data)
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('cachedAlerts', JSON.stringify(data))
            }
        } catch (error) {
            console.error('Error loading alerts:', error)
            setAlerts(localAlerts.map(alert => ({
                id: alert.id.toString(),
                title: alert.title,
                description: alert.description,
                severity: (alert.severity === 'safe' ? 'low' : alert.severity) as AlertSeverity,
                category: 'disaster' as AlertCategory,
                location: alert.location,
                priority: 50,
                issued_at: typeof alert.timestamp === 'string' ? alert.timestamp : alert.timestamp.toISOString(),
                read: alert.read,
                timestamp: alert.timestamp
            })))
        } finally {
            setLoading(false)
        }
    }

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/alert.mp3')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Cannot play sound:', e))
    }

    const handleAlertClick = (alert: AlertData) => {
        router.push(`/alerts/${alert.id}`)
    }

    // [FIX] Xử lý danh sách alerts hiển thị: Cập nhật trạng thái read dựa trên readIds
    const processedAlerts = alerts.map(alert => ({
        ...alert,
        read: alert.read || readIds.includes(alert.id)
    }));



    // [FIX] Tính số lượng unread dựa trên danh sách đã xử lý
    const unreadCount = processedAlerts.filter(a => !a.read).length

    const isDarkMode = useStore((state) => state.isDarkMode)

    return (
        <div className="min-h-screen relative text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
                <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
            </div>

            <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
                <AppHeader />

                <div className="max-w-7xl mx-auto w-full space-y-6">
                    {/* Header */}
                    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-sans mb-1">{t.alertHub}</h1>
                            {/* [FIX] Hiển thị số unread chính xác */}
                            <p className="text-sm text-white/70">{unreadCount} {t.unreadAlerts}</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <Button
                            variant={filter === 'nearMe' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('nearMe')}
                            disabled={!userLocation}
                        >
                            🎯 {t.nearMe}
                        </Button>
                        <Button
                            variant={filter === 'national' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('national')}
                        >
                            🌍 {t.national}
                        </Button>
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            📋 {t.all}
                        </Button>
                    </div>

                    {/* Filters (National) */}
                    {filter === 'national' && (
                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                                <Filter className="h-5 w-5 text-white" />
                                <h3 className="font-semibold text-white">{t.filters}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-white/90 mb-2 block font-medium">{t.severity}</label>
                                    <select
                                        value={severityFilter || ''}
                                        onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity || null)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/15 focus:bg-white/20 focus:border-white/40 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="" className="bg-gray-800 text-white">{t.allSeverity}</option>
                                        <option value="high" className="bg-gray-800 text-white">{t.highSeverity}</option>
                                        <option value="medium" className="bg-gray-800 text-white">{t.mediumSeverity}</option>
                                        <option value="low" className="bg-gray-800 text-white">{t.lowSeverity}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-white/90 mb-2 block font-medium">{t.category}</label>
                                    <select
                                        value={categoryFilter || ''}
                                        onChange={(e) => setCategoryFilter(e.target.value as AlertCategory || null)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/15 focus:bg-white/20 focus:border-white/40 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="" className="bg-gray-800 text-white">{t.allCategories}</option>
                                        <option value="weather" className="bg-gray-800 text-white">{t.weatherCategory}</option>
                                        <option value="disaster" className="bg-gray-800 text-white">{t.disasterCategory}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alerts List */}
                    <div className="space-y-3">
                        {loading && (
                            <div className="text-center py-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                                <p className="text-white/70">{t.loadingAlerts}</p>
                            </div>
                        )}

                        {/* [FIX] Sử dụng processedAlerts thay vì alerts gốc */}
                        {!loading && processedAlerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                onClick={handleAlertClick}
                                showDistance={filter === 'nearMe' || filter === 'all'}
                                showNotifyBadge={filter === 'nearMe'}
                                locationDict={locationDict}
                            />
                        ))}

                        {!loading && processedAlerts.length === 0 && (
                            <div className="text-center py-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                                <p className="text-white/70">
                                    {filter === 'nearMe' && !userLocation
                                        ? t.locationRequired
                                        : t.noAlerts}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pop-up Notifications */}
            {popupAlerts.map(alert => (
                <AlertPopup
                    key={alert.id}
                    alert={alert}
                    onClose={() => {
                        setPopupAlerts(prev => prev.filter(a => a.id !== alert.id))
                    }}
                    onViewMap={(alert) => {
                        router.push(`/map?alert=${alert.id}`)
                        setPopupAlerts([])
                    }}
                />
            ))}

            <BottomNav />
        </div>
    )
}