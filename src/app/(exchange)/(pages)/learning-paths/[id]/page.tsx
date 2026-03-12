import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { THEMES } from '@/lib/constants'
import { BookOpen, Clock, Layers, ArrowRight } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

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
    title: path.path_name + ' — Community Exchange',
    description: 'A structured learning journey on the Community Exchange.',
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
  const themeColor = theme?.color ?? '#3182ce'

  const userProfile = await getUserProfile()

  // Fetch prerequisite path name and wayfinder data in parallel
  const [prereqResult, wayfinderData] = await Promise.all([
    (path as any).prerequisite_path_id
      ? supabase.from('learning_paths').select('path_name').eq('path_id', (path as any).prerequisite_path_id).single()
      : Promise.resolve({ data: null }),
    getWayfinderContext('learning_path', id, userProfile?.role),
  ])
  const prerequisiteName = prereqResult.data?.path_name ?? null

  return (
    <div>
      <PageHero
        variant="gradient"
        gradientColor={themeColor}
        title={(path as any).path_name}
        subtitle={(path as any).description_5th_grade || undefined}
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: 'Learning Paths', href: '/learning-paths' },
          { label: (path as any).path_name },
        ]} />

        <div className="flex flex-col lg:flex-row gap-6 mt-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(path as any).difficulty_level && (
                <div className="bg-white border border-brand-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: themeColor + '1A' }}>
                    <Layers size={20} style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wide font-medium">Difficulty</p>
                    <p className="text-sm font-semibold text-brand-text">{(path as any).difficulty_level}</p>
                  </div>
                </div>
              )}
              {(path as any).estimated_minutes != null && (
                <div className="bg-white border border-brand-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: themeColor + '1A' }}>
                    <Clock size={20} style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wide font-medium">Estimated Time</p>
                    <p className="text-sm font-semibold text-brand-text">{(path as any).estimated_minutes} minutes</p>
                  </div>
                </div>
              )}
              {(path as any).module_count != null && (
                <div className="bg-white border border-brand-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: themeColor + '1A' }}>
                    <BookOpen size={20} style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wide font-medium">Modules</p>
                    <p className="text-sm font-semibold text-brand-text">
                      {(path as any).module_count} {(path as any).module_count === 1 ? 'module' : 'modules'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description prose */}
            {(path as any).path_description && (
              <div className="mt-8 bg-white border border-brand-border p-6">
                <h2 className="text-xl font-display font-bold text-brand-text mb-3">About This Path</h2>
                <div className="prose prose-sm max-w-none text-brand-text">
                  <p>{(path as any).path_description}</p>
                </div>
              </div>
            )}

            {/* Prerequisite path */}
            {(path as any).prerequisite_path_id && prerequisiteName && (
              <div className="mt-6 bg-white border border-brand-border p-5">
                <h3 className="text-sm font-display font-semibold text-brand-text mb-2">Recommended First</h3>
                <Link
                  href={'/learning-paths/' + (path as any).prerequisite_path_id}
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: themeColor }}
                >
                  <ArrowRight size={14} />
                  {prerequisiteName}
                </Link>
              </div>
            )}

            {/* Theme / Pathway link */}
            {theme && (
              <div className="mt-6 bg-white border border-brand-border p-5">
                <h3 className="text-sm font-display font-semibold text-brand-text mb-2">Pathway</h3>
                <Link
                  href={'/pathways/' + theme.slug}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: themeColor }}
                >
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ backgroundColor: themeColor }}
                  />
                  {theme.name}
                </Link>
              </div>
            )}
          </div>

          {/* Wayfinder sidebar */}
          <aside className="lg:w-80 shrink-0">
            <DetailWayfinder data={wayfinderData} currentType="learning_path" currentId={id} userRole={userProfile?.role} />
          </aside>
        </div>
      </div>
    </div>
  )
}
