import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'

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
  const { data: collection } = await supabase.from('featured_collections').select('*').or(`collection_id.eq.${id},id.eq.${id}`).single()
  if (!collection) return { title: 'Collection Not Found' }
  const c = collection as any
  return {
    title: c.title || c.collection_name || 'Collection',
    description: c.description || `A curated collection of community resources in Houston.`,
  }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: collection } = await supabase.from('featured_collections').select('*').or(`collection_id.eq.${id},id.eq.${id}`).single()
  if (!collection) notFound()

  const c = collection as any
  const color = c.color || (c.theme_id && (THEMES as any)[c.theme_id]?.color) || CLAY
  const itemType = c.item_type || 'content'

  // Parse item_ids and fetch content
  const itemIds = (c.item_ids || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  let items: any[] = []

  if (itemIds.length > 0) {
    if (itemType === 'content' || itemType === 'article' || itemType === 'guide') {
      const { data } = await supabase
        .from('content_published')
        .select('id, title_6th_grade, summary_6th_grade, pathway_primary, image_url, source_url, published_at')
        .eq('is_active', true)
        .in('id', itemIds)
      items = data || []
    } else if (itemType === 'service') {
      const { data } = await supabase
        .from('services_211')
        .select('service_id, service_name, description_5th_grade, phone, website')
        .in('service_id', itemIds)
      items = data || []
    } else if (itemType === 'organization') {
      const { data } = await supabase
        .from('organizations')
        .select('org_id, org_name, description_5th_grade, website, logo_url')
        .in('org_id', itemIds)
      items = data || []
    }
  }

  // If no item_ids, try fetching by focus area or theme
  if (items.length === 0 && (c.focus_area_ids || c.theme_id)) {
    const { data } = await supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, pathway_primary, image_url, source_url, published_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(20)
    items = (data || []).filter(function (item) {
      if (c.theme_id) return item.pathway_primary === c.theme_id
      return true
    })
  }

  const collectionName = c.collection_name || 'Collection'
  const subtitle = c.description_5th_grade || undefined

  const visible = items.slice(0, 4)
  const rest = items.slice(4)

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
            {collectionName}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {subtitle}
            </p>
          )}
          {items.length > 0 && (
            <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED, marginTop: '1rem', display: 'block' }}>{items.length} Resources</span>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:underline" style={{ color: CLAY }}>Collections</Link>
          <span className="mx-2">/</span>
          <span>{collectionName}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="py-16" style={{ border: '1px dashed ' + RULE_COLOR }}>
            <p style={{ fontFamily: SERIF, color: MUTED, fontStyle: 'italic', textAlign: 'center' }}>This collection is being curated. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visible.map(function (item) {
                const itemId = item.id || item.service_id || item.org_id
                const title = item.title_6th_grade || item.service_name || item.org_name || ''
                const summary = item.summary_6th_grade || item.description_5th_grade || ''
                const image = item.image_url || item.logo_url
                const href = item.id ? '/content/' + item.id
                  : item.service_id ? '/services/' + item.service_id
                  : item.org_id ? '/organizations/' + item.org_id
                  : '#'

                return (
                  <Link
                    key={itemId}
                    href={href}
                    className="block group"
                    style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1rem' }}
                  >
                    <div className="flex gap-4">
                      {image && (
                        <div className="w-24 h-20 flex-shrink-0 overflow-hidden">
                          <Image src={image} alt="" className="w-full h-full object-cover" width={96} height={80} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 style={{ fontFamily: SERIF, fontSize: '1rem', color: INK, lineHeight: 1.3 }} className="group-hover:underline line-clamp-2">
                          {title}
                        </h3>
                        {summary && (
                          <p style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED, marginTop: '0.25rem' }} className="line-clamp-2">{summary}</p>
                        )}
                        {item.source_url && (
                          <div className="flex items-center gap-1 mt-2" style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED }}>
                            <ExternalLink size={10} />
                            <span className="truncate">{new URL(item.source_url).hostname.replace('www.', '')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {rest.length > 0 && (
              <details className="mt-6">
                <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Show {rest.length} more resource{rest.length !== 1 ? 's' : ''}
                </summary>
                <div className="space-y-4 mt-4">
                  {rest.map(function (item) {
                    const itemId = item.id || item.service_id || item.org_id
                    const title = item.title_6th_grade || item.service_name || item.org_name || ''
                    const summary = item.summary_6th_grade || item.description_5th_grade || ''
                    const image = item.image_url || item.logo_url
                    const href = item.id ? '/content/' + item.id
                      : item.service_id ? '/services/' + item.service_id
                      : item.org_id ? '/organizations/' + item.org_id
                      : '#'

                    return (
                      <Link
                        key={itemId}
                        href={href}
                        className="block group"
                        style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '1rem' }}
                      >
                        <div className="flex gap-4">
                          {image && (
                            <div className="w-24 h-20 flex-shrink-0 overflow-hidden">
                              <Image src={image} alt="" className="w-full h-full object-cover" width={96} height={80} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 style={{ fontFamily: SERIF, fontSize: '1rem', color: INK, lineHeight: 1.3 }} className="group-hover:underline line-clamp-2">
                              {title}
                            </h3>
                            {summary && (
                              <p style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED, marginTop: '0.25rem' }} className="line-clamp-2">{summary}</p>
                            )}
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

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/collections" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Collections
        </Link>
      </div>
    </div>
  )
}
