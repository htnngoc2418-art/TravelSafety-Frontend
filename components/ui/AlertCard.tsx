'use client'

import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { MapPin, Clock, AlertTriangle } from 'lucide-react'
import type { AlertData } from '../services/AlertApiService'

interface AlertCardProps {
  alert: AlertData
  onClick?: (alert: AlertData) => void
  showDistance?: boolean
  showNotifyBadge?: boolean
}

export function AlertCard({ alert, onClick, showDistance = false, showNotifyBadge = false }: AlertCardProps) {
  const severityConfig = {
    high: {
      color: 'bg-red-500',
      icon: '⚠️',
      label: 'Cao',
      borderColor: 'border-red-500/50'
    },
    medium: {
      color: 'bg-orange-500',
      icon: '⚡',
      label: 'Trung bình',
      borderColor: 'border-orange-500/50'
    },
    low: {
      color: 'bg-blue-500',
      icon: 'ℹ️',
      label: 'Thấp',
      borderColor: 'border-blue-500/50'
    }
  }

  const categoryLabels = {
    weather: 'Thời tiết',
    disaster: 'Thiên tai',
    health: 'Y tế',
    security: 'An ninh'
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-500'
    if (priority >= 50) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const config = severityConfig[alert.severity]
  
  // Handle location - render properties individually
  const locationText = typeof alert.location === 'string' 
    ? alert.location 
    : (alert.location?.province || 'Unknown')
  
  const locationDistrict = typeof alert.location === 'object' && alert.location?.district 
    ? `, ${alert.location.district}` 
    : ''

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffHours < 1) return 'Vừa xong'
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ngày trước`
  }

  return (
    <div 
      className={`bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 cursor-pointer hover:bg-black/50 hover:border-white/20 transition-all hover:scale-[1.02] border-l-4 ${config.borderColor}`}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{config.icon}</span>
          <Badge variant="secondary" className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
            {categoryLabels[alert.category]}
          </Badge>
          
          {/* Notify Badge (chỉ hiện ở Near Me) */}
          {showNotifyBadge && alert.should_notify && (
            <Badge className="bg-red-600/90 backdrop-blur-sm text-white text-xs animate-pulse border-red-400/50">
              🔔 Cần chú ý
            </Badge>
          )}
        </div>
        <Badge className={`${getPriorityColor(alert.priority)} text-white font-bold backdrop-blur-sm`}>
          {alert.priority}
        </Badge>
      </div>

      <h3 className="font-semibold text-lg mb-2 text-white line-clamp-2">
        {alert.title}
      </h3>
      
      <p className="text-sm text-white/70 mb-4 line-clamp-2">
        {alert.description}
      </p>

      <div className="flex flex-wrap gap-3 text-xs text-white/60">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{locationText}{locationDistrict}</span>
        </div>
        
        {/* Distance (chỉ có ở Near Me và All) */}
        {showDistance && alert.distance_km !== undefined && (
          <div className="flex items-center gap-1 font-semibold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full backdrop-blur-sm border border-orange-500/20">
            🎯 {alert.distance_km.toFixed(1)}km
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatTime(alert.issued_at)}</span>
        </div>
      </div>

      {alert.should_notify && !showNotifyBadge && (
        <div className="mt-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Cần chú ý
        </div>
      )}
    </div>
  )
}
