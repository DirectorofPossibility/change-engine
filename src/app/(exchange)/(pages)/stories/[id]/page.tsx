import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: story } = await supabase.from('success_stories').select('*').or(`story_id.eq.${id},id.eq.${id}`).single()
  if (!story) notFound()

  const s = story as any
  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Stories', href: '/stories' }, { label: s.title || s.story_title || 'Story' }]} />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mt-4">{s.title || s.story_title}</h1>
          {s.person_name && <p className="text-brand-muted mt-2">{s.person_name}{s.neighborhood ? ` from ${s.neighborhood}` : ''}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="prose prose-brand max-w-none text-brand-text leading-relaxed">
          {(s.body || s.story_body || s.summary || s.story_summary || '').split('\n\n').map(function (p: string, i: number) {
            return <p key={i}>{p}</p>
          })}
        </div>
      </div>
    </div>
  )
}
