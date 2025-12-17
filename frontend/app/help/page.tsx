'use client'

import { Card } from '../../components/ui/card'
import { BottomNav } from '../../components/bottom-nav'
import { Info, Phone, Lightbulb, Shield, ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useTranslation } from '../../lib/translations'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HelpPage() {
  const router = useRouter()
  const language = useStore((state) => state.language)
  const t = useTranslation(language)
  
  const emergencyNumbers = [
    { country: t.vietnam, police: '113', ambulance: '115', fire: '114' },
    { country: t.international, police: '112', ambulance: '112', fire: '112' },
  ]
  
  const safetyTips = [
    t.safetyTip1,
    t.safetyTip2,
    t.safetyTip3,
    t.safetyTip4,
    t.safetyTip5,
    t.safetyTip6,
  ]
  const isDarkMode = useStore((state) => state.isDarkMode)
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="Background" fill className="object-cover" priority />
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/30'}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-sans flex-1">{t.help}</h1>
          </div>
          
          {/* About Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t.about}</h2>
            </div>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-white">
              <h3 className="font-semibold mb-2 text-white">{t.intelligentTravelSafety}</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {t.aboutDescription}
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/60">{t.version}</p>
                <p className="text-xs text-white/60">{t.copyright}</p>
              </div>
            </Card>
          </div>
          
          {/* Emergency Numbers */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t.emergencyNumbers}</h2>
            </div>
            {emergencyNumbers.map((region) => (
              <Card key={region.country} className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-white">
                <h3 className="font-semibold mb-3 text-white">{region.country}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t.police}</span>
                    <a href={`tel:${region.police}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.police}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t.ambulance}</span>
                    <a href={`tel:${region.ambulance}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.ambulance}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{t.fireDepartment}</span>
                    <a href={`tel:${region.fire}`} className="font-mono font-semibold text-primary hover:text-primary/80">
                      {region.fire}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Safety Tips */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{t.safetyTips}</h2>
            </div>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-white">
              <ul className="space-y-3">
                {safetyTips.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-white">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          
          {/* Privacy Policy Link */}
          <Card
            className="bg-black/40 backdrop-blur-md rounded-2xl border-white/10 p-6 cursor-pointer hover:bg-black/50 transition-colors"
            onClick={() => router.push('/privacy')}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 font-medium text-white">{t.privacyPolicy}</span>
              <ChevronRight className="h-5 w-5 text-white/60" />
            </div>
          </Card>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}