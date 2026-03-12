import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Stories' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
          <div className="space-y-4">
            {(stories || []).map(function (s: any) {
              return (
                <Link key={s.story_id || s.id} href={`/stories/${s.story_id || s.id}`} className="block bg-white border border-brand-border p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-brand-text font-display text-lg">{s.title || s.story_title}</h3>
                  {(s.summary || s.story_summary) && <p className="text-sm text-brand-muted mt-2 line-clamp-3">{s.summary || s.story_summary}</p>}
                  {s.person_name && <p className="text-xs text-brand-accent mt-2 font-medium">{s.person_name}{s.neighborhood ? ` from ${s.neighborhood}` : ''}</p>}
                </Link>
              )
            })}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="stories" related={[{label:'Organizations',href:'/organizations'},{label:'News',href:'/news'},{label:'Neighborhoods',href:'/neighborhoods'}]} color="#805ad5" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
