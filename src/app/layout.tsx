import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Change Engine',
  description: 'Community Life, Organized — Houston, TX',
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
