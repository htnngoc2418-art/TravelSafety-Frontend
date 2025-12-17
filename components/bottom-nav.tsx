'use client'

import { Home, MapIcon, Bell, ShieldAlert, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { useStore } from '../lib/store'
import { useTranslation } from '../lib/translations'

export function BottomNav() {
  const pathname = usePathname()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  
  const links = [
    { href: '/home', icon: Home, label: t.home },
    { href: '/map', icon: MapIcon, label: t.map },
    { href: '/alerts', icon: Bell, label: t.alerts },
    { href: '/past-hazards', icon: BarChart3, label: 'Past Hazards' },
    { href: '/sos', icon: ShieldAlert, label: t.sos },
    { href: '/settings', icon: Settings, label: t.settings },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pwa-safe-bottom z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
