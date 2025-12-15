'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface ToastNotificationProps {
  message: string
  severity?: 'critical' | 'high' | 'moderate' | 'low'
  duration?: number
  onClose?: () => void
}

export function ToastNotification({ 
  message, 
  severity = 'moderate', 
  duration = 5000,
  onClose 
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  if (!isVisible) return null
  
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-critical text-critical-foreground'
      case 'high':
        return 'bg-high text-high-foreground'
      case 'moderate':
        return 'bg-moderate text-moderate-foreground'
      default:
        return 'bg-low text-low-foreground'
    }
  }
  
  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top">
      <Card className={cn('p-4 shadow-lg', getSeverityColor())}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="flex-1 font-medium text-sm leading-relaxed">{message}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
