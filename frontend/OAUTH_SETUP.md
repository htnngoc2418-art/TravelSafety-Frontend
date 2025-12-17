# ⚙️ CẤU HÌNH OAUTH - BACKEND

## 📝 Tạo file `.env` trong folder backend:

```env
# Google OAuth (Lấy từ Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Facebook OAuth (Lấy từ Facebook Developers)
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here

# Application Settings
APP_SECRET_KEY=your_random_secret_key_here_change_this_in_production
FRONTEND_URL=http://localhost:3000
```

## 🔑 Lấy Google Credentials:

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. **Application type**: Web application
6. **Authorized redirect URIs**:
   - `http://127.0.0.1:8000/api/auth/google/callback`
   - `http://localhost:8000/api/auth/google/callback`
7. Copy **Client ID** và **Client Secret** vào `.env`

## 📘 Lấy Facebook Credentials:

1. Truy cập: https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Chọn **Consumer** → Nhập tên app
4. Vào **Settings** → **Basic**
5. Copy **App ID** → Paste vào `FACEBOOK_CLIENT_ID`
6. Copy **App Secret** → Paste vào `FACEBOOK_CLIENT_SECRET`
7. Vào **Facebook Login** → **Settings**
8. **Valid OAuth Redirect URIs**:
   - `http://127.0.0.1:8000/api/auth/facebook/callback`
   - `http://localhost:8000/api/auth/facebook/callback`
9. Bật **Client OAuth Login** và **Web OAuth Login**

## ✅ Đã có trong backend:
- ✅ `oauth_config.py` - Cấu hình OAuth
- ✅ `auth_utils.py` - Xử lý OAuth users
- ✅ Endpoints trong `Test.py`

## 🚀 Chạy:
```bash
python Test.py
```

Server chạy tại: http://127.0.0.1:8000
