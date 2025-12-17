"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, MapPin, X, Plane } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTranslation } from '@/lib/translations'

type PopupType = "danger" | "safe" | null;

export function GlobalRiskMonitor() {
  const router = useRouter();
  const [popupType, setPopupType] = useState<PopupType>(null);
  const [message, setMessage] = useState("");
  const [subMessage, setSubMessage] = useState("");
  const [details, setDetails] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const [configVersion, setConfigVersion] = useState(0);
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  
  // [FIX] Lấy vị trí từ Store (Vị trí bạn chọn trên Home) thay vì GPS cứng
  const userLocation = useStore((state) => state.userLocation);
  const notificationsEnabled = useStore((state) => state.notifications);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotifiedIdRef = useRef<string | null>(null);
  const audioBlockedRef = useRef(false);

  // 1. Khởi tạo âm thanh
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio('/sounds/alert.mp3');
        audioRef.current.load();
    }

    const handleUserInteraction = () => {
        if (audioBlockedRef.current && audioRef.current) {
            audioRef.current.play()
                .then(() => { audioBlockedRef.current = false; })
                .catch(() => {});
        }
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // 2. Lắng nghe thay đổi setting
  useEffect(() => {
      const handleStorageChange = () => setConfigVersion(v => v + 1);
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // [FIX] Reset bộ nhớ khi người dùng thay đổi vị trí (để nó hiện lại)
  useEffect(() => {
      // Khi đổi vị trí -> Reset ID đã nhớ để hệ thống coi như mới
      lastNotifiedIdRef.current = null;
      // Tạm ẩn popup cũ để chuyển cảnh cho mượt
      setIsVisible(false);
      stopAlertEffects();
  }, [userLocation]); // Chạy mỗi khi userLocation thay đổi

  const stopAlertEffects = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      audioBlockedRef.current = false;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(0);
  };

  const checkSeverityLevel = (alertSeverity: string, minSettings: string) => {
      const levels = ['low', 'medium', 'high', 'critical'];
      const alertLevel = levels.indexOf(alertSeverity.toLowerCase());
      const settingLevel = levels.indexOf(minSettings.toLowerCase());
      return alertLevel >= settingLevel;
  };

  // 3. Logic chính (Chạy lại khi UserLocation thay đổi)
  useEffect(() => {
    let isCancelled = false;

    if (!notificationsEnabled) {
        setIsVisible(false);
        stopAlertEffects();
        return;
    }

    const checkRisk = async () => {
      if (isCancelled) return;
      
      // [FIX] Nếu chưa có vị trí (userLocation null) thì không làm gì cả
      if (!userLocation) return;

      const radius = localStorage.getItem('user_radius_km') || '50';
      const minSeverity = localStorage.getItem('user_min_severity') || 'medium';
      
      const soundRaw = localStorage.getItem('user_sound_enabled');
      const soundOn = soundRaw === null ? true : soundRaw === 'true';

      const vibrateRaw = localStorage.getItem('user_vibration_enabled');
      const vibrateOn = vibrateRaw === null ? true : vibrateRaw === 'true';

      // [FIX] Dùng toạ độ từ Store
      const { lat, lng } = userLocation;

      try {
        const res = await fetch(
          `https://travel-safety-backend.onrender.com/api/v1/alerts/nearby?lat=${lat}&lng=${lng}&radius=${radius}&lang=${language}`
        );
        
        if (isCancelled) return;
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
          const alert = data.data[0];
          const severityPass = checkSeverityLevel(alert.severity, minSeverity);
          
          const isReallyDangerous = 
              alert.severity.toLowerCase() !== 'safe' && 
              alert.category !== 'No' &&
              !alert.title.includes("An toàn");

          if (isReallyDangerous && severityPass) {
              
              // Kiểm tra đã báo chưa
              if (lastNotifiedIdRef.current === alert.id) return;
              
              // Lưu ID mới
              lastNotifiedIdRef.current = alert.id;

              setPopupType("danger");
              const prefix = language === 'en' ? '⚠️ WARNING:' : '⚠️ CẢNH BÁO:'
              setMessage(`${prefix} ${alert.title}`);
              setSubMessage(alert.description || (language === 'en' ? 'Area has a hazard. Stay safe.' : 'Khu vực đang có rủi ro thiên tai. Hãy chú ý an toàn.'));
              setDetails(alert);
              setIsVisible(true);
              
              if (!isCancelled) {
                  // RUNG
                  if (vibrateOn && typeof navigator !== 'undefined' && navigator.vibrate) {
                      try { navigator.vibrate([500, 200, 500]); } catch(e){}
                  }
                  
                  // ÂM THANH
                  if (soundOn && audioRef.current) {
                      const playPromise = audioRef.current.play();
                      if (playPromise !== undefined) {
                          playPromise
                              .then(() => { audioBlockedRef.current = false; })
                              .catch(error => {
                                  console.warn("Autoplay blocked.");
                                  audioBlockedRef.current = true;
                              });
                      }
                  }
              }
          } else {
              if (popupType === 'danger') {
                  setIsVisible(false);
                  stopAlertEffects();
              }
              // Tin an toàn: Chỉ hiện 1 lần mỗi khi đổi địa điểm
              if (!isVisible && lastNotifiedIdRef.current !== 'safe-msg') {
                  showSafeMessage();
                  lastNotifiedIdRef.current = 'safe-msg';
              }
          }
        } else {
           if (!isVisible && lastNotifiedIdRef.current !== 'safe-msg') {
               showSafeMessage();
               lastNotifiedIdRef.current = 'safe-msg';
           }
        }
      } catch (error) {
        // Silent fail
      }
    };

    const showSafeMessage = () => {
        if (isCancelled) return;
        setPopupType("safe");
      setMessage(t.globalSafeTitle || (language === 'en' ? 'Hello! The weather today is beautiful ☀️' : 'Chào bạn! Thời tiết hôm nay rất đẹp ☀️'));
      setSubMessage(t.globalSafeSubtitle || (language === 'en' ? 'Perfect for traveling and outdoor activities ✈️' : 'Rất thích hợp cho các chuyến du lịch và hoạt động ngoài trời ✈️'));
      setIsVisible(true);
        setTimeout(() => { if (!isCancelled) setIsVisible(false); }, 6000);
    };

    // [FIX] Chạy hàm checkRisk mỗi khi các biến dependency thay đổi
    checkRisk();

    return () => {
        isCancelled = true;
        stopAlertEffects();
    };
    
  }, [notificationsEnabled, configVersion, userLocation]); // [FIX] Thêm userLocation vào đây để tự chạy lại khi đổi chỗ
  useEffect(() => {
    if (popupType === 'safe') {
      setMessage(t.globalSafeTitle || (language === 'en' ? 'Hello! The weather today is beautiful ☀️' : 'Chào bạn! Thời tiết hôm nay rất đẹp ☀️'));
      setSubMessage(t.globalSafeSubtitle || (language === 'en' ? 'Perfect for traveling and outdoor activities ✈️' : 'Rất thích hợp cho các chuyến du lịch và hoạt động ngoài trời ✈️'));
    }
  }, [language, popupType, t.globalSafeTitle, t.globalSafeSubtitle]);
  
  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 left-4 right-4 z-[100] p-4 rounded-xl shadow-2xl transition-all duration-500 animate-in slide-in-from-top-5 ${
      popupType === 'danger' 
        ? 'bg-red-600 text-white border-l-4 border-white' 
        : 'bg-white/90 backdrop-blur-md text-slate-800 border border-blue-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full shadow-sm ${
          popupType === 'danger' ? 'bg-red-800' : 'bg-gradient-to-br from-blue-400 to-cyan-300'
        }`}>
          {popupType === 'danger' ? (
            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Plane className="w-6 h-6 text-white transform -rotate-45" />
          )}
        </div>

        <div className="flex-1">
          <h3 className={`font-bold text-lg ${popupType === 'danger' ? 'text-white' : 'text-blue-700'}`}>
            {message}
          </h3>
          <p className={`text-sm mt-1 leading-relaxed ${popupType === 'danger' ? 'text-red-100' : 'text-slate-600'}`}>
            {subMessage}
          </p>
          
          {popupType === 'danger' && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-3 w-full bg-white text-red-600 hover:bg-gray-100 font-semibold shadow-sm"
              onClick={() => {
                router.push(`/map?alert=${details.id}`);
                setIsVisible(false);
                stopAlertEffects();
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Xem vị trí nguy hiểm
            </Button>
          )}
        </div>

        <button 
          onClick={() => {
              setIsVisible(false);
              stopAlertEffects();
          }}
          className={`p-1 rounded-full transition-colors ${
            popupType === 'danger' ? 'hover:bg-red-700 text-white' : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}