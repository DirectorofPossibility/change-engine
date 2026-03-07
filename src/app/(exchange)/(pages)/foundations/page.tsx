import { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
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
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">The foundations funding Houston — all in one place.</h1>
        <WayfinderTooltipPos tipKey="foundation_galaxy" position="bottom" />
        <p className="text-brand-muted max-w-2xl">
          Houston has one of the most generous philanthropic communities in the country. Health. Education. Housing. Arts. Civic life. There are hundreds of foundations working on all of it. Most people never know they exist. This page changes that.
        </p>
      </div>
      <FoundationsGalaxy />
    </div>
  )
}
