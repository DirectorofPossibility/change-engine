import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { THEMES } from '@/lib/constants'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Learning Paths — Community Exchange',
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

  return (
    <div>
      <IndexPageHero
        title="Learning Paths"
        subtitle="Structured journeys to deepen your understanding of civic life"
        color="#3182ce"
        pattern="tripod"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Learning Paths' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-6">
          <div>
            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(function (path: any) {
                  const theme = path.theme_id ? THEMES[path.theme_id as keyof typeof THEMES] : null
                  const themeColor = theme?.color ?? '#3182ce'

                  return (
                    <Link
                      key={path.path_id}
                      href={'/learning-paths/' + path.path_id}
                      className="bg-white border border-brand-border p-5 card-chunky flex hover:shadow-md transition-shadow"
                    >
                      {/* Theme color bar */}
                      <div
                        className="w-1.5 shrink-0 mr-4"
                        style={{ backgroundColor: themeColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display font-semibold text-brand-text text-lg mb-1">
                          {path.path_name}
                        </h2>
                        {path.description_5th_grade && (
                          <p className="text-sm text-brand-muted line-clamp-2 mb-3">
                            {path.description_5th_grade}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-brand-muted flex-wrap">
                          {path.difficulty_level && (
                            <span className="bg-brand-bg-alt px-2 py-0.5 font-medium">
                              {path.difficulty_level}
                            </span>
                          )}
                          {path.estimated_minutes != null && (
                            <span>{path.estimated_minutes} min</span>
                          )}
                          {path.module_count != null && (
                            <span>
                              {path.module_count} {path.module_count === 1 ? 'module' : 'modules'}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-brand-muted py-12">
                Learning paths are being developed. Check back soon.
              </p>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="learning-paths" related={[{label:'Guides',href:'/guides'},{label:'Library',href:'/library'},{label:'Topics',href:'/pathways'}]} color="#3182ce" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
