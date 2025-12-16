"use client";
import axios from 'axios';
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 🔴 LINK BACKEND (Giữ nguyên link của bạn)
const API_BASE = "https://travel-safety-backend.onrender.com/api/v1/profile";

export type Language = "en" | "vi";
export type Severity = "high" | "medium" | "low" | "safe";

// ✅ 1. SỬA LỖI BACKTICK: Dùng dấu huyền (`) để bao quanh chuỗi có biến
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

// ✅ 2. SỬA INTERFACE: Khớp 100% với Backend (address, latitude, longitude)
export interface SavedLocation {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
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
    // States
    user: any;
    authToken: string | null;
    wsConnected: boolean;
    language: string;
    isDarkMode: boolean;
    offlineMode: boolean;
    notifications: boolean;
    hasSeenOnboarding: boolean;
    alerts: any[];
    sosHistory: any[];
    emergencyContacts: any[];
    savedLocations: any[]; // Để any tạm thời cho dễ tương thích
    userLocation: any;
    safetyScore: number;
    medicalInfo: string;
    activePopup: any;

    // Actions
    setWsConnected: (connected: boolean) => void;
    showAlertPopup: (alert: any) => void;
    hideAlertPopup: () => void;
    setUser: (user: any) => void;
    setAuthToken: (token: string | null) => void;
    setLanguage: (lang: string) => void;
    setDarkMode: (isDark: boolean) => void;
    toggleDarkMode: () => void;
    toggleOfflineMode: () => void;
    toggleNotifications: () => void;
    completeOnboarding: () => void;
    setUserLocation: (location: any) => void;
    setSafetyScore: (score: number) => void;

    // Async Actions
    setMedicalInfo: (info: string) => Promise<void>;
    addEmergencyContact: (contact: any) => Promise<void>;
    addSavedLocation: (location: any) => Promise<void>;
    addSOSEvent: (event: any) => Promise<void>;

    // Helper Actions
    removeEmergencyContact: (id: string | number) => void;
    removeSavedLocation: (id: string | number) => void;
    logout: () => void;
}

// ✅ 3. TẠO STORE: Đã sửa lỗi cú pháp axios
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // --- States ---
            user: null,
            authToken: null,
            wsConnected: false,
            language: "en",
            isDarkMode: false,
            offlineMode: false,
            notifications: true,
            hasSeenOnboarding: false,
            alerts: [],
            sosHistory: [],
            emergencyContacts: [],
            savedLocations: [],
            userLocation: null,
            safetyScore: 85,
            medicalInfo: "",
            activePopup: null,

            // --- Actions ---
            setWsConnected: (connected) => set({ wsConnected: connected }),
            showAlertPopup: (alert) => set({ activePopup: alert }),
            hideAlertPopup: () => set({ activePopup: null }),
            setUser: (user) => set({ user }),
            setAuthToken: (token) => set({ authToken: token }),
            setLanguage: (lang) => set({ language: lang }),
            setDarkMode: (isDarkMode) => set({ isDarkMode }),
            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            toggleOfflineMode: () => set((state) => ({ offlineMode: !state.offlineMode })),
            toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            setUserLocation: (location) => set({ userLocation: location }),
            setSafetyScore: (score) => set({ safetyScore: score }),

            // --- Async Actions (API) ---

            // 1. CẬP NHẬT THÔNG TIN Y TẾ
            setMedicalInfo: async (info) => {
                try {
                    set({ medicalInfo: info });
                } catch (error) {
                    console.error("Lỗi cập nhật y tế:", error);
                }
            },

            // 2. THÊM LIÊN HỆ KHẨN CẤP
            addEmergencyContact: async (contact) => {
                try {
                    console.log("🚀 Đang gửi liên hệ lên Backend...");

                    // LƯU Ý: Dùng dấu huyền (`) để bao quanh URL
                    const response = await axios.post(`${API_BASE}/contacts`, {
                        name: contact.name,
                        phone: contact.phone,
                        relation_type: contact.relation_type || "Người thân"
                    }, { withCredentials: true });

                    if (response.status === 200 || response.status === 201) {
                        set((state) => ({
                            emergencyContacts: [...state.emergencyContacts, contact],
                        }));
                        console.log("✅ Đã lưu vào PostgreSQL!");
                    }
                } catch (error: any) {
                    console.error("❌ Lỗi API contacts:", error.response?.data || error.message);
                    alert("Lỗi lưu liên hệ: " + (error.response?.data?.detail || "Vui lòng đăng nhập lại"));
                }
            },

            // 3. THÊM VỊ TRÍ ĐÃ LƯU
            addSavedLocation: async (location) => {
                try {
                    console.log("🚀 Đang gửi vị trí lên Backend...");

                    // LƯU Ý: Dùng dấu huyền (`) và sửa tên biến latitude/longitude
                    const response = await axios.post(`${API_BASE}/locations`, {
                        name: location.name,
                        address: location.address || "Chưa có địa chỉ",
                        latitude: parseFloat(location.latitude),
                        longitude: parseFloat(location.longitude)
                    }, { withCredentials: true });

                    const newLocation = {
                        ...location,
                        id: response.data?.id || Date.now().toString()
                    };

                    set((state) => ({
                        savedLocations: [...state.savedLocations, newLocation],
                    }));
                    console.log("✅ Đã lưu vị trí vào PostgreSQL!");
                } catch (error) {
                    console.error("❌ Lỗi API locations:", error);
                }
            },

            // 4. GỬI SOS
            addSOSEvent: async (event) => {
                try {
                    await axios.post("https://travel-safety-backend.onrender.com/api/v1/sos/send", {
                        latitude: event.lat,
                        longitude: event.lng,
                        message: "SOS Emergency Request"
                    }, { withCredentials: true });

                    set((state) => ({ sosHistory: [event, ...state.sosHistory] }));
                } catch (error) {
                    console.error("❌ Lỗi gửi SOS API:", error);
                }
            },

            // --- Các hàm bổ trợ ---
            removeEmergencyContact: (id) =>
                set((state) => ({
                    emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
                })),
            removeSavedLocation: (id) =>
                set((state) => ({
                    savedLocations: state.savedLocations.filter((l) => l.id !== id),
                })),
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
        }),
        {
            name: "travel-safety-storage",
        }
    )
);