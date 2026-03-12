import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: story } = await supabase.from('success_stories').select('*').or(`story_id.eq.${id},id.eq.${id}`).single()
  if (!story) return { title: 'Story Not Found' }
  const s = story as any
  return {
    title: s.title || s.story_title || 'Community Story',
    description: s.summary || s.excerpt || `Read ${s.person_name ? s.person_name + "'s" : 'a'} community story from Houston.`,
  }
}

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: story } = await supabase.from('success_stories').select('*').or(`story_id.eq.${id},id.eq.${id}`).single()
  if (!story) notFound()

  const s = story as any
  const storyId = s.story_id || s.id
  const storyTitle = s.title || s.story_title || 'Story'

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('story' as any, storyId, userProfile?.role)

  const canonicalUrl = `https://www.changeengine.us/stories/${id}`

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Stories', href: '/stories' },
        { label: storyTitle },
      ]}
      eyebrow={{ text: 'Community Story' }}
      title={storyTitle}
      subtitle={s.person_name ? `${s.person_name}${s.neighborhood ? ` from ${s.neighborhood}` : ''}` : undefined}
      actions={{
        share: { title: storyTitle, url: canonicalUrl },
      }}
      wayfinderData={wayfinderData}
      wayfinderType={'story'}
      wayfinderEntityId={storyId}
      userRole={userProfile?.role}
      feedbackType="story"
      feedbackId={storyId}
      feedbackName={storyTitle}
    >
      <div className="prose prose-brand max-w-none text-brand-text leading-relaxed">
        {(s.body || s.story_body || s.summary || s.story_summary || '').split('\n\n').map(function (p: string, i: number) {
          return <p key={i}>{p}</p>
        })}
      </div>
    </DetailPageLayout>
  )
}
