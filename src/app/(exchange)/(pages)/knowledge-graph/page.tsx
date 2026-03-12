import type { Metadata } from 'next'
import { getCircleGraphData } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

export const metadata: Metadata = {
  title: 'Civic Knowledge Graph — Community Exchange',
  description: 'Explore the Civic Knowledge Graph: 7 pathways, hundreds of focus areas, and thousands of connected entities across Houston.',
}

export const revalidate = 300

export default async function KnowledgeGraphPage() {
  const data = await getCircleGraphData()

  return (
    <div className="min-h-screen bg-brand-bg">
      <SpiralTracker action="explore_knowledge_graph" />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb items={[{ label: 'Knowledge Graph' }]} />
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-sm font-semibold text-brand-accent mb-2">Everything in Houston civic life is connected. Nobody was showing you how.</p>
        <h1 className="text-3xl font-display font-bold text-brand-text mb-1">The Civic Knowledge Galaxy.</h1>
        <p className="text-sm font-semibold text-brand-muted mb-3">Not a list. Not a directory. A living map of how it all fits together.</p>
        <div className="text-brand-muted max-w-2xl space-y-3 mb-6">
          <p>
            A city council vote affects a neighborhood. A nonprofit serves families in that neighborhood. A foundation funds the nonprofit. A state law shapes what the foundation can do.
          </p>
          <p>Those connections are real. Until now, nobody was showing them to you.</p>
          <p>We built a knowledge graph — 174 tables, 16 types of entities, updated every day — that maps all of it.</p>
        </div>
        <div className="max-w-2xl mb-6">
          <h2 className="text-lg font-display font-bold text-brand-text mb-3">What's Connected</h2>
          <ul className="space-y-2 text-brand-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Officials</strong> — who represents you, how they vote, and what they prioritize.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Services</strong> — what's available, who provides it, and how to access it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Organizations</strong> — nonprofits, agencies, and community groups doing the work.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Policies</strong> — legislation, ordinances, and regulations that shape your daily life.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">Opportunities</strong> — ways to get involved, volunteer, and take action.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
              <span><strong className="text-brand-text">News</strong> — what's happening now, connected to everything above.</span>
            </li>
          </ul>
        </div>
        <p className="text-brand-muted max-w-2xl mb-4 italic">
          Most platforms show you one thing. We show you how everything connects. That's the difference between a list and a map.
        </p>
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <CircleKnowledgeGraph data={data} />
      </div>
    </div>
  )
}
