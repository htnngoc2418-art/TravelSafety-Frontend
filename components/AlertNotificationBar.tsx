'use client'

import { useEffect, useState } from 'react'
import AlertApiService, { type AlertData } from '../services/AlertApiService'

export function AlertNotificationBar() {
  const [latestAlerts, setLatestAlerts] = useState<AlertData[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadLatestAlerts()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadLatestAlerts, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadLatestAlerts = async () => {
    try {
      const response = await AlertApiService.fetchLatestAlerts(10)
      const highPriorityAlerts = response.data.filter(
        alert => alert.severity === 'high' || alert.priority > 70
      )
      setLatestAlerts(highPriorityAlerts)
      setIsVisible(highPriorityAlerts.length > 0)
    } catch (error) {
      console.error('Error loading latest alerts:', error)
    }
  }

  if (!isVisible || latestAlerts.length === 0) return null

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
      <div className="overflow-hidden py-3">
        <div className="animate-scroll-left whitespace-nowrap inline-block">
          {latestAlerts.map((alert, index) => (
            <span key={alert.id} className="inline-flex items-center mx-4">
              <span className="font-semibold">🚨 {alert.title}</span>
              {index < latestAlerts.length - 1 && (
                <span className="mx-4 text-white/60">•</span>
              )}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {latestAlerts.map((alert, index) => (
            <span key={`${alert.id}-duplicate`} className="inline-flex items-center mx-4">
              <span className="font-semibold">🚨 {alert.title}</span>
              {index < latestAlerts.length - 1 && (
                <span className="mx-4 text-white/60">•</span>
              )}
            </span>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
