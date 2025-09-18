import type { Metadata } from 'next'
import { Raleway, Krub } from 'next/font/google'
import './globals.css'
import '../styles/locomotive-scroll.css'
import { Providers } from './providers'
import { LocomotiveScrollProvider } from '@/components/LocomotiveScrollProvider'
import { PreloaderWrapper } from '@/components/ui/PreloaderWrapper'

const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway'
})

const krub = Krub({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-krub'
})

export const metadata: Metadata = {
  title: 'Ocean',
  description: 'Advanced oceanographic data visualization powered by Argovis API and AI',
  keywords: 'ocean data, argovis, visualization, oceanography, AI analysis',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${raleway.variable} ${krub.variable}`}>
      <body className="font-krub antialiased">
        <Providers>
          <PreloaderWrapper>
            <LocomotiveScrollProvider
              options={{
                smooth: true,
                multiplier: 1,
                inertia: 0.8,
                tablet: { smooth: false },
                smartphone: { smooth: false }
              }}
            >
              {children}
            </LocomotiveScrollProvider>
          </PreloaderWrapper>
        </Providers>
      </body>
    </html>
  )
}
