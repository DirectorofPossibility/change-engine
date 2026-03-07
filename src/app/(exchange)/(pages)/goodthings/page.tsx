import type { Metadata } from 'next'
import { GoodThingsClient } from './GoodThingsClient'

export const metadata: Metadata = {
  title: 'Three Good Things — Community Exchange',
  description: 'Share three good things happening in your community. See positivity from across the map.',
}

export default function GoodThingsPage() {
  return <GoodThingsClient />
}
