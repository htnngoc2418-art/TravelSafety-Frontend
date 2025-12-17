'use client'

import { useEffect } from 'react'
import { Button } from './ui/button'
import { X, MapPin, AlertTriangle, Clock } from 'lucide-react'
import type { AlertData } from '../services/AlertApiService'
import './AlertPopup.css'

interface AlertPopupProps {
  alert: AlertData | null
  onClose: () => void
  onViewMap?: (alert: AlertData) => void
}

export function AlertPopup({ alert, onClose, onViewMap }: AlertPopupProps) {
  useEffect(() => {
    if (!alert) return

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 10000)

    // Play alert sound
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/alert.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Audio play failed:', e))
    }

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }

    return () => clearTimeout(timer)
  }, [alert, onClose])

  if (!alert) return null
  
  // Handle location - render properties individually
  const locationProvince = typeof alert.location === 'string' 
    ? alert.location 
    : (alert.location?.province || 'Unknown')
  
  const locationDistrict = typeof alert.location === 'object' && alert.location?.district 
    ? alert.location.district 
    : null

  const getSeverityEmoji = (severity: string) => {
    switch(severity) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return 'ℹ️'
      default: return '📢'
    }
  }

  const getSeverityText = (severity: string) => {
    switch(severity) {
      case 'high': return 'CỰC KỲ NGUY HIỂM'
      case 'medium': return 'NGUY HIỂM'
      case 'low': return 'CHÚ Ý'
      default: return 'THÔNG BÁO'
    }
  }

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
    <div className="popup-overlay" onClick={onClose}>
      <div 
        className={`alert-popup ${alert.severity}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="popup-header">
          <h2>
            {getSeverityEmoji(alert.severity)} CẢNH BÁO KHẨN CẤP
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Content */}
        <div className="popup-content">
          <div className="severity-banner">
            {getSeverityText(alert.severity)}
          </div>
          
          <h3>{alert.title}</h3>
          <p className="description">{alert.description}</p>
          
          {/* Distance Warning */}
          {alert.distance_km !== undefined && (
            <div className="distance-box">
              <div className="distance-icon">📍</div>
              <div className="distance-info">
                <span className="label">Khoảng cách:</span>
                <span className="value">{alert.distance_km.toFixed(1)} km</span>
              </div>
            </div>
          )}
          
          {/* Location */}
          <div className="location-info">
            <strong>Vị trí:</strong> {locationProvince}
            {locationDistrict && `, ${locationDistrict}`}
          </div>
          
          {/* Time */}
          <div className="time-info">
            <strong>Thời gian:</strong> {formatTime(alert.issued_at)}
          </div>
        </div>
        
        {/* Actions */}
        <div className="popup-actions">
          {onViewMap && (
            <button className="btn-view-map" onClick={() => {
              onViewMap(alert)
              onClose()
            }}>
              🗺️ Xem trên bản đồ
            </button>
          )}
          <button className="btn-dismiss" onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
