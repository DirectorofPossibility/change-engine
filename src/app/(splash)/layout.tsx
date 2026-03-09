import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Change Engine — Coming Soon',
  description: 'A civic platform connecting Houston neighbors with resources, services, and civic participation opportunities. Coming soon.',
}

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  return children
}
