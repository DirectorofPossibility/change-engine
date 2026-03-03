import { Metadata } from 'next'
import FoundationsGalaxy from './FoundationsGalaxy'

export const metadata: Metadata = {
  title: 'Foundations Galaxy | The Change Engine',
  description: 'Explore Houston-area foundations through an interactive galaxy visualization — discover funding, focus areas, and connections across seven community pathways.',
}

export default function FoundationsPage() {
  return <FoundationsGalaxy />
}
