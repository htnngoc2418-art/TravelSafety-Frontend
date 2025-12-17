'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '../lib/store'
import { AlertWebSocketService } from '../services/AlertWebSocketService'
import LocationService from '../services/LocationService'
import { AlertPopup } from './AlertPopup'
import { useRouter } from 'next/navigation'

export function AlertWebSocketProvider({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user)
  const wsConnected = useStore((state) => state.wsConnected)
  const setWsConnected = useStore((state) => state.setWsConnected)
  const showAlertPopup = useStore((state) => state.showAlertPopup)
  const activePopup = useStore((state) => state.activePopup)
  const hideAlertPopup = useStore((state) => state.hideAlertPopup)
  const addAlert = useStore((state) => state.addAlert)
  const router = useRouter()
  
  const wsRef = useRef<AlertWebSocketService | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // ⚠️ TẠMTHỜI TẮT WEBSOCKET CHO ĐẾN KHI BACKEND HOÀN THIỆN
    // Uncomment code bên dưới khi backend WebSocket endpoint sẵn sàng
    return
    
    /* WEBSOCKET CODE - ENABLE KHI BACKEND READY
    if (!user?.user_id) return

    // Initialize WebSocket
    const ws = new AlertWebSocketService(
      user.user_id.toString(),
      process.env.NEXT_PUBLIC_WS_URL || 'ws://travel-safety-backend.onrender.com/'
    )
    
    wsRef.current = ws

    // Setup event handlers
    ws.onConnected = () => {
      console.log('✅ WebSocket Connected')
      setWsConnected(true)
    }

    ws.onNewAlert = (alert) => {
      console.log('🚨 New Alert:', alert)
      
      // Handle location - extract properties individually
      let locationText = 'Unknown'
      let lat = 0
      let lng = 0
      
      if (typeof alert.location === 'string') {
        locationText = alert.location
      } else if (alert.location && typeof alert.location === 'object') {
        locationText = alert.location.province || 'Unknown'
        if (alert.location.district) {
          locationText += `, ${alert.location.district}`
        }
        if (alert.location.coordinates && Array.isArray(alert.location.coordinates)) {
          lat = alert.location.coordinates[0] || 0
          lng = alert.location.coordinates[1] || 0
        }
      }
      
      // Add to store
      addAlert({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        timestamp: new Date(alert.issued_at),
        location: locationText,
        lat: lat,
        lng: lng,
        read: false,
        category: alert.category
      })

      // Show popup if high priority
      if (alert.should_notify) {
        showAlertPopup(alert)
      }
    }

    ws.onDisconnected = () => {
      console.log('⚠️ WebSocket Disconnected')
      setWsConnected(false)
    }

    ws.onError = (error) => {
      console.error('❌ WebSocket Error:', error)
    }

    // Connect
    ws.connect()

    // Setup ping interval
    pingIntervalRef.current = setInterval(() => {
      if (ws.isConnected()) {
        ws.sendPing()
      }
    }, 30000) // Every 30 seconds

    // Setup location tracking
    LocationService.startTracking((location) => {
      if (ws.isConnected()) {
        ws.updateLocation(location.lat, location.lng)
      }
    })

    // Cleanup
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      LocationService.stopTracking()
      ws.disconnect()
    }
    END WEBSOCKET CODE */
  }, [user?.user_id])

  return (
    <>
      {children}
      
      {/* Alert Popup */}
      {activePopup && (
      <AlertPopup
        alert={{
          id: activePopup.id,
          title: activePopup.title,
          description: activePopup.description,

          severity:
            activePopup.severity === 'high'
              ? 'high'
              : activePopup.severity === 'medium'
              ? 'medium'
              : 'low',

          priority:
            activePopup.severity === 'high'
              ? 3
              : activePopup.severity === 'medium'
              ? 2
              : activePopup.severity === 'low'
              ? 1
              : 0,

          issued_at: activePopup.timestamp.toISOString(),

          category:
            activePopup.category === 'weather'
              ? 'weather'
              : 'disaster',

          location: activePopup.location,
          read: activePopup.read,
        }}
        onClose={hideAlertPopup}
        onViewMap={() => {
          router.push(`/map?lat=${activePopup.lat}&lng=${activePopup.lng}`)
        }}
      />
    )}


      
      {/* Connection Status Indicator - TẮT TẠM THỜI 
      {user && (
        <div className="fixed bottom-24 right-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            wsConnected 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-500 text-white'
          }`}>
            {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      )}
      */}
    </>
  )
}
