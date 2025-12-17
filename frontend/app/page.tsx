'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const hasSeenOnboarding = useStore((state) => state.hasSeenOnboarding)
  
  useEffect(() => {
    if (hasSeenOnboarding) {
      router.push('/home')
    } else {
      router.push('/onboarding')
    }
  }, [hasSeenOnboarding, router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
