import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'

export const revalidate = 300
export const metadata: Metadata = { title: 'Library — Community Exchange' }

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: content } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, resource_type, pathway_primary, image_url, published_at, source_domain')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(40)

  const { data: guides } = await supabase
    .from('guides')
    .select('guide_id, title, slug, description, hero_image_url, theme_id')

  const { data: kbDocs } = await supabase
    .from('kb_documents')
    .select('id, title, summary, page_count, status')
    .eq('status', 'indexed')
    .limit(10)

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Library</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>Articles, guides, research, and learning resources curated from across Houston&apos;s civic landscape.</p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#3182ce' }} />
        </div>

        {/* Guides */}
        {guides && guides.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl mb-4" style={{ color: '#1a1a1a' }}>Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guides.map(function (g: any) {
                const theme = THEME_LIST.find(function (t) { return t.id === g.theme_id })
                return (
                  <Link key={g.guide_id} href={'/guides/' + g.slug} className="bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md hover:translate-y-[-2px]" style={{ borderColor: '#D4CCBE' }}>
                    {g.hero_image_url ? (
                      <img src={g.hero_image_url} alt="" className="w-full h-[120px] object-cover" />
                    ) : (
                      <div className="h-2 rounded-t-xl" style={{ background: theme?.color || '#C75B2A' }} />
                    )}
                    <div className="p-4">
                      <h3 className="font-serif text-[15px] font-semibold leading-snug" style={{ color: '#1a1a1a' }}>{g.title}</h3>
                      {g.description && <p className="text-[12px] mt-2 line-clamp-2" style={{ color: '#6B6560' }}>{g.description}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Knowledge Base */}
        {kbDocs && kbDocs.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl mb-4" style={{ color: '#1a1a1a' }}>Knowledge Base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kbDocs.map(function (doc: any) {
                return (
                  <Link key={doc.id} href={'/library/doc/' + doc.id} className="bg-white rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: '#D4CCBE' }}>
                    <h3 className="font-serif text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>{doc.title}</h3>
                    {doc.summary && <p className="text-[12px] mt-1 line-clamp-2" style={{ color: '#6B6560' }}>{doc.summary}</p>}
                    {doc.page_count && <span className="text-[10px] mt-2 inline-block uppercase tracking-wider" style={{ color: '#9B9590' }}>{doc.page_count} pages</span>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* All Content */}
        <section>
          <h2 className="font-serif text-xl mb-4" style={{ color: '#1a1a1a' }}>All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(content || []).map(function (item: any) {
              const theme = THEME_LIST.find(function (t) { return t.id === item.pathway_primary })
              return (
                <Link key={item.id} href={'/design2/content/' + item.id} className="bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md hover:translate-y-[-2px]" style={{ borderColor: '#D4CCBE' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-[130px] object-cover" />
                  ) : (
                    <div className="h-[5px] rounded-t-xl" style={{ background: theme?.color || '#C75B2A' }} />
                  )}
                  <div className="p-4">
                    {theme && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: theme.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>{theme.name}</span>
                      </div>
                    )}
                    <h3 className="font-serif text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>{item.title_6th_grade}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                      <span className="text-[10px]" style={{ color: '#D4CCBE' }}>|</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#9B9590' }}>{item.resource_type}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
