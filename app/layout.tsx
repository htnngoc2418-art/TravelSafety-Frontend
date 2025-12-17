import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { GlobalRiskMonitor } from '../components/global-risk-monitor'

// Cấu hình font Geist
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Travel Safety System with Weather and Disaster Warnings',
  description: 'Real-time weather and disaster warnings for travelers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SafeTravel',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* [SỬA LẠI] Dùng _geist.className thay vì inter.className */}
          <body className={`${_geist.className} antialiased`}>
              {children}
              <GlobalRiskMonitor />
              <Analytics />

              <script
                  dangerouslySetInnerHTML={{
                      __html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js')
              .then(function (reg) {
                console.log('[SW] Registered:', reg.scope);
              })
              .catch(function (err) {
                console.error('[SW] Register failed:', err);
              });
          });
        }
      `,
                  }}
              />
          </body>
    </html>
  )
}