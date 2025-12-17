import { Alert, SOSEvent, EmergencyContact, SavedLocation, Severity } from './store'

export const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'Severe Storm Warning',
    description: 'A severe thunderstorm with heavy rainfall and strong winds is approaching the area. Expected to arrive within 2 hours.',
    severity: 'high', 
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    location: 'Ha Long Bay, Quang Ninh',
    lat: 20.9101,
    lng: 107.1839,
    read: false,
    category: 'weather',
  },
  {
    id: '2',
    title: 'Flash Flood Advisory',
    description: 'Heavy rainfall may cause flash flooding in low-lying areas. Avoid river crossings and stay on high ground.',
    severity: 'medium',  
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: 'Sapa, Lao Cai',
    lat: 22.3364,
    lng: 103.8438,
    read: false,
    category: 'disaster',
  },
  {
    id: '3',
    title: 'Heat Advisory',
    description: 'Temperatures expected to reach 38°C (100°F). Stay hydrated and avoid prolonged sun exposure.',
    severity: 'low', 
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    location: 'Hanoi',
    lat: 21.0285,
    lng: 105.8542,
    read: true,
    category: 'weather',
  },
  {
    id: '4',
    title: 'Coastal Advisory',
    description: 'Rough seas and high waves expected. Small craft should remain in harbor.',
    severity: 'low', 
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    location: 'Nha Trang, Khanh Hoa',
    lat: 12.2388,
    lng: 109.1967,
    read: true,
    category: 'advisory',
  },
  {
    id: '5',
    title: 'Air Quality Alert',
    description: 'Poor air quality detected. Sensitive groups should limit outdoor activities.',
    severity: 'safe', 
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    location: 'Ho Chi Minh City',
    lat: 10.8231,
    lng: 106.6297,
    read: true,
    category: 'advisory',
  },
]

export const mockSOSHistory: SOSEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    location: 'Da Nang',
    status: 'sent',
  },
]

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+84 123 456 789',
    relation_type: 'Family',
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+84 987 654 321',
    relation_type: 'Friend',
  },
]

export const mockSavedLocations: SavedLocation[] = [
  {
    id: '1',
    name: 'Hotel Metropole',
    lat: 21.0245,
    lng: 105.8532,
  },
  {
    id: '2',
    name: 'Family Home',
    lat: 20.9101,
    lng: 107.1839,
  },
]

export const riskZones = [
  {
    id: 'zone-1',
    name: 'Ha Long Bay Storm Zone',
    lat: 20.9101,
    lng: 107.1839,
    severity: 'high' as Severity,
  },
  {
    id: 'zone-2',
    name: 'Sapa Flood Risk',
    lat: 22.3364,
    lng: 103.8438,
    severity: 'medium' as Severity,
  },
  {
    id: 'zone-3',
    name: 'Hanoi Heat Zone',
    lat: 21.0285,
    lng: 105.8542,
    severity: 'low' as Severity,
  },
  {
    id: 'zone-4',
    name: 'Da Nang Safe Zone',
    lat: 16.0544,
    lng: 108.2022,
    severity: 'safe' as Severity,
  },
]