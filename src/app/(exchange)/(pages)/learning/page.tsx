import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { BookOpen, Newspaper, Compass, MessageCircle, Map } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning — Community Exchange',
  description: 'Understand your community through research, news, guided pathways, and conversation.',
}

const SECTIONS = [
  {
    href: '/library',
    label: 'Library',
    description: 'Research reports, policy briefs, and deep dives curated from trusted sources across Houston and beyond.',
    icon: BookOpen,
    color: '#1b5e8a',
    countKey: 'library',
  },
  {
    href: '/news',
    label: 'News',
    description: 'Local journalism and community reporting — what is happening right now, organized by the topics you care about.',
    icon: Newspaper,
    color: '#1a5030',
    countKey: 'news',
  },
  {
    href: '/pathways',
    label: 'Topics',
    description: 'Seven thematic journeys — health, families, neighborhoods, civic voice, economic mobility, environment, and belonging — each connecting you to related content, services, and people.',
    icon: Compass,
    color: '#4a2870',
    countKey: 'pathways',
  },
  {
    href: '/adventures',
    label: 'Community Adventures',
    description: 'Interactive stories where your choices shape the outcome. Navigate a town hall, discover hidden neighborhood assets, or prepare for hurricane season.',
    icon: Map,
    color: '#4a2870',
    countKey: 'adventures',
  },
  {
    href: '/chat',
    label: 'Ask Chance',
    description: 'Have a question about Houston? Ask Chance, your AI civic guide, and get answers grounded in local data.',
    icon: MessageCircle,
    color: '#1a6b56',
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

  return (
    <div>
      <IndexPageHero
        color="#1b5e8a"
        pattern="seed"
        title="Learning"
        subtitle="Understand what is happening in your community — and why it matters."
        stats={[
          { value: counts.library, label: 'Library Documents' },
          { value: counts.news, label: 'Articles & Reports' },
          { value: 7, label: 'Topics' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SECTIONS.map(function (section) {
            const Icon = section.icon
            const count = section.countKey ? counts[section.countKey] || 0 : 0
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group bg-white border border-brand-border overflow-hidden hover:shadow-lg transition-all"
               
              >
                <div className="flex">
                  <div
                    className="w-2 flex-shrink-0"
                    style={{ backgroundColor: section.color }}
                  />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 flex items-center justify-center"
                          style={{ backgroundColor: section.color + '15' }}
                        >
                          <Icon size={20} style={{ color: section.color }} />
                        </div>
                        <div>
                          <h2 className="font-display text-xl font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                            {section.label}
                          </h2>
                          {count > 0 && (
                            <p className="text-[11px] font-mono text-brand-muted-light mt-0.5">
                              {count.toLocaleString()} available
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-brand-muted group-hover:text-brand-accent transition-colors text-lg">&rarr;</span>
                    </div>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-brand-muted-light">
            <FlowerOfLifeIcon size={20} color="#1b5e8a" />
            <p className="text-sm font-display italic">
              Understanding is the first step toward participation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
