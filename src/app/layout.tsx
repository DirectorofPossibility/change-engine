import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display, Caveat, Space_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
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

const hand = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  display: 'swap',
})

const mono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
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
    canonical: 'https://www.changeengine.us',
    languages: {
      'en': 'https://www.changeengine.us',
      'es': 'https://www.changeengine.us',
      'vi': 'https://www.changeengine.us',
      'x-default': 'https://www.changeengine.us',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
}

const LANG_MAP: Record<string, string> = { en: 'en', es: 'es', vi: 'vi' }

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const lang = LANG_MAP[cookieStore.get('lang')?.value ?? ''] ?? 'en'

  return (
    <html lang={lang} className={`${sans.variable} ${serif.variable} ${hand.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
