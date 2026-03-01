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
