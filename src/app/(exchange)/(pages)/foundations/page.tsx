import { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import FoundationsGalaxy from './FoundationsGalaxy'

export const metadata: Metadata = {
  title: 'Foundations Galaxy | Community Exchange',
  description: 'Explore Houston-area foundations through an interactive galaxy visualization — discover funding, focus areas, and connections across seven community pathways.',
}

export default function FoundationsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[
          { label: 'Foundations' }
        ]} />
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">Foundations Galaxy</h1>
        <p className="text-brand-muted max-w-2xl">
          Explore Houston-area foundations through an interactive galaxy. Each star represents a foundation, sized by grant-making capacity and colored by primary pathway. Search by name, city, or ZIP to find funders in your area.
        </p>
      </div>
      <FoundationsGalaxy />
    </div>
  )
}
