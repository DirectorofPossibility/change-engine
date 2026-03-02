import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Exchange — The Change Engine',
  description: 'Community Exchange: Houston civic data, organized by pathways and centers.',
}

export default function CircleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
