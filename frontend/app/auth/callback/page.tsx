"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStore } from "../../../lib/store"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeOnboarding, setAuthToken, setUser } = useStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')
    
    if (error) {
      console.error('OAuth error:', error)
      router.push('/onboarding?error=' + encodeURIComponent(error))
      return
    }
    
    if (token) {
      // Lưu token vào store
      setAuthToken(token)
      
      // Fetch user info from backend
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://travel-safety-backend.onrender.com'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user)
            completeOnboarding()
            router.push('/home')
          } else {
            throw new Error('Failed to get user info')
          }
        })
        .catch(err => {
          console.error('Error fetching user:', err)
          router.push('/onboarding?error=Failed to complete login')
        })
    } else {
      // Nếu không có token, quay về login
      router.push('/onboarding')
    }
  }, [searchParams, router, completeOnboarding, setAuthToken, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900 to-blue-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Completing login...</p>
        <p className="text-sm text-white/70 mt-2">Please wait</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900 to-blue-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
