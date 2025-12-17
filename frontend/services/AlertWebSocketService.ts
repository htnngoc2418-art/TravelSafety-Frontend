'use client'

type WebSocketMessage = {
  type: 'connected' | 'new_alert' | 'pong' | 'broadcast_alert' | 'error'
  message?: string
  data?: any
  timestamp?: string
}

type MessageHandler = (message: WebSocketMessage) => void

export class AlertWebSocketService {
  private ws: WebSocket | null = null
  private userId: string
  private reconnectInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseUrl: string
  
  // Event handlers
  public onConnected: (() => void) | null = null
  public onNewAlert: ((alert: any) => void) | null = null
  public onError: ((error: any) => void) | null = null
  public onDisconnected: (() => void) | null = null

    constructor(userId: string, baseUrl: string = 'ws://travel-safety-backend.onrender.com') {
    this.userId = userId
    this.baseUrl = baseUrl
  }

  connect() {
    try {
      const wsUrl = `${this.baseUrl}/api/v1/alerts/ws?user_id=${this.userId}`
      console.log('🔌 Connecting to Alert WebSocket:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ Connected to Alert WebSocket')
        this.reconnectAttempts = 0
        this.clearReconnect()
        
        if (this.onConnected) {
          this.onConnected()
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        if (this.onError) {
          this.onError(error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('⚠️ WebSocket closed:', event.code, event.reason)
        this.ws = null
        
        if (this.onDisconnected) {
          this.onDisconnected()
        }
        
        // Auto-reconnect if not intentional close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      this.scheduleReconnect()
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message:', message.type)
    
    switch (message.type) {
      case 'connected':
        console.log('Welcome message:', message.message)
        break

      case 'new_alert':
        console.log('🚨 New Alert received:', message.data)
        if (this.onNewAlert && message.data) {
          this.onNewAlert(message.data)
        }
        break

      case 'broadcast_alert':
        console.log('📢 Broadcast Alert:', message.data)
        if (this.onNewAlert && message.data) {
          this.onNewAlert(message.data)
        }
        break

      case 'pong':
        console.log('🏓 Pong received')
        break

      case 'error':
        console.error('⚠️ Server error:', message.message)
        break

      default:
        console.log('❓ Unknown message type:', message.type)
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }

  updateLocation(lat: number, lng: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📍 Updating location:', lat, lng)
      this.ws.send(JSON.stringify({
        type: 'update_location',
        lat,
        lng
      }))
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) return
    
    this.reconnectAttempts++
    const delay = Math.min(5000 * this.reconnectAttempts, 30000) // Max 30 seconds
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
    
    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null
      this.connect()
    }, delay)
  }

  private clearReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  disconnect() {
    console.log('👋 Disconnecting WebSocket')
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent auto-reconnect
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.clearReconnect()
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
