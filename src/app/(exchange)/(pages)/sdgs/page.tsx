import type { Metadata } from 'next'
import { getSDGDashboard } from '@/lib/data/taxonomy'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { SDGExplorer } from './SDGExplorer'

export const metadata: Metadata = {
  title: 'UN Sustainable Development Goals | Change Engine',
  description: 'Explore how Houston connects to the 17 UN Sustainable Development Goals — browse local content, services, policies, and officials linked to each global goal.',
}

export const revalidate = 3600

export default async function SDGsPage() {
  const { goals, totals } = await getSDGDashboard()

  const totalLinked = totals.content + totals.services + totals.policies + totals.officials + totals.organizations + totals.opportunities
  const activeGoals = goals.filter(function (g) {
    return g.counts.content + g.counts.services + g.counts.policies + g.counts.officials + g.counts.organizations + g.counts.opportunities > 0
  }).length

  return (
    <div>
      <IndexPageHero
        title="Global Goals, Local Action"
        subtitle="The 17 UN Sustainable Development Goals mapped to Houston's civic ecosystem"
        intro="Every service, policy, news story, and elected official in the Change Engine is classified against the UN SDGs. See how your community connects to the global agenda."
        color="#1b5e8a"
        stats={[
          { value: 17, label: 'UN Goals' },
          { value: activeGoals, label: 'Active Locally' },
          { value: totalLinked, label: 'Linked Items' },
        ]}
      />

      {/* Editorial Context */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">
              What Are the SDGs?
            </h2>
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                The Sustainable Development Goals are 17 interconnected objectives adopted by all United Nations member states in 2015. They provide a shared blueprint for peace and prosperity — for people and the planet — through 2030.
              </p>
              <p>
                They range from ending poverty and hunger, to ensuring quality education and clean water, to building sustainable cities and fighting climate change. The goals recognize that ending poverty must go hand-in-hand with strategies that improve health and education, reduce inequality, and spur economic growth.
              </p>
              <p>
                Here in Houston, these global goals show up in local action — in the services our nonprofits provide, the policies our elected officials champion, and the stories our communities tell. The Change Engine maps every piece of civic content against these goals so you can see how local work connects to global ambitions.
              </p>
            </div>
          </div>
          <div className="bg-paper border border-rule p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">How We Map SDGs</h3>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-ink text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <p>Content enters the pipeline — news articles, services, policies, officials</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-ink text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <p>AI classifies each item across 16 taxonomy dimensions, including SDGs</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-ink text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <p>Junction tables link every entity to relevant SDGs for cross-referencing</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-ink text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <p>You explore the connections below — click any goal to see what's linked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Explorer */}
      <SDGExplorer goals={goals} />
    </div>
  )
}
