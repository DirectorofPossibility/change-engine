import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const serif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.changeengine.us'),
  title: {
    default: 'Community Exchange — Powered by The Change Lab',
    template: '%s | Community Exchange',
  },
  description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
  openGraph: {
    siteName: 'Community Exchange',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Community Exchange — Powered by The Change Lab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Exchange — Powered by The Change Lab',
    description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
    images: ['/images/og-image.png'],
  },
  alternates: {
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
