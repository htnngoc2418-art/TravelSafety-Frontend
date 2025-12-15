# 📱 API ENDPOINTS

**Total: 90 Endpoints** | **Updated: Nov 25, 2025**

---

## 📋 ALL ENDPOINTS

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| **AUTHENTICATION (8)** |
| 1 | POST | `/api/auth/signup` | Register new user |
| 2 | POST | `/api/auth/signin` | User login |
| 3 | POST | `/api/auth/send-verification` | Send email verification code |
| 4 | POST | `/api/auth/verify-email` | Verify email with code |
| 5 | POST | `/api/auth/refresh-token` | Refresh JWT token |
| 6 | POST | `/api/auth/logout` | User logout |
| 7 | GET | `/api/auth/check-email` | Check email availability |
| 8 | GET | `/api/auth/me` | Get current user info |
| **ALERTS (4)** |
| 9 | GET | `/api/alerts` | Get all alerts |
| 10 | GET | `/api/alerts/{id}` | Get alert by ID |
| 11 | PATCH | `/api/alerts/{id}/read` | Mark alert as read |
| 12 | GET | `/api/alerts/unread/count` | Get unread count |
| **NOTIFICATIONS (8)** |
| 13 | GET | `/api/notifications` | Get all notifications |
| 14 | PATCH | `/api/notifications/{id}/read` | Mark notification as read |
| 15 | PATCH | `/api/notifications/read-all` | Mark all as read |
| 16 | DELETE | `/api/notifications/{id}` | Delete notification |
| 17 | DELETE | `/api/notifications` | Clear all notifications |
| 18 | GET | `/api/notifications/unread/count` | Get unread count |
| **PRIVACY (9)** |
| 19 | GET | `/api/privacy/policy` | Get privacy policy |
| 20 | GET | `/api/privacy/user-data` | Get all user data |
| 21 | POST | `/api/privacy/export-data` | Export user data |
| 22 | DELETE | `/api/privacy/account` | Delete account |
| 23 | DELETE | `/api/privacy/location-history` | Delete location history |
| 24 | GET | `/api/privacy/preferences` | Get privacy preferences |
| 25 | PATCH | `/api/privacy/preferences` | Update privacy preferences |
| 26 | POST | `/api/privacy/request-deletion` | Request data deletion |
| 27 | PATCH | `/api/privacy/opt-out` | Opt-out of tracking |
| **PROFILE (12)** |
| 28 | GET | `/api/profile` | Get user profile |
| 29 | PATCH | `/api/profile` | Update profile |
| 30 | POST | `/api/profile/avatar` | Upload avatar |
| 31 | GET | `/api/profile/emergency-contacts` | Get emergency contacts |
| 32 | POST | `/api/profile/emergency-contacts` | Add emergency contact |
| 33 | PATCH | `/api/profile/emergency-contacts/{id}` | Update emergency contact |
| 34 | DELETE | `/api/profile/emergency-contacts/{id}` | Delete emergency contact |
| 35 | GET | `/api/profile/saved-locations` | Get saved locations |
| 36 | POST | `/api/profile/saved-locations` | Add saved location |
| 37 | PATCH | `/api/profile/saved-locations/{id}` | Update saved location |
| 38 | DELETE | `/api/profile/saved-locations/{id}` | Delete saved location |
| 39 | PATCH | `/api/profile/change-password` | Change password |
| **SETTINGS (9)** |
| 40 | GET | `/api/settings` | Get user settings |
| 41 | PATCH | `/api/settings` | Update settings |
| 42 | PATCH | `/api/settings/language` | Set language |
| 43 | PATCH | `/api/settings/dark-mode` | Toggle dark mode |
| 44 | PATCH | `/api/settings/offline-mode` | Toggle offline mode |
| 45 | PATCH | `/api/settings/notifications` | Toggle notifications |
| 46 | PATCH | `/api/settings/notification-preferences` | Update notification prefs |
| 47 | GET | `/api/settings/languages` | Get available languages |
| 48 | POST | `/api/settings/reset` | Reset to defaults |
| **HISTORY (4)** |
| 49 | GET | `/api/history/alerts` | Get alert history |
| 50 | GET | `/api/history/sos` | Get SOS history |
| 51 | DELETE | `/api/history/alerts` | Clear alert history |
| 52 | DELETE | `/api/history/sos` | Clear SOS history |
| **WEATHER (3)** |
| 53 | GET | `/api/weather` | Get current weather |
| 54 | GET | `/api/weather/forecast` | Get weather forecast |
| 55 | GET | `/api/weather/alerts` | Get weather alerts |
| **LOCATION (4)** |
| 56 | GET | `/api/location/provinces` | Get all provinces |
| 57 | GET | `/api/location/areas` | Get areas by province |
| 58 | GET | `/api/location/search` | Search locations |
| 59 | GET | `/api/location/nearest` | Get nearest location |
| **RISK ZONES (8)** |
| 60 | GET | `/api/risk-zones` | Get all risk zones |
| 61 | GET | `/api/risk-zones/{id}` | Get zone details |
| 62 | GET | `/api/risk-zones/bounds` | Get zones by bounds |
| 63 | GET | `/api/risk-zones/search` | Search zones |
| 64 | GET | `/api/risk-zones/statistics` | Get zone statistics |
| 65 | GET | `/api/risk-zones/{id}/timeline` | Get zone timeline |
| 66 | GET | `/api/risk-zones/by-coords` | Get zone by coordinates |
| 67 | GET | `/api/risk-zones/legend` | Get map legend |
| **OFFLINE (10)** |
| 68 | GET | `/api/offline/status` | Get offline sync status |
| 69 | GET | `/api/offline/data` | Get cached data list |
| 70 | POST | `/api/offline/sync` | Start sync |
| 71 | GET | `/api/offline/sync/progress` | Get sync progress |
| 72 | POST | `/api/offline/download` | Download package |
| 73 | DELETE | `/api/offline/cache` | Clear cache |
| 74 | GET | `/api/offline/maps` | Get map tiles |
| 75 | GET | `/api/offline/alerts` | Get offline alerts |
| 76 | GET | `/api/offline/risk-zones` | Get offline zones |
| 77 | PATCH | `/api/offline/mode` | Toggle offline mode |
| **SOS (9)** |
| 78 | POST | `/api/sos/trigger` | Trigger SOS alert |
| 79 | GET | `/api/sos/{sosId}/status` | Get SOS status |
| 80 | POST | `/api/sos/{sosId}/cancel` | Cancel SOS |
| 81 | GET | `/api/sos/history` | Get SOS history |
| 82 | POST | `/api/sos/{sosId}/notify-contacts` | Notify contacts |
| 83 | GET | `/api/sos/hotlines` | Get emergency hotlines |
| 84 | GET | `/api/sos/nearby-services` | Get nearby services |
| 85 | PATCH | `/api/sos/{sosId}/message` | Send update message |
| 86 | POST | `/api/sos/{sosId}/report-false` | Report false SOS |
| **HELP (2)** |
| 87 | GET | `/api/help` | Get help content |
| 88 | GET | `/api/help/privacy-policy` | Get privacy policy |

---

## 📊 SUMMARY

| Category | Count |
|----------|-------|
| Authentication | 8 |
| Alerts | 4 |
| Notifications | 8 |
| Privacy | 9 |
| Profile | 12 |
| Settings | 9 |
| History | 4 |
| Weather | 3 |
| Location | 4 |
| Risk Zones | 8 |
| Offline | 10 |
| SOS | 9 |
| Help | 2 |
| **TOTAL** | **90** |

---

## 🔐 AUTH

- **Header**: `Authorization: Bearer {token}`
- **Token Expiry**: 24h
- **Refresh Token**: 30 days

---

## 🚀 BASE URL

- **Dev**: `http://localhost:5000`
- **Prod**: `https://api.travelsafety.com`

---

## 📝 ERROR CODES

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

**END** ✅
