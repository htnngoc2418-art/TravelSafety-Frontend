const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-safety-backend.onrender.com"

export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number: string
}

export interface SignInData {
  email: string
  password: string
}

export interface User {
  user_id: number
  email: string
  first_name: string
  last_name: string
  phone_number: string
  created_at: string
}

export interface AuthResponse {
  success: boolean
  message: string
  access_token?: string
  user?: User
}

export interface ErrorResponse {
  detail: string
}

// Đăng ký
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.detail || "Registration failed")
    }
    
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Cannot connect to server. Please check backend is running.")
  }
}

// Đăng nhập
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.detail || "Login failed")
    }
    
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Cannot connect to server. Please check backend is running.")
  }
}

// Đăng xuất
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Lấy thông tin user hiện tại
export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    throw new Error("Failed to get user info")
  }
  
  const result = await response.json()
  return result.user
}
