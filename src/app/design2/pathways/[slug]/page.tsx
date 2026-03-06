import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'

export const revalidate = 300

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const theme = THEME_LIST.find(function (t) { return t.slug === slug })
  return { title: (theme?.name || 'Pathway') + ' — Community Exchange' }
}

export default async function PathwayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = THEME_LIST.find(function (t) { return t.slug === slug })
  if (!theme) notFound()

  const supabase = await createClient()

  // Fetch content for this pathway
  const { data: content } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, resource_type, image_url, source_domain, published_at')
    .eq('pathway_primary', theme.id)
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(24)

  // Fetch focus areas for this theme
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_area_id, name, theme_id')
    .eq('theme_id', theme.id)

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2/pathways" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← All Pathways</Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="h-1.5 w-16 rounded-full mb-4" style={{ background: theme.color }} />
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>{theme.name}</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            Explore resources, news, and opportunities connected to {theme.name.toLowerCase()}.
          </p>
        </div>

        {/* Focus Areas */}
        {focusAreas && focusAreas.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#6B6560' }}>Focus Areas</h2>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(function (fa: any) {
                return (
                  <span
                    key={fa.focus_area_id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white border"
                    style={{ borderColor: '#D4CCBE', color: '#4A4540' }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: theme.color }} />
                    {fa.name}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {/* Content Grid */}
        <section>
          <h2 className="font-serif text-xl mb-4" style={{ color: '#1a1a1a' }}>Latest in {theme.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(content || []).map(function (item: any) {
              return (
                <Link
                  key={item.id}
                  href={'/design2/content/' + item.id}
                  className="bg-white rounded-xl overflow-hidden border transition-all hover:shadow-md hover:translate-y-[-2px]"
                  style={{ borderColor: '#D4CCBE' }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-[140px] object-cover" />
                  ) : (
                    <div className="h-[5px] rounded-t-xl" style={{ background: theme.color }} />
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>
                      {item.title_6th_grade}
                    </h3>
                    {item.summary_6th_grade && (
                      <p className="text-[12px] mt-2 line-clamp-2" style={{ color: '#6B6560' }}>{item.summary_6th_grade}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-medium" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                      <span className="text-[11px]" style={{ color: '#D4CCBE' }}>|</span>
                      <span className="text-[11px] uppercase tracking-wider" style={{ color: '#9B9590' }}>{item.resource_type}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {(!content || content.length === 0) && (
            <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#D4CCBE' }}>
              <p className="text-[15px]" style={{ color: '#6B6560' }}>Content for this pathway is being curated. Check back soon.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
