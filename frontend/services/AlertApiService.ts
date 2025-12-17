'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_ALERTS_API_URL || 'https://travel-safety-backend.onrender.com/api/v1/alerts'

export type AlertSeverity = 'high' | 'medium' | 'low'
export type AlertCategory = 'weather' | 'disaster' | 'health' | 'security'

export interface AlertLocation {
  province: string
  district?: string | null
  coordinates: [number, number]
}

export interface AlertData {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  category: AlertCategory
  location: AlertLocation | string  // Support both backend format and local format
  priority: number
  affected_population?: number
  issued_at: string
  expires_at?: string
  source?: string
  distance_km?: number
  should_notify?: boolean
  read?: boolean  // For local store compatibility
  timestamp?: string | Date  // For local store compatibility
}

export interface AlertsResponse {
  success: boolean
  data: AlertData[]
  total: number
  page?: number
}

export interface AlertsAllResponse {
  success: boolean
  data: {
    national: AlertData[]
    nearby: AlertData[]
    combined: AlertData[]
  }
  total: number
}

export interface StatisticsResponse {
  success: boolean
  statistics: {
    total_alerts: number
    by_severity: {
      high: number
      medium: number
      low: number
    }
    by_category: Record<string, number>
    high_priority_count: number
    active_alerts: number
  }
}

class AlertApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    
    console.log('🌐 Fetching URL:', url)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge with provided headers
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log('📡 Response status:', response.status, response.statusText)
    console.log('📦 Response headers:', response.headers.get('content-type'))

    if (!response.ok) {
      const text = await response.text()
      console.error('❌ API Error response:', text.substring(0, 200))
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response
  }

  // Get national alerts
  async fetchNationalAlerts(filters?: {
    limit?: number
    severity?: AlertSeverity
    category?: AlertCategory
    lang?: string
  }): Promise<AlertsResponse> {
    const params = new URLSearchParams({
      limit: (filters?.limit || 20).toString(),
    })

    if (filters?.severity) {
      params.append('severity', filters.severity)
    }
    if (filters?.category) {
      params.append('category', filters.category)
    }
    if (filters?.lang) {
      params.append('lang', filters.lang)
    }

    const response = await this.fetchWithAuth(
      `${this.baseUrl}/national?${params}`
    )
    return response.json()
  }

  // Get nearby alerts
  async fetchNearbyAlerts(
    lat: number,
    lng: number,
    radius: number = 50,
    minSeverity: AlertSeverity = 'medium',
    lang?: string
  ): Promise<AlertsResponse & { user_location: { lat: number; lng: number; province?: string } }> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      min_severity: minSeverity,
    })
    if (lang) params.append('lang', lang)

    const response = await this.fetchWithAuth(
      `${this.baseUrl}/nearby?${params}`
    )
    return response.json()
  }

  // Get all alerts (combined)
  async fetchAllAlerts(
    lat?: number,
    lng?: number,
    limit: number = 50,
    radius: number = 200,
    minSeverity: AlertSeverity = 'low',
    lang?: string
  ): Promise<AlertsAllResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    if (lat !== undefined && lng !== undefined) {
      params.append('lat', lat.toString())
      params.append('lng', lng.toString())
      params.append('radius', radius.toString())
      params.append('min_severity', minSeverity)
    }
    if (lang) params.append('lang', lang)

    const response = await this.fetchWithAuth(
      `${this.baseUrl}/all?${params}`
    )
    return response.json()
  }

  // Get latest alerts
  async fetchLatestAlerts(limit: number = 10, lang?: string): Promise<AlertsResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (lang) params.append('lang', lang)
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/latest?${params}`
    )
    return response.json()
  }

  // Get statistics
  async fetchStatistics(): Promise<StatisticsResponse> {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/statistics`
    )
    return response.json()
  }

  // Update user location
  async updateUserLocation(
    userId: string,
    lat: number,
    lng: number,
    accuracy?: number
  ): Promise<{ success: boolean }> {
    const apiBaseUrl = this.baseUrl.replace('/alerts', '')
    const response = await this.fetchWithAuth(
      `${apiBaseUrl}/user/location`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          lat,
          lng,
          accuracy,
          timestamp: new Date().toISOString(),
        }),
      }
    )
    return response.json()
  }
  // Update user alert preferences
  async updateAlertPreferences(
    userId: string,
    preferences: {
      enabled_categories?: AlertCategory[]
      min_severity?: AlertSeverity
      notification_radius_km?: number
      quiet_hours?: {
        enabled: boolean
        start: string
        end: string
      }
    }
  ): Promise<{ success: boolean }> {
    const apiBaseUrl = this.baseUrl.replace('/alerts', '')
    const response = await this.fetchWithAuth(
      `${apiBaseUrl}/user/alert-preferences`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          preferences,
        }),
      }
    )
    return response.json()
  }

  // Get user alert preferences
  async getAlertPreferences(userId: string): Promise<{
    success: boolean
    preferences: any
  }> {
    const apiBaseUrl = this.baseUrl.replace('/alerts', '')
    const response = await this.fetchWithAuth(
      `${apiBaseUrl}/user/alert-preferences?user_id=${userId}`
    )
    return response.json()
  }

  // Mark alert as viewed
  async markAlertAsViewed(alertId: string, userId: string): Promise<{ success: boolean }> {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/${alertId}/view`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          viewed_at: new Date().toISOString(),
        }),
      }
    )
    return response.json()
  }

  // Dismiss alert
  async dismissAlert(alertId: string, userId: string): Promise<{ success: boolean }> {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/${alertId}/dismiss`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          dismissed_at: new Date().toISOString(),
        }),
      }
    )
    return response.json()
  }
}

export default new AlertApiService()
