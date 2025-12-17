import PastHazards from '@/components/PastHazards';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import Image from 'next/image';

export const metadata = {
  title: 'Thống Kê Thiên Tai | Vietnam Disaster Prediction',
  description: 'Xem thống kê các thiên tai đã xảy ra trong 2024-2025',
};

export default function PastHazardsPage() {
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/images/background-storm.jpg" alt="BG" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="bg-black/40 backdrop-blur-lg p-4 rounded-3xl border border-white/10 max-w-7xl w-full mx-auto">
          <main>
            <PastHazards />
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
