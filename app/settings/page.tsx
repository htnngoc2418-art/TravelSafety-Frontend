'use client'

import { Card } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/app-header'
import { ChevronRight, Globe, Moon, Wifi, Bell, Shield, HelpCircle, User, ArrowLeft, History, MapPin, Clock, Save, VolumeX, Volume2, Zap } from 'lucide-react' // [ADD] Import icon mới
import { useStore } from '@/lib/store'
import { useTranslation } from '@/lib/translations'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const language = useStore((state) => state.language)
  const isDarkMode = useStore((state) => state.isDarkMode)
  const notifications = useStore((state) => state.notifications)
  const offlineMode = useStore((state) => state.offlineMode) 
  
  const setLanguage = useStore((state) => state.setLanguage)
  const setDarkMode = useStore((state) => state.setDarkMode)
  const toggleNotifications = useStore((state) => state.toggleNotifications)
  const toggleOfflineMode = useStore((state) => state.toggleOfflineMode)
  
  const t = useTranslation(language)

  const [loading, setLoading] = useState(false)
  const [prefs, setPrefs] = useState({
    min_severity: 'medium',
    notification_radius_km: 50,
    quiet_hours_enabled: false,
    quiet_start: '22:00',
    quiet_end: '07:00',
    sound_enabled: true,   // [NEW] Mặc định bật tiếng
    vibration_enabled: true // [NEW] Mặc định bật rung
  })

  // Load settings
  useEffect(() => {
    const userId = "user_123" 
      fetch(`https://travel-safety-backend.onrender.com/api/user/preferences?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if(data) {
            setPrefs({
                min_severity: data.min_severity || 'medium',
                notification_radius_km: data.notification_radius_km || 50,
                quiet_hours_enabled: data.quiet_hours?.enabled || false,
                quiet_start: data.quiet_hours?.start || '22:00',
                quiet_end: data.quiet_hours?.end || '07:00',
                // [NEW] Load setting mới (fallback true nếu chưa có)
                sound_enabled: data.sound_enabled !== undefined ? data.sound_enabled : true,
                vibration_enabled: data.vibration_enabled !== undefined ? data.vibration_enabled : true,
            })
        }
      })
      .catch(err => console.log("Chưa có settings cũ, dùng mặc định."))
  }, [])

  // Save settings
  const handleSavePreferences = async () => {
    setLoading(true)
    try {
        const payload = {
            user_id: "user_123",
            preferences: {
                min_severity: prefs.min_severity,
                notification_radius_km: prefs.notification_radius_km,
                enabled_categories: ["weather", "disaster"],
                quiet_hours: {
                    enabled: prefs.quiet_hours_enabled,
                    start: prefs.quiet_start,
                    end: prefs.quiet_end
                },
                // [NEW] Gửi setting mới lên backend
                sound_enabled: prefs.sound_enabled,
                vibration_enabled: prefs.vibration_enabled
            }
        }

        const res = await fetch('https://travel-safety-backend.onrender.com/api/user/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            toast({ title: "Saved", description: "Updated preferences successfully." })
            // [OPTIONAL] Lưu vào localStorage để các component khác (như GlobalRiskMonitor) đọc nhanh
            localStorage.setItem('user_min_severity', prefs.min_severity);
            localStorage.setItem('user_radius_km', String(prefs.notification_radius_km));
            localStorage.setItem('user_sound_enabled', String(prefs.sound_enabled));
            localStorage.setItem('user_vibration_enabled', String(prefs.vibration_enabled));
            window.dispatchEvent(new Event('storage'));
        } else {
            throw new Error("Failed to save")
        }
    } catch (error) {
        toast({ title: "Error", description: "Could not save settings.", variant: "destructive" })
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const languageOptions = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
  ]

  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-sans flex-1">{t.settings}</h1>
            <Button 
                onClick={handleSavePreferences} 
                disabled={loading}
                className="bg-primary hover:bg-primary/80 text-white"
            >
                {loading ? <span className="animate-spin mr-2">⏳</span> : <Save className="w-4 h-4 mr-2"/>}
                Save
            </Button>
          </div>

          {/* === ALERT PREFERENCES === */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">Alert Configuration</h2>
            
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20">
                        <Bell className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="flex-1 font-medium">Minimum Severity</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                        <button
                            key={level}
                            onClick={() => setPrefs({...prefs, min_severity: level})}
                            className={`py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                                prefs.min_severity === level 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {level} Risk
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
                        <MapPin className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <span className="font-medium">Notification Radius</span>
                        <p className="text-xs text-white/60">{prefs.notification_radius_km} km around you</p>
                    </div>
                </div>
                <div className="px-2">
                    <Slider 
                        defaultValue={[prefs.notification_radius_km]} 
                        max={200} min={10} step={10}
                        onValueChange={(val) => setPrefs({...prefs, notification_radius_km: val[0]})}
                        className="py-4"
                    />
                </div>
            </Card>

            {/* [NEW] Sound & Vibration Settings */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                                <Volume2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <span className="font-medium">Sound Alert</span>
                        </div>
                        <Switch 
                            checked={prefs.sound_enabled} 
                            onCheckedChange={(c) => setPrefs({...prefs, sound_enabled: c})} 
                        />
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/20">
                                <Zap className="h-5 w-5 text-orange-500" />
                            </div>
                            <span className="font-medium">Vibration Alert</span>
                        </div>
                        <Switch 
                            checked={prefs.vibration_enabled} 
                            onCheckedChange={(c) => setPrefs({...prefs, vibration_enabled: c})} 
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20">
                            <VolumeX className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="font-medium">Quiet Hours</span>
                    </div>
                    <Switch 
                        checked={prefs.quiet_hours_enabled} 
                        onCheckedChange={(c) => setPrefs({...prefs, quiet_hours_enabled: c})} 
                    />
                </div>
                {prefs.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-white/60">Start Time</Label>
                            <input 
                                type="time" 
                                value={prefs.quiet_start}
                                onChange={(e) => setPrefs({...prefs, quiet_start: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-white/60">End Time</Label>
                            <input 
                                type="time" 
                                value={prefs.quiet_end}
                                onChange={(e) => setPrefs({...prefs, quiet_end: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white"
                            />
                        </div>
                    </div>
                )}
            </Card>
          </div>

          {/* === GENERAL SETTINGS === */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">General</h2>

            {/* Language */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <span className="flex-1 font-medium">{t.language}</span>
              </div>
              <div className="space-y-2">
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      language === option.code
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <span className="text-xl">{option.flag}</span>
                    <span className="flex-1 text-left font-medium text-sm">{option.label}</span>
                    {language === option.code && <span className="text-white font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </Card>

            {/* Notifications Toggle */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20">
                    <Bell className="h-5 w-5 text-yellow-500" />
                  </div>
                  <span className="flex-1 font-medium">{t.notifications}</span>
                </div>
                <Switch checked={notifications} onCheckedChange={toggleNotifications} />
              </div>
            </Card>

            {/* View History */}
            <Card 
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => router.push('/history')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/20">
                  <History className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="flex-1 font-medium">View History</span>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>

            {/* Offline Mode */}
            <Card 
              className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => router.push('/offline')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500/20">
                  <Wifi className="h-5 w-5 text-gray-300" />
                </div>
                <span className="flex-1 font-medium">Offline Mode</span>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>

            {/* Dark Mode */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-500/20">
                    <Moon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="flex-1 font-medium">{t.darkMode}</span>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={(checked) => setDarkMode(checked)} />
              </div>
            </Card>
          </div>

          {/* Account Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">Account</h2>
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => router.push('/profile')}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/20"><User className="h-5 w-5 text-orange-500" /></div>
                <div className="flex-1"><div className="font-medium">{t.profile}</div><div className="text-xs text-white/60">Manage account</div></div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
          </div>

          {/* Privacy Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide px-2">Privacy & Legal</h2>
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => router.push('/privacy')}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/20"><Shield className="h-5 w-5 text-teal-500" /></div>
                <span className="flex-1 font-medium">{t.privacyPolicy}</span>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-4 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => router.push('/help')}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/20"><HelpCircle className="h-5 w-5 text-pink-500" /></div>
                <div className="flex-1"><div className="font-medium">{t.help}</div><div className="text-xs text-white/60">FAQs and support</div></div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </Card>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}