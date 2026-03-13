import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getCircleGraphData } from '@/lib/data/exchange'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

export const metadata: Metadata = {
  title: 'Civic Knowledge Graph — Change Engine',
  description: 'Explore the Civic Knowledge Graph: 7 pathways, hundreds of focus areas, and thousands of connected entities across Houston.',
}

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const ENTITIES = [
  { name: 'Officials', desc: 'who represents you, how they vote, and what they prioritize.' },
  { name: 'Services', desc: 'what is available, who provides it, and how to access it.' },
  { name: 'Organizations', desc: 'nonprofits, agencies, and community groups doing the work.' },
  { name: 'Policies', desc: 'legislation, ordinances, and regulations that shape your daily life.' },
  { name: 'Opportunities', desc: 'ways to get involved, volunteer, and take action.' },
  { name: 'News', desc: 'what is happening now, connected to everything above.' },
]

export default async function KnowledgeGraphPage() {
  const data = await getCircleGraphData()

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <SpiralTracker action="explore_knowledge_graph" />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl mb-4">
            The Civic Knowledge Galaxy
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Not a list. Not a directory. A living map of how it all fits together.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Knowledge Graph</span>
        </nav>
      </div>

      {/* Prose */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="space-y-4 mb-8" style={{ color: MUTED }}>
          <p style={{ fontFamily: SERIF, color: CLAY }} className="text-sm font-semibold">
            Everything in Houston civic life is connected. Nobody was showing you how.
          </p>
          <p>
            A city council vote affects a neighborhood. A nonprofit serves families in that neighborhood. A foundation funds the nonprofit. A state law shapes what the foundation can do.
          </p>
          <p>Those connections are real. Until now, nobody was showing them to you.</p>
          <p>We built a knowledge graph -- 174 tables, 16 types of entities, updated every day -- that maps all of it.</p>
        </div>

        {/* What's Connected */}
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">What's Connected</h2>
          <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{ENTITIES.length} entity types</span>
          </div>
          <ul className="space-y-2">
            {ENTITIES.map(function (e) {
              return (
                <li key={e.name} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-2 flex-shrink-0" style={{ background: CLAY }} />
                  <span style={{ color: MUTED }} className="text-sm">
                    <strong style={{ color: INK }}>{e.name}</strong> -- {e.desc}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm italic mb-8">
          Most platforms show you one thing. We show you how everything connects. That's the difference between a list and a map.
        </p>
      </div>

      {/* Graph */}
      <div className="max-w-[1100px] mx-auto px-6 pb-12">
        <CircleKnowledgeGraph data={data} />
      </div>

      {/* Footer */}
      <div className="max-w-[900px] mx-auto px-6 pb-10 text-center">
        <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
          Back to Change Engine
        </Link>
      </div>
    </div>
  )
}
