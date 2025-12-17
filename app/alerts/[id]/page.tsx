'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, Share2, MapPin } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function AlertDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const language = useStore((state) => state.language)
    const alertsStore = useStore((state) => state.alerts)
    const markAlertAsRead = useStore((state) => state.markAlertAsRead)
    const t = useTranslation(language)

    // [FIX] State để lưu alert (ưu tiên lấy từ store, nếu không có thì null để fetch sau)
    const [alert, setAlert] = useState<any>(
        alertsStore.find(a => a.id === params.id) || null
    )
    const [loading, setLoading] = useState(!alert)
    const [isRead, setIsRead] = useState(false)

    // [FIX] Effect: Nếu không có dữ liệu trong store, gọi API lấy chi tiết
    useEffect(() => {
        if (!alert && params.id) {
            setLoading(true)
            const alertId = Array.isArray(params.id) ? params.id[0] : params.id

            // Gọi API Backend lấy chi tiết (yêu cầu lang để backend trả tiêu đề phù hợp)
            fetch(`https://travel-safety-backend.onrender.com/api/v1/alerts/${alertId}?lang=${language}`)
                .then(async (res) => {
                    if (!res.ok) throw new Error('Not found')
                    return res.json()
                })
                .then((data) => {
                    setAlert(data)
                })
                .catch((err) => {
                    console.error("Fetch error:", err)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [params.id, language]) // Chạy lại khi ID hoặc ngôn ngữ thay đổi

    useEffect(() => {
        if (alert) {
            // Kiểm tra trong store
            if (alert.read) {
                setIsRead(true);
                return;
            }
            // Kiểm tra trong LocalStorage (Quan trọng để đồng bộ với Hub)
            try {
                const cleared = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
                if (cleared.includes(alert.id)) {
                    setIsRead(true);
                }
            } catch (e) { }
        }
    }, [alert]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <p className="text-muted-foreground">{t.loadingDetails}</p>
            </div>
        )
    }

    if (!alert) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-muted-foreground">{t.alertNotFound}</p>
                    <Button onClick={() => router.back()} className="mt-4">
                        {t.goBack}
                    </Button>
                </div>
            </div>
        )
    }

    // [FIX] Map màu sắc linh hoạt (xử lý cả chữ hoa/thường từ backend)
    const severityColors: Record<string, string> = {
        critical: 'bg-red-600 text-white',
        high: 'bg-red-500 text-white',
        medium: 'bg-orange-500 text-white',
        moderate: 'bg-orange-500 text-white',
        low: 'bg-yellow-500 text-black',
        safe: 'bg-green-500 text-white',
        no: 'bg-green-500 text-white',
        info: 'bg-blue-500 text-white'
    }

    const getSeverityColor = (s: string) => {
        return severityColors[String(s).toLowerCase()] || 'bg-gray-500 text-white'
    }
    const handleMarkAsRead = () => {
        if (!alert) return;

        // 1. Cập nhật Store (nếu dùng)
        markAlertAsRead(alert.id)

        // 2. Cập nhật LocalStorage (Để trang Notifications/Hub ẩn đi)
        try {
            const cleared = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
            if (!cleared.includes(alert.id)) {
                const newCleared = [...cleared, alert.id];
                localStorage.setItem('cleared_notifications', JSON.stringify(newCleared));
            }
        } catch (e) {
            console.error("Lỗi lưu storage", e);
        }

        // 3. Cập nhật UI hiện tại
        setIsRead(true);

        toast({
            title: t.markedAsRead,
            description: t.alertMarkedAsRead,
        })
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: alert.title,
                    text: alert.description,
                    url: window.location.href,
                })
            } catch (err) {
                console.error('Share failed:', err)
            }
        } else {
            toast({
                title: t.shareLinkCopied,
                description: t.alertLinkCopied,
            })
        }
    }

    const todoItems = [
        t.stayIndoors,
        t.keepEmergencyKit,
        t.monitorUpdates,
        t.chargeDevices,
        t.haveContacts,
    ]

    const dontItems = [
        t.dontTravel,
        t.dontIgnoreEvacuation,
        t.dontUseElevators,
        t.dontDriveThroughFlood,
        t.dontSpreadInfo,
    ]

    return (
        <div className="min-h-screen relative text-white overflow-hidden pb-6 pwa-safe-top">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            </div>

            {/* Header */}
            <div className="relative z-10 sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold flex-1">{t.alertDetails}</h1>
                    <Badge className={getSeverityColor(alert.severity)}>
                        {String(alert.severity).toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="relative z-10 p-6 space-y-6">
                {/* Mini Map */}
                <div className="h-40 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                        <p className="text-sm text-white/70">
                            {/* [FIX] Hiển thị location an toàn (kể cả object hay string) */}
                            {typeof alert.location === 'object' ? alert.location.province : alert.location}
                        </p>
                    </div>
                </div>

                {/* Alert Info */}
                <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-6">
                    <h2 className="text-2xl font-bold mb-2 text-white">{alert.title}</h2>
                    <p className="text-white/70 mb-4">{alert.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-white/60">
                        <span>📍 {typeof alert.location === 'object' ? alert.location.province : alert.location}</span>
                        <span>•</span>
                        {/* [FIX] Hiển thị thời gian an toàn */}
                        <span suppressHydrationWarning>
                            🕐 {new Date(alert.issued_at || alert.timestamp || Date.now()).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Video and Instructions Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Video */}
                    <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-6">
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                            <video
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                            >
                                <source src="/videos/[eng]%20Instruction.mp4" type="video/mp4" />
                            </video>
                        </div>
                    </div>

                    {/* Right: What to Do & What Not to Do */}
                    <div className="space-y-6">
                        {/* What to Do */}
                        <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-6">
                            <h3 className="font-semibold mb-3 text-green-400">✅ {t.whatToDo}</h3>
                            <ul className="space-y-2">
                                {todoItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What Not to Do */}
                        <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 p-6">
                            <h3 className="font-semibold mb-3 text-red-400">❌ {t.whatNotToDo}</h3>
                            <ul className="space-y-2">
                                {dontItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                                        <div className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleMarkAsRead}
                        // [FIX] Dùng state isRead thay vì alert.read
                        disabled={isRead}
                        className={`flex-1 backdrop-blur-sm border-green-400/50 ${isRead
                                ? 'bg-gray-600/50 text-gray-300 border-gray-500/50'
                                : 'bg-green-600/90 hover:bg-green-600'
                            }`}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isRead ? "Đã đọc" : t.markAsRead}
                    </Button>
                    <Button
                        onClick={handleShare}
                        variant="outline"
                        className="flex-1 bg-black/40 backdrop-blur-md border-white/20 hover:bg-black/60 text-white"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        {t.share}
                    </Button>
                </div>
            </div>
        </div>
    )
}