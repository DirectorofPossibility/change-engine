import { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import FoundationsGalaxy from './FoundationsGalaxy'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

export const metadata: Metadata = {
  title: 'Foundations Galaxy | Community Exchange',
  description: 'Explore Houston-area foundations through an interactive galaxy visualization — discover funding, focus areas, and connections across seven community pathways.',
}

export default function FoundationsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <SpiralTracker action="view_foundation" />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={[
          { label: 'Foundations' }
        ]} />
      </div>
      <IndexPageHero
        title="The foundations funding Houston — all in one place."
        subtitle="They fund the work. We make it findable."
        intro="Houston has one of the most generous philanthropic communities in the country. Health. Education. Housing. Arts. Civic life. There are hundreds of foundations working on all of it. Most people never know they exist. This page changes that."
        color="#C75B2A"
        pattern="metatron"
      />
      <WayfinderTooltipPos tipKey="foundation_galaxy" position="bottom" />
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
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
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder
                currentPage="foundations"
                color="#805ad5"
                related={[
                  { label: 'Organizations', href: '/organizations' },
                  { label: 'Services', href: '/services' },
                  { label: 'Officials', href: '/officials' },
                ]}
              />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
      <FoundationsGalaxy />
    </div>
  )
}
