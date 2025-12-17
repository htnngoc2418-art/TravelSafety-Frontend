'use client'

export type LocationData = {
  lat: number
  lng: number
  accuracy?: number
  timestamp: Date
}

export type LocationCallback = (location: LocationData) => void

class LocationService {
  private watchId: number | null = null
  private currentLocation: LocationData | null = null
  private locationCallbacks: LocationCallback[] = []
  private lastUpdateTime: number = 0
  private updateIntervalMs: number = 300000 // 5 minutes

  // Start tracking location
  startTracking(callback?: LocationCallback): number | null {
    if (!this.isSupported()) {
      console.error('❌ Geolocation is not supported in this browser')
      return null
    }

    if (callback) {
      this.locationCallbacks.push(callback)
    }

    // Already tracking
    if (this.watchId !== null) {
      console.log('ℹ️ Location tracking already active')
      if (this.currentLocation && callback) {
        callback(this.currentLocation)
      }
      return this.watchId
    }

    console.log('📍 Starting location tracking...')

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        }

        const now = Date.now()
        const shouldUpdate = !this.currentLocation || 
                           (now - this.lastUpdateTime) >= this.updateIntervalMs ||
                           this.hasLocationChanged(this.currentLocation, newLocation)

        if (shouldUpdate) {
          console.log('📍 Location updated:', newLocation.lat.toFixed(6), newLocation.lng.toFixed(6))
          this.currentLocation = newLocation
          this.lastUpdateTime = now

          // Notify all callbacks
          this.locationCallbacks.forEach(cb => cb(newLocation))
        }
      },
      (error) => {
        console.error('❌ Location error:', this.getErrorMessage(error))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: this.updateIntervalMs
      }
    )

    return this.watchId
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId !== null) {
      console.log('🛑 Stopping location tracking')
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.locationCallbacks = []
  }

  // Get current location once
  async getCurrentLocation(): Promise<LocationData> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported')
    }

    // Return cached location if recent
    if (this.currentLocation && 
        (Date.now() - this.lastUpdateTime) < 60000) { // Less than 1 minute old
      return this.currentLocation
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          }
          
          this.currentLocation = location
          this.lastUpdateTime = Date.now()
          
          console.log('📍 Current location:', location.lat.toFixed(6), location.lng.toFixed(6))
          resolve(location)
        },
        (error) => {
          console.error('❌ Failed to get location:', this.getErrorMessage(error))
          reject(error)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000,
          maximumAge: 60000
        }
      )
    })
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private hasLocationChanged(oldLoc: LocationData, newLoc: LocationData): boolean {
    const distance = this.calculateDistance(
      oldLoc.lat, oldLoc.lng,
      newLoc.lat, newLoc.lng
    )
    return distance > 1 // Changed more than 1km
  }

  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'User denied location permission'
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable'
      case error.TIMEOUT:
        return 'Location request timed out'
      default:
        return 'Unknown location error'
    }
  }

  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  getCachedLocation(): LocationData | null {
    return this.currentLocation
  }

  setUpdateInterval(ms: number) {
    this.updateIntervalMs = ms
  }

  addCallback(callback: LocationCallback) {
    this.locationCallbacks.push(callback)
    
    // Immediately call with current location if available
    if (this.currentLocation) {
      callback(this.currentLocation)
    }
  }

  removeCallback(callback: LocationCallback) {
    this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback)
  }
}

export default new LocationService()
