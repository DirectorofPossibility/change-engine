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
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl leading-[1.15] mb-4">
            {(path as any).path_name}
          </h1>
          {(path as any).description_5th_grade && (
            <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl mb-4">
              {(path as any).description_5th_grade}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap">
            {(path as any).difficulty_level && (
              <span className="flex items-center gap-1.5 text-sm" style={{ fontFamily: MONO, color: MUTED }}>
                <Layers size={14} style={{ color: themeColor }} />
                {(path as any).difficulty_level}
              </span>
            )}
            {(path as any).estimated_minutes != null && (
              <span className="flex items-center gap-1.5 text-sm" style={{ fontFamily: MONO, color: MUTED }}>
                <Clock size={14} style={{ color: themeColor }} />
                {(path as any).estimated_minutes} min
              </span>
            )}
            {(path as any).module_count != null && (
              <span className="flex items-center gap-1.5 text-sm" style={{ fontFamily: MONO, color: MUTED }}>
                <BookOpen size={14} style={{ color: themeColor }} />
                {(path as any).module_count} {(path as any).module_count === 1 ? 'module' : 'modules'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/learning-paths" className="hover:underline" style={{ color: CLAY }}>Learning Paths</Link>
          <span className="mx-2">/</span>
          <span>{(path as any).path_name}</span>
        </nav>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Description prose */}
        {(path as any).path_description && (
          <div className="mb-8">
            <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }} className="mb-3">About This Path</h2>
            <div className="prose prose-sm max-w-none" style={{ color: INK }}>
              <p>{(path as any).path_description}</p>
            </div>
          </div>
        )}

        {/* ── SIDEBAR INFO INLINED ── */}
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '2rem', marginTop: '2rem' }}>
          {/* Prerequisite path */}
          {(path as any).prerequisite_path_id && prerequisiteName && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-2">Recommended First</h3>
              <Link
                href={'/learning-paths/' + (path as any).prerequisite_path_id}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: CLAY }}
              >
                <ArrowRight size={14} />
                {prerequisiteName}
              </Link>
            </div>
          )}

          {/* Theme / Pathway link */}
          {theme && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-2">Pathway</h3>
              <Link
                href={'/pathways/' + theme.slug}
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: CLAY }}
              >
                <span className="w-3 h-3 inline-block" style={{ backgroundColor: themeColor }} />
                {theme.name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/learning-paths" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Learning Paths
          </Link>
        </div>
      </div>
    </div>
  )
}
