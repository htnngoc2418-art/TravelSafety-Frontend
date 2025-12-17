"use client";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BottomNav } from "../../components/bottom-nav";
import { AppHeader } from "../../components/app-header";
import {
    Wifi,
    Download,
    RefreshCw,
    Database,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Eye,
    Trash2,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { useTranslation } from "../../lib/translations";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
// Đã thêm saveRescueStations vào import
import {
    getOfflineStats,
    saveEmergencyContacts,
    saveRescueStations,
    getEmergencyContacts,
    clearAllOfflineData,
    getPendingSosLogs,
    markSosSynced,
} from "../../lib/offline-db";
import { useToast } from "../../hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-safety-backend.onrender.com";

export default function OfflinePage() {
    const router = useRouter();
    const language = useStore((state) => state.language);
    const { toast } = useToast();
    const t = useTranslation(language);

    const [stats, setStats] = useState({
        routes: 0,
        tiles: 0,
        contacts: 0,
        pendingSos: 0,
        totalSize: 0,
    });
    const [syncing, setSyncing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lastSynced, setLastSynced] = useState<string>("Never");
    const emergencyContacts = useStore((state) => state.emergencyContacts);
    const authToken = useStore((state) => state.authToken);
    const isDarkMode = useStore((state) => state.isDarkMode);

    // Load stats on mount
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const dbStats: any = await getOfflineStats();

            // --- FIX 1: Map đúng tên biến từ DB sang State ---
            setStats({
                routes: dbStats.routes || 0,
                tiles: dbStats.tiles || 0,
                contacts: dbStats.contacts || 0,
                pendingSos: dbStats.sosLogs || 0, // DB trả về 'sosLogs', State cần 'pendingSos'
                totalSize: parseFloat(dbStats.estimatedSizeMB) || 0, // DB trả về string, parse sang number
            });
        } catch (error) {
            console.error("Error loading offline stats:", error);
        }
    };

    const handleDownloadData = async () => {
        setSyncing(true);
        setProgress(0);

        try {
            // Step 1: Save emergency contacts (Local -> DB)
            setProgress(10);
            if (emergencyContacts.length > 0) {
                try {
                    await saveEmergencyContacts(emergencyContacts);
                } catch (error) {
                    console.error("Error saving emergency contacts:", error);
                }
            }

            // --- FIX 2: Thêm logic tải Trạm cứu hộ từ Server về máy ---
            setProgress(30);
            try {
                // Giả sử API endpoint lấy danh sách trạm là /api/v1/rescue-stations
                // Bạn cần đảm bảo endpoint này đúng với backend của bạn
                const res = await fetch(`${API_BASE_URL}/api/v1/rescue-stations`);
                if (res.ok) {
                    const stations = await res.json();
                    if (Array.isArray(stations)) {
                        await saveRescueStations(stations);
                        console.log(`Downloaded ${stations.length} rescue stations`);
                    }
                }
            } catch (err) {
                console.warn("Could not download rescue stations (offline?)", err);
            }
            // -----------------------------------------------------------

            // Step 3: Sync pending SOS logs (DB -> Server)
            setProgress(60);
            const pendingLogs = await getPendingSosLogs();

            if (pendingLogs.length > 0) {
                for (let i = 0; i < pendingLogs.length; i++) {
                    const log = pendingLogs[i];
                    try {
                        const sosResponse = await fetch(
                            `${API_BASE_URL}/api/v1/sos/trigger`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${authToken}`,
                                },
                                body: JSON.stringify({
                                    latitude: log.latitude,
                                    longitude: log.longitude,
                                    user_id: "offline-sync",
                                    medical_notes: log.medicalNotes,
                                    contact_email: [],
                                }),
                            }
                        );

                        if (sosResponse.ok) {
                            await markSosSynced(log.id);
                        }
                    } catch (error) {
                        console.error("Error syncing SOS log:", error);
                    }

                    // Update progress based on SOS syncing
                    const sosProgress = 60 + ((i + 1) / pendingLogs.length) * 35;
                    setProgress(Math.min(sosProgress, 95));
                }
            }

            setProgress(100);
            await loadStats(); // Reload lại số liệu sau khi sync xong
            setLastSynced(new Date().toLocaleTimeString());

            const syncedSosCount = pendingLogs.length;
            toast({
                title: "Sync Complete",
                description: "Data synchronized successfully (Contacts, Stations & SOS Logs).",
            });
        } catch (error) {
            console.error("Sync error:", error);
            toast({
                title: "Sync Failed",
                description:
                    error instanceof Error ? error.message : "Check your internet connection",
                variant: "destructive",
            });
        } finally {
            setSyncing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const handleClearData = async () => {
        if (confirm("Are you sure? This will delete all offline data.")) {
            try {
                await clearAllOfflineData();
                await loadStats();
                toast({
                    title: "Data Cleared",
                    description: "All offline data has been deleted.",
                });
            } catch (error) {
                console.error("Clear error:", error);
                toast({
                    title: "Error",
                    description: "Failed to clear data",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <div className="min-h-screen relative text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/background-storm.jpg"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div
                    className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? "bg-black/80" : "bg-black/30"
                        }`}
                />
            </div>

            <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
                <AppHeader />

                <div className="max-w-4xl mx-auto w-full space-y-6">
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
                            <h1 className="text-3xl font-serif text-white">Offline Mode</h1>
                            <p className="text-sm text-white/70">
                                Manage your offline data and sync
                            </p>
                        </div>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
                            <Wifi className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>

                    {/* Status Card */}
                    <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 text-white">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-white">
                                    Sync Status
                                </h2>
                                <span className="text-sm font-medium text-green-400">
                                    ✓ Ready
                                </span>
                            </div>

                            {/* Progress Bar */}
                            {syncing && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">Syncing...</span>
                                        <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Sync Info */}
                            <div className="pt-2 border-t border-white/10 space-y-2">
                                <p className="text-xs text-white/60">
                                    Last synced:{" "}
                                    <span className="text-white/80 font-medium">
                                        {lastSynced}
                                    </span>
                                </p>
                                <p className="text-xs text-white/60">
                                    Total data:{" "}
                                    <span className="text-white/80 font-medium">
                                        {stats.totalSize} MB
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Offline Data Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                    {stats.routes}
                                </div>
                                <div className="text-xs text-white/60 mt-1">Routes</div>
                            </div>
                        </Card>

                        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {stats.contacts}
                                </div>
                                <div className="text-xs text-white/60 mt-1">Contacts</div>
                            </div>
                        </Card>

                        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">
                                    {stats.pendingSos}
                                </div>
                                <div className="text-xs text-white/60 mt-1">Pending SOS</div>
                            </div>
                        </Card>

                        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">
                                    {stats.tiles}
                                </div>
                                <div className="text-xs text-white/60 mt-1">Map Tiles</div>
                            </div>
                        </Card>
                    </div>

                    {/* Data Breakdown */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold px-2 text-white">
                            Data Breakdown
                        </h2>

                        <div className="space-y-2">
                            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                                        <Database className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm text-white">Routes</h3>
                                        <p className="text-xs text-white/60">
                                            {stats.routes} saved routes
                                        </p>
                                    </div>
                                    {stats.routes > 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                </div>
                            </Card>

                            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
                                        <Download className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm text-white">
                                            Contacts
                                        </h3>
                                        <p className="text-xs text-white/60">
                                            {stats.contacts} emergency contacts
                                        </p>
                                    </div>
                                    {stats.contacts > 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                </div>
                            </Card>

                            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20">
                                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm text-white">
                                            Pending SOS
                                        </h3>
                                        <p className="text-xs text-white/60">
                                            {stats.pendingSos} waiting to sync
                                        </p>
                                    </div>
                                    {stats.pendingSos > 0 && (
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    )}
                                </div>
                            </Card>

                            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20">
                                        <Wifi className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm text-white">
                                            Map Tiles
                                        </h3>
                                        <p className="text-xs text-white/60">
                                            {stats.tiles} cached tiles
                                        </p>
                                    </div>
                                    {stats.tiles > 0 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={handleDownloadData}
                            disabled={syncing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                            />
                            <span className="text-white">
                                {syncing ? "Syncing..." : "Sync Now"}
                            </span>
                        </Button>

                        <Button
                            onClick={() => router.push("/map")}
                            variant="outline"
                            className="w-full text-white border-white/20 hover:bg-white/10"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="text-white">View Offline Data</span>
                        </Button>

                        <Button
                            onClick={handleClearData}
                            variant="outline"
                            className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Clear All Data</span>
                        </Button>

                        <Card className="bg-blue-500/10 border-blue-500/30 p-4 text-white">
                            <p className="text-sm text-center">
                                ℹ️ Your offline data will be automatically updated when you're
                                connected to the internet.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}