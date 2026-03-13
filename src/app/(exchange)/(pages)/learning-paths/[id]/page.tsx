import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { BookOpen, Clock, Layers, ArrowRight } from 'lucide-react'

export const revalidate = 86400


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
  const themeColor = theme?.color ?? '#1b5e8a'

  // Fetch prerequisite path name
  let prerequisiteName: string | null = null
  if ((path as any).prerequisite_path_id) {
    const { data: prereq } = await supabase.from('learning_paths').select('path_name').eq('path_id', (path as any).prerequisite_path_id).single()
    prerequisiteName = prereq?.path_name ?? null
  }

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
            {(path as any).path_name}
          </h1>
          {(path as any).description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {(path as any).description_5th_grade}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            {(path as any).difficulty_level && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.7rem', color: "#5c6474" }}>
                <Layers size={14} style={{ color: themeColor }} />
                {(path as any).difficulty_level}
              </span>
            )}
            {(path as any).estimated_minutes != null && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.7rem', color: "#5c6474" }}>
                <Clock size={14} style={{ color: themeColor }} />
                {(path as any).estimated_minutes} min
              </span>
            )}
            {(path as any).module_count != null && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.7rem', color: "#5c6474" }}>
                <BookOpen size={14} style={{ color: themeColor }} />
                {(path as any).module_count} {(path as any).module_count === 1 ? 'module' : 'modules'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/learning-paths" className="hover:underline" style={{ color: "#1b5e8a" }}>Learning Paths</Link>
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
              <h2 style={{ fontSize: '1.5rem',  }}>About This Path</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{(path as any).path_description}</p>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Prerequisite path */}
        {(path as any).prerequisite_path_id && prerequisiteName && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.25rem',  }}>Recommended First</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <Link
              href={'/learning-paths/' + (path as any).prerequisite_path_id}
              className="flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.9rem', fontWeight: 500, color: "#1b5e8a" }}
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
              <h2 style={{ fontSize: '1.25rem',  }}>Pathway</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <Link
              href={'/pathways/' + theme.slug}
              className="inline-flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.9rem', fontWeight: 500, color: "#1b5e8a" }}
            >
              <span className="w-3 h-3 inline-block" style={{ backgroundColor: themeColor }} />
              {theme.name}
            </Link>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/learning-paths" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Learning Paths
        </Link>
      </div>
    </div>
  )
}
