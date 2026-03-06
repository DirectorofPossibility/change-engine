import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Stories — Community Exchange',
  description: 'Stories of impact and resilience from Houston community members.',
}

export default async function StoriesPage() {
  const supabase = await createClient()
  const { data: stories } = await supabase
    .from('success_stories')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="flower" gradientColor="#805ad5" title="Community Stories" subtitle="Real stories of impact, resilience, and connection from Houston neighbors. Every journey matters." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Stories' }]} />
        <div className="space-y-4 mt-4">
          {(stories || []).map(function (s: any) {
            return (
              <Link key={s.story_id || s.id} href={`/stories/${s.story_id || s.id}`} className="block bg-white rounded-lg border border-brand-border p-5 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-brand-text font-serif text-lg">{s.title || s.story_title}</h3>
                {(s.summary || s.story_summary) && <p className="text-sm text-brand-muted mt-2 line-clamp-3">{s.summary || s.story_summary}</p>}
                {s.person_name && <p className="text-xs text-brand-accent mt-2 font-medium">{s.person_name}{s.neighborhood ? ` from ${s.neighborhood}` : ''}</p>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
