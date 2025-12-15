"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Checkbox } from "../../components/ui/checkbox"
import { Label } from "../../components/ui/label"
import { useStore } from "../../lib/store"
import { signUp, signIn } from "../../lib/api-auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-safety-backend.onrender.com"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding, setUser, setAuthToken, user, hasSeenOnboarding } = useStore()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user && hasSeenOnboarding) {
      router.push('/home')
    }
  }, [user, hasSeenOnboarding, router])

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = (): boolean => {
    if (mode === "signup") {
      if (!formData.firstName.trim()) {
        setError("First name is required")
        return false
      }
      if (!formData.lastName.trim()) {
        setError("Last name is required")
        return false
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return false
      }
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError("Valid email is required")
      return false
    }
    if (!formData.password.trim()) {
      setError("Password is required")
      return false
    }
    
    return true
  }

  const handleSignUp = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone
      })

      if (result.success && result.access_token && result.user) {
        // Lưu token và user vào store
        setAuthToken(result.access_token)
        setUser(result.user)
        completeOnboarding()
        
        console.log('✅ Registration successful')
        router.push("/home")
      } else {
        setError("Registration failed. Please try again.")
      }
      
    } catch (err) {
      console.error('❌ Registration error:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (result.success && result.access_token && result.user) {
        // Lưu token và user vào store
        setAuthToken(result.access_token)
        setUser(result.user)
        completeOnboarding()
        
        console.log('✅ Login successful')
        router.push("/home")
      } else {
        setError("Login failed. Please try again.")
      }
      
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "signup") {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
    setError("")
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    })
  }

  // OAuth Login handler
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Stormy sea background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay for better text readability if needed, though design shows clear image */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col p-6 md:flex-row md:p-12 lg:p-16">
        
        {/* Header Elements */}
        <div className="absolute left-6 top-6 md:left-12 md:top-12">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-cyan-400/30 bg-cyan-500/20 backdrop-blur-sm">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="absolute right-6 top-6 md:right-12 md:top-12">
          <Link href="/help" className="text-lg font-medium text-white hover:text-cyan-300">
            Help
          </Link>
        </div>

        {/* Left Column - Title */}
        <div className="mt-24 flex flex-1 flex-col justify-center md:mt-0 md:pr-12">
          <h1 className="font-sans text-5xl leading-tight text-[#E8E8D0] drop-shadow-lg md:text-6xl lg:text-7xl">
            Travel Safety System
            <br />
            <span className="text-white">with</span>
            <br />
            Weather and Disaster
            <br />
            Warnings
          </h1>
          
          {/* Decorative lines/dots from design */}
          <div className="mt-12 flex items-center gap-4 opacity-80">
            <div className="h-1 w-16 bg-white" />
            <div className="h-3 w-3 rotate-45 bg-[#E8E8D0]" />
            <div className="h-3 w-3 rotate-45 bg-[#E8E8D0]" />
            <div className="h-1 w-16 bg-white" />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="mt-12 flex flex-1 flex-col justify-center md:mt-0 md:pl-12">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-black/10 p-6 backdrop-blur-sm md:p-8">
            <h2 className="mb-8 text-center font-sans text-4xl text-[#E8E8D0] md:text-5xl">
              {mode === "signup" ? "Sign up" : "Sign in"}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-white animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs text-gray-300">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      className="bg-white text-black placeholder:text-gray-400"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs text-gray-300">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      className="bg-white text-black placeholder:text-gray-400"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-gray-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@gmail.com" 
                  className="bg-white text-black placeholder:text-gray-400"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required 
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs text-gray-300">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="0987654321" 
                    className="bg-white text-black placeholder:text-gray-400"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-gray-300">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Min 6 characters" 
                  className="bg-white text-black placeholder:text-gray-400"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required 
                  minLength={6}
                />
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs text-gray-300">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Re-enter password" 
                      className="bg-white text-black placeholder:text-gray-400"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox id="terms" className="border-white data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white" required />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link 
                        href="/privacy" 
                        className="underline hover:text-cyan-300 transition-colors"
                        target="_blank"
                      >
                        terms & policy
                      </Link>
                    </label>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="mt-4 w-full bg-[#2A8C98] py-6 text-lg font-semibold hover:bg-[#227580]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {mode === "signup" ? "Creating Account..." : "Signing In..."}
                  </span>
                ) : (
                  mode === "signup" ? "Create Account" : "Login"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black/10 px-3 text-white/80 backdrop-blur-sm">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center text-sm">
              {mode === "signup" ? (
                <p>
                  Have an account?{" "}
                  <button 
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-[#E8E8D0] hover:text-white hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-[#E8E8D0] hover:text-white hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
