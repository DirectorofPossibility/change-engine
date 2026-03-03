import { Metadata } from 'next'
import FoundationsKnowledgeGraph from './FoundationsKnowledgeGraph'

export const metadata: Metadata = {
  title: 'Foundations | The Change Engine',
  description: 'Explore the foundations knowledge graph — search by name, city, focus area, ZIP code, pathway, and geographic level.',
}

export default function FoundationsPage() {
  return <FoundationsKnowledgeGraph />
}
