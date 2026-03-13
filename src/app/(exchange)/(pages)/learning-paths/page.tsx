import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Learning Paths — Change Engine',
  description: 'Structured journeys to deepen your understanding of civic life in Houston — explore guided learning paths across community topics.',
}


export default async function LearningPathsPage() {
  const supabase = await createClient()

  const { data: paths } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', 'true')
    .order('display_order', { ascending: true })

  const items = paths ?? []
  const visible = items.slice(0, 4)
  const rest = items.slice(4)

  return (
    <div className="bg-paper min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-paper">
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ color: "#5c6474" }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{  }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            Learning Paths
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg leading-relaxed max-w-2xl">
            Structured journeys to deepen your understanding of civic life
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ color: "#5c6474" }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Learning Paths</span>
        </nav>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <div className="flex items-baseline justify-between" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>All Paths</h2>
          <span style={{ color: "#5c6474" }} className="text-xs">{items.length} paths</span>
        </div>
      </div>

      {/* ── PATHS LIST ── */}
      <div className="max-w-[900px] mx-auto px-6 py-6">
        {items.length === 0 ? (
          <p className="text-center py-12" style={{ color: "#5c6474" }}>
            Learning paths are being developed. Check back soon.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {visible.map(function (path: any) {
                const theme = path.theme_id ? THEMES[path.theme_id as keyof typeof THEMES] : null
                const themeColor = theme?.color ?? '#1b5e8a'

                return (
                  <Link
                    key={path.path_id}
                    href={'/learning-paths/' + path.path_id}
                    className="block hover:underline"
                    style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '1rem' }}
                  >
                    <div className="flex gap-4">
                      <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: themeColor }} />
                      <div className="flex-1 min-w-0">
                        <h3 style={{  }} className="text-lg leading-snug mb-1">
                          {path.path_name}
                        </h3>
                        {path.description_5th_grade && (
                          <p style={{ color: "#5c6474" }} className="text-sm line-clamp-2 mb-2">
                            {path.description_5th_grade}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "#5c6474" }}>
                          {path.difficulty_level && (
                            <span>{path.difficulty_level}</span>
                          )}
                          {path.estimated_minutes != null && (
                            <span>{path.estimated_minutes} min</span>
                          )}
                          {path.module_count != null && (
                            <span>{path.module_count} {path.module_count === 1 ? 'module' : 'modules'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {rest.length > 0 && (
              <details className="mt-6">
                <summary style={{ color: "#1b5e8a", cursor: 'pointer' }} className="text-sm hover:underline">
                  Show {rest.length} more path{rest.length !== 1 ? 's' : ''}
                </summary>
                <div className="space-y-4 mt-4">
                  {rest.map(function (path: any) {
                    const theme = path.theme_id ? THEMES[path.theme_id as keyof typeof THEMES] : null
                    const themeColor = theme?.color ?? '#1b5e8a'

                    return (
                      <Link
                        key={path.path_id}
                        href={'/learning-paths/' + path.path_id}
                        className="block hover:underline"
                        style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '1rem' }}
                      >
                        <div className="flex gap-4">
                          <div className="w-1 flex-shrink-0 self-stretch" style={{ backgroundColor: themeColor }} />
                          <div className="flex-1 min-w-0">
                            <h3 style={{  }} className="text-lg leading-snug mb-1">
                              {path.path_name}
                            </h3>
                            {path.description_5th_grade && (
                              <p style={{ color: "#5c6474" }} className="text-sm line-clamp-2 mb-2">
                                {path.description_5th_grade}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "#5c6474" }}>
                              {path.difficulty_level && <span>{path.difficulty_level}</span>}
                              {path.estimated_minutes != null && <span>{path.estimated_minutes} min</span>}
                              {path.module_count != null && <span>{path.module_count} {path.module_count === 1 ? 'module' : 'modules'}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + '#dde1e8', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
