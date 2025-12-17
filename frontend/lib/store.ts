"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "vi";
export type Severity = "high" | "medium" | "low" | "safe";

const generateUniqueId = () => {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: Date;
  location: string;
  lat: number;
  lng: number;
  read: boolean;
  category: "weather" | "disaster" | "advisory";
}

export interface SOSEvent {
  id: string;
  timestamp: Date;
  location: string;
  status: "sent" | "pending" | "failed";
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation_type: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  created_at: string;
  medical_info?: string;
}

interface AppState {
  // Authentication
  user: User | null;
  authToken: string | null;
  language: Language;
  isDarkMode: boolean;
  offlineMode: boolean;
  notifications: boolean;
  hasSeenOnboarding: boolean;
  alerts: Alert[];
  sosHistory: SOSEvent[];
  emergencyContacts: EmergencyContact[];
  savedLocations: SavedLocation[];
  userLocation: { lat: number; lng: number } | null;
  safetyScore: number;
  medicalInfo: string;
  wsConnected: boolean;
    activePopup: Alert | null;
  showAlertPopup: (alert: Alert) => void;
  hideAlertPopup: () => void;
  setWsConnected: (connected: boolean) => void;
  setUser: (user: User | null) => void;
  setMedicalInfo: (info: string) => void;
  setAuthToken: (token: string | null) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  setDarkMode: (isDarkMode: boolean) => void;
  toggleDarkMode: () => void;
  toggleOfflineMode: () => void;
  toggleNotifications: () => void;
  completeOnboarding: () => void;
  addAlert: (alert: Alert) => void;
  markAlertAsRead: (id: string) => void;
  addSOSEvent: (event: SOSEvent) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (id: string) => void;
  addSavedLocation: (location: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;
  setUserLocation: (location: { lat: number; lng: number }) => void;
  setSafetyScore: (score: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Authentication state
      user: null,
      authToken: null,
      wsConnected: false,
      setWsConnected: (connected: boolean) =>
        set({ wsConnected: connected }),
      language: "en",
      isDarkMode: false,
      offlineMode: false,
      notifications: true,
      hasSeenOnboarding: false,
      alerts: [
        {
          id: generateUniqueId(),
          title: "Severe Storm Warning",
          description: "A severe thunderstorm is approaching your area",
          severity: "high",
          timestamp: new Date(),
          location: "Hanoi, Vietnam",
          lat: 21.0285,
          lng: 105.8542,
          read: false,
          category: "weather",
        },
        {
          id: generateUniqueId(),
          title: "Flash Flood Alert",
          description: "Flash flooding possible in low-lying areas",
          severity: "medium",
          timestamp: new Date(Date.now() - 3600000),
          location: "Da Nang, Vietnam",
          lat: 16.0544,
          lng: 108.2022,
          read: false,
          category: "disaster",
        },
        {
          id: generateUniqueId(),
          title: "Wind Advisory",
          description: "Strong winds expected this afternoon",
          severity: "low",
          timestamp: new Date(Date.now() - 7200000),
          location: "Ho Chi Minh City, Vietnam",
          lat: 10.7769,
          lng: 106.7009,
          read: true,
          category: "advisory",
        },
      ],
      sosHistory: [],
      emergencyContacts: [],
      savedLocations: [],
      userLocation: null,
      safetyScore: 85,
      medicalInfo: "",
      activePopup: null,

      showAlertPopup: (alert) =>
        set({ activePopup: alert }),

      hideAlertPopup: () =>
        set({ activePopup: null }),
      // User Actions
      setUser: (user) => set({ user }),
      setMedicalInfo: (info) => set({ medicalInfo: info }),
      setAuthToken: (token) => set({ authToken: token }),
      logout: () =>
        set({
          user: null,
          authToken: null,
          hasSeenOnboarding: false,
          emergencyContacts: [],
          savedLocations: [],
          sosHistory: [],
          medicalInfo: "",
        }),

      setLanguage: (lang) => set({ language: lang }),
      setDarkMode: (isDarkMode) => set({ isDarkMode }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleOfflineMode: () =>
        set((state) => ({ offlineMode: !state.offlineMode })),
      toggleNotifications: () =>
        set((state) => ({ notifications: !state.notifications })),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      markAlertAsRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, read: true } : a
          ),
        })),
      addSOSEvent: (event) =>
        set((state) => ({ sosHistory: [event, ...state.sosHistory] })),
      addEmergencyContact: (contact) =>
        set((state) => ({
          emergencyContacts: [...state.emergencyContacts, contact],
        })),
      removeEmergencyContact: (id) =>
        set((state) => ({
          emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
        })),
      addSavedLocation: (location) =>
        set((state) => ({
          savedLocations: [...state.savedLocations, location],
        })),
      removeSavedLocation: (id) =>
        set((state) => ({
          savedLocations: state.savedLocations.filter((l) => l.id !== id),
        })),
      setUserLocation: (location) => set({ userLocation: location }),
      setSafetyScore: (score) => set({ safetyScore: score }),
    }),
    {
      name: "travel-safety-storage",
    }
  )
);