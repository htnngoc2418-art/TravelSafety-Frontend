'use client'

import { Bell, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const userLocation = useStore((state) => state.userLocation)
  
  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/map', label: 'Map' },
    { href: '/alerts', label: 'Alert Hub' },
    { href: '/past-hazards', label: 'Past Hazards' },
    { href: '/sos', label: 'SOS' },
    { href: '/settings', label: 'Settings' },
  ]

  // [LOGIC MỚI] Hàm xử lý khi bấm vào chuông
  const handleNotificationClick = () => {
    // 1. Lưu thời điểm hiện tại vào localStorage
    const now = new Date().toISOString();
    localStorage.setItem('last_notification_view', now);
    
    // 2. Xóa số ngay lập tức trên UI
    setUnreadCount(0);
    
    // 3. Chuyển trang
    router.push('/notifications');
  }

  useEffect(() => {
    const fetchCount = async () => {
      try {
        let url = 'https://travel-safety-backend.onrender.com/api/v1/alerts/all?limit=50';
        if (userLocation) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.data?.combined) {
          // [LOGIC MỚI] Lấy thời gian xem lần cuối từ storage (nếu chưa có thì lấy mốc xa xưa)
          const lastViewed = localStorage.getItem('last_notification_view') || '1970-01-01T00:00:00.000Z';
          const lastViewedTime = new Date(lastViewed).getTime();

          // Lọc ra các tin:
          // 1. Quan trọng (High/Medium) HOẶC Gần
          // 2. VÀ phải MỚI HƠN thời gian xem lần cuối (issued_at > lastViewed)
          const newAlerts = data.data.combined.filter((a: any) => {
             const severity = a.severity?.toLowerCase() || '';
             const isImportant = ['high', 'critical', 'medium'].includes(severity) || a.distance_km < 50;
             
             // Check thời gian
             const alertTime = new Date(a.issued_at).getTime();
             const isNew = alertTime > lastViewedTime;

             return isImportant && isNew;
          });
          
          setUnreadCount(newAlerts.length);
        }
      } catch (error) {
        console.warn("Không kết nối được server thông báo.");
      }
    };

    fetchCount();
    
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [userLocation]); // Chạy lại khi vị trí thay đổi
  
  return (
    <header className="flex items-center justify-between gap-4 relative z-20">
      {/* Logo */}
      <div className="w-12 h-12 md:w-16 md:h-16 relative shrink-0">
        <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
      </div>

      {/* Nav Bar */}
      <nav className="hidden md:flex items-center bg-black/40 backdrop-blur-md rounded-full px-8 py-4 gap-12 flex-1 justify-center max-w-3xl mx-auto border border-white/10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`font-medium hover:text-primary transition-colors ${
              pathname === item.href ? 'text-white' : 'text-white/80'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Nav Placeholder */}
      <div className="md:hidden flex-1" />

      {/* Right Icons */}
      <div className="flex items-center gap-6 shrink-0">
        <button
          className="text-white hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full relative"
          // [FIX] Gọi hàm handleNotificationClick thay vì router.push trực tiếp
          onClick={handleNotificationClick}
          aria-label="Notifications"
        >
          <Bell size={25} strokeWidth={2} />
          
          {/* Badge đỏ chỉ hiện khi có tin MỚI chưa xem */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-black animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button 
          className="text-white hover:text-primary transition-colors p-2 hover:bg-white/10 rounded-full"
          onClick={() => router.push('/profile')}
          aria-label="Profile"
        >
          <User size={25} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}