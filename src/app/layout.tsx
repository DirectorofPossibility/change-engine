import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.changeengine.us'),
  title: {
    default: 'The Change Engine — Community Life, Organized',
    template: '%s | The Change Engine',
  },
  description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
  openGraph: {
    siteName: 'The Change Engine',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'The Change Engine — Community Life, Organized' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Change Engine — Community Life, Organized',
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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
