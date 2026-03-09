import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'

export const revalidate = 300

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
  const color = c.color || (c.theme_id && (THEMES as any)[c.theme_id]?.color) || '#C75B2A'
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

  const collectionId = c.collection_id || c.id
  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('collection' as any, collectionId, userProfile?.role)

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

  return (
    <div>
      <IndexPageHero
        color={color}
        pattern="vesica"
        title={c.collection_name}
        subtitle={c.description_5th_grade || undefined}
        stats={items.length > 0 ? [{ value: items.length, label: 'Resources' }] : undefined}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Collections', href: '/collections' }, { label: c.collection_name }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <FlowerOfLifeIcon size={40} color={color} className="mx-auto mb-3 opacity-30" />
                <p className="text-brand-muted font-serif italic">This collection is being curated. Check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(function (item) {
                  const itemId = item.id || item.service_id || item.org_id
                  const title = item.title_6th_grade || item.service_name || item.org_name || ''
                  const summary = item.summary_6th_grade || item.description_5th_grade || ''
                  const image = item.image_url || item.logo_url
                  const href = item.id ? '/content/' + item.id
                    : item.service_id ? '/services/' + item.service_id
                    : item.org_id ? '/organizations/' + item.org_id
                    : '#'
                  const themeColor = item.pathway_primary ? (THEMES as any)[item.pathway_primary]?.color || color : color

                  return (
                    <Link
                      key={itemId}
                      href={href}
                      className="group bg-white rounded-xl border-2 border-brand-border overflow-hidden hover:shadow-lg transition-all"
                      style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
                    >
                      {image ? (
                        <div className="h-36 overflow-hidden">
                          <Image src={image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"  width={800} height={400} />
                        </div>
                      ) : (
                        <div className="h-3" style={{ backgroundColor: themeColor }} />
                      )}
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-brand-text text-sm leading-tight group-hover:text-brand-accent transition-colors line-clamp-2">
                          {title}
                        </h3>
                        {summary && (
                          <p className="text-xs text-brand-muted mt-1.5 line-clamp-3">{summary}</p>
                        )}
                        {item.source_url && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-brand-muted-light">
                            <ExternalLink size={10} />
                            <span className="truncate">{new URL(item.source_url).hostname.replace('www.', '')}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          <DetailWayfinder data={wayfinderData} currentType={'collection' as any} currentId={collectionId} userRole={userProfile?.role} />
        </div>
      </div>
    </div>
  )
}
