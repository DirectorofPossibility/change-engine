import type { Metadata } from 'next'
import { Fraunces, Libre_Baskerville, DM_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.changeengine.us'),
  title: {
    default: 'Change Engine — Powered by The Change Lab',
    template: '%s | Change Engine',
  },
  description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    siteName: 'Change Engine',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Change Engine — Powered by The Change Lab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change Engine — Powered by The Change Lab',
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
    <html lang={lang} className={`${fraunces.variable} ${libreBaskerville.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
