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
        <p className="text-sm font-semibold text-brand-accent mb-2">Billions of dollars are invested in Houston every year. Most residents have no idea.</p>
        <h1 className="text-3xl font-serif font-bold text-brand-text mb-1">The foundations funding Houston — all in one place.</h1>
        <WayfinderTooltipPos tipKey="foundation_galaxy" position="bottom" />
        <p className="text-sm font-semibold text-brand-muted mb-3">They fund the work. We make it findable.</p>
        <div className="text-brand-muted max-w-2xl space-y-3 mb-6">
          <p>
            Houston has one of the most generous philanthropic communities in the country. Health. Education. Housing. Arts. Civic life. There are hundreds of foundations working on all of it.
          </p>
          <p>Most people never know they exist.</p>
          <p>This page changes that.</p>
        </div>
        <div className="max-w-2xl mb-6">
          <h2 className="text-lg font-serif font-bold text-brand-text mb-3">What You Can Do</h2>
          <ul className="space-y-2 text-brand-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Find foundations working on what you care about.</strong> Browse by issue area.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">See who they fund.</strong> Connect the dots between money and mission.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Understand the landscape.</strong> Whether you're a nonprofit, a researcher, or just curious — start here.</span>
            </li>
          </ul>
        </div>
      </div>
      <FoundationsGalaxy />
    </div>
  )
}
