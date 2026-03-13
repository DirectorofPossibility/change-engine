import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Newspaper, Compass, MessageCircle, Map } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning — Change Engine',
  description: 'Understand your community through research, news, guided pathways, and conversation.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const SECTIONS = [
  {
    href: '/library',
    label: 'Library',
    description: 'Research reports, policy briefs, and deep dives curated from trusted sources across Houston and beyond.',
    icon: BookOpen,
    countKey: 'library',
  },
  {
    href: '/news',
    label: 'News',
    description: 'Local journalism and community reporting -- what is happening right now, organized by the topics you care about.',
    icon: Newspaper,
    countKey: 'news',
  },
  {
    href: '/pathways',
    label: 'Topics',
    description: 'Seven thematic journeys -- health, families, neighborhoods, civic voice, economic mobility, environment, and belonging -- each connecting you to related content, services, and people.',
    icon: Compass,
    countKey: 'pathways',
  },
  {
    href: '/adventures',
    label: 'Community Adventures',
    description: 'Interactive stories where your choices shape the outcome. Navigate a town hall, discover hidden neighborhood assets, or prepare for hurricane season.',
    icon: Map,
    countKey: 'adventures',
  },
  {
    href: '/chat',
    label: 'Ask Chance',
    description: 'Have a question about Houston? Ask Chance, your AI civic guide, and get answers grounded in local data.',
    icon: MessageCircle,
    countKey: null,
  },
]

export default async function LearningIndexPage() {
  const supabase = await createClient()

  const [library, news] = await Promise.all([
    supabase.from('kb_documents' as any).select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const counts: Record<string, number> = {
    library: library.count || 0,
    news: news.count || 0,
    pathways: 7,
    adventures: 3,
  }

  const visible = SECTIONS.slice(0, 4)
  const rest = SECTIONS.slice(4)

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ background: PARCHMENT_WARM }}>
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            Learning
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            Understand what is happening in your community -- and why it matters.
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Learning</span>
        </nav>
      </div>

      {/* ── STATS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-4">
        <div className="flex items-center gap-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1rem' }}>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{counts.library}</strong> Library Documents
          </span>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{counts.news}</strong> Articles &amp; Reports
          </span>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
            <strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>7</strong> Topics
          </span>
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-6">
        <div className="space-y-6">
          {visible.map(function (section) {
            const Icon = section.icon
            const count = section.countKey ? counts[section.countKey] || 0 : 0
            return (
              <Link
                key={section.href}
                href={section.href}
                className="block group"
                style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1.5rem' }}
              >
                <div className="flex items-start gap-4">
                  <Icon size={20} style={{ color: CLAY }} className="flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl group-hover:underline">
                        {section.label}
                      </h2>
                      {count > 0 && (
                        <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
                          {count.toLocaleString()} available
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm leading-relaxed mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {rest.length > 0 && (
          <details className="mt-6">
            <summary style={{ fontFamily: MONO, color: CLAY, cursor: 'pointer' }} className="text-sm hover:underline">
              Show {rest.length} more section{rest.length !== 1 ? 's' : ''}
            </summary>
            <div className="space-y-6 mt-4">
              {rest.map(function (section) {
                const Icon = section.icon
                const count = section.countKey ? counts[section.countKey] || 0 : 0
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="block group"
                    style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1.5rem' }}
                  >
                    <div className="flex items-start gap-4">
                      <Icon size={20} style={{ color: CLAY }} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl group-hover:underline">
                          {section.label}
                        </h2>
                        <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm leading-relaxed mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}

        <div className="mt-10 text-center">
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm italic">
            Understanding is the first step toward participation.
          </p>
        </div>
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
