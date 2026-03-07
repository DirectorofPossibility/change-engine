import { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import FoundationsGalaxy from './FoundationsGalaxy'

export const metadata: Metadata = {
  title: 'Foundations Galaxy | Community Exchange',
  description: 'Explore Houston-area foundations through an interactive galaxy visualization — discover funding, focus areas, and connections across seven community pathways.',
}

export default function FoundationsPage() {
  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[
          { label: 'Foundations' }
        ]} />
      </div>
      <FoundationsGalaxy />
    </div>
  )
}
