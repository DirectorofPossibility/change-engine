import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

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
  const storyTitle = s.title || s.story_title || 'Story'

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {storyTitle}
          </h1>
          {s.person_name && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem' }}>
              {s.person_name}{s.neighborhood ? ' from ' + s.neighborhood : ''}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/stories" className="hover:underline" style={{ color: "#1b5e8a" }}>Stories</Link>
          <span className="mx-2">/</span>
          <span>{storyTitle}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div style={{  }}>
          {(s.body || s.story_body || s.summary || s.story_summary || '').split('\n\n').map(function (p: string, i: number) {
            return <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.85, marginBottom: '1rem' }}>{p}</p>
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/stories" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Stories
        </Link>
      </div>
    </div>
  )
}
