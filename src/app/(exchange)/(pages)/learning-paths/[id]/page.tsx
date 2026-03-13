import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { BookOpen, Clock, Layers, ArrowRight } from 'lucide-react'

export const revalidate = 86400

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
  const { data: path } = await supabase
    .from('learning_paths')
    .select('path_name')
    .eq('path_id', id)
    .single()

  if (!path) return { title: 'Not Found' }

  return {
    title: path.path_name + ' — Change Engine',
    description: 'A structured learning journey on the Change Engine.',
  }
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('path_id', id)
    .single()

  if (!path) notFound()

  const theme = (path as any).theme_id ? THEMES[(path as any).theme_id as keyof typeof THEMES] : null
  const themeColor = theme?.color ?? CLAY

  // Fetch prerequisite path name
  let prerequisiteName: string | null = null
  if ((path as any).prerequisite_path_id) {
    const { data: prereq } = await supabase.from('learning_paths').select('path_name').eq('path_id', (path as any).prerequisite_path_id).single()
    prerequisiteName = prereq?.path_name ?? null
  }

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
            {(path as any).path_name}
          </h1>
          {(path as any).description_5th_grade && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {(path as any).description_5th_grade}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            {(path as any).difficulty_level && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
                <Layers size={14} style={{ color: themeColor }} />
                {(path as any).difficulty_level}
              </span>
            )}
            {(path as any).estimated_minutes != null && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
                <Clock size={14} style={{ color: themeColor }} />
                {(path as any).estimated_minutes} min
              </span>
            )}
            {(path as any).module_count != null && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
                <BookOpen size={14} style={{ color: themeColor }} />
                {(path as any).module_count} {(path as any).module_count === 1 ? 'module' : 'modules'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/learning-paths" className="hover:underline" style={{ color: CLAY }}>Learning Paths</Link>
          <span className="mx-2">/</span>
          <span>{(path as any).path_name}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Description prose */}
        {(path as any).path_description && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>About This Path</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{(path as any).path_description}</p>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* Prerequisite path */}
        {(path as any).prerequisite_path_id && prerequisiteName && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK }}>Recommended First</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <Link
              href={'/learning-paths/' + (path as any).prerequisite_path_id}
              className="flex items-center gap-2 hover:underline"
              style={{ fontFamily: SERIF, fontSize: '0.9rem', fontWeight: 500, color: CLAY }}
            >
              <ArrowRight size={14} />
              {prerequisiteName}
            </Link>
          </section>
        )}

        {/* Theme / Pathway link */}
        {theme && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK }}>Pathway</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <Link
              href={'/pathways/' + theme.slug}
              className="inline-flex items-center gap-2 hover:underline"
              style={{ fontFamily: SERIF, fontSize: '0.9rem', fontWeight: 500, color: CLAY }}
            >
              <span className="w-3 h-3 inline-block" style={{ backgroundColor: themeColor }} />
              {theme.name}
            </Link>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/learning-paths" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Learning Paths
        </Link>
      </div>
    </div>
  )
}
