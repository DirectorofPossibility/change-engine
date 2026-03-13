import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            {storyTitle}
          </h1>
          {s.person_name && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem' }}>
              {s.person_name}{s.neighborhood ? ' from ' + s.neighborhood : ''}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/stories" className="hover:underline" style={{ color: CLAY }}>Stories</Link>
          <span className="mx-2">/</span>
          <span>{storyTitle}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div style={{ color: INK, fontFamily: SERIF }}>
          {(s.body || s.story_body || s.summary || s.story_summary || '').split('\n\n').map(function (p: string, i: number) {
            return <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.85, marginBottom: '1rem' }}>{p}</p>
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/stories" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Stories
        </Link>
      </div>
    </div>
  )
}
