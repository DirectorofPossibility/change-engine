import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Change Engine — Coming Soon',
  description: 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities. Coming soon.',
}

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  return children
}
