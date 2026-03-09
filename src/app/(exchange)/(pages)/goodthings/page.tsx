import type { Metadata } from 'next'
import { GoodThingsClient } from './GoodThingsClient'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Three Good Things — Community Exchange',
  description: 'Three good things. Every day. Real stories from Houston, updated daily. Because the news isn\'t only bad.',
}

export default function GoodThingsPage() {
  return <GoodThingsClient />
}
