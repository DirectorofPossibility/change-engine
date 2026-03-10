import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Curated Collections — Community Exchange',
  description: 'Hand-curated collections of resources, guides, and content for Houston community members.',
}

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: collections } = await supabase
    .from('featured_collections')
    .select('*')
    .order('display_order, title')

  const items = collections || []

  return (
    <div>
      <IndexPageHero
        color="#C75B2A"
        pattern="vesica"
        title="Curated Collections"
        subtitle="Thoughtfully assembled collections of resources, guides, and content to help you navigate what matters most."
        stats={items.length > 0 ? [{ value: items.length, label: 'Collections' }] : undefined}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Collections' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-6">
          <div>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <FlowerOfLifeIcon size={40} color="#C75B2A" className="mx-auto mb-3 opacity-30" />
                <p className="text-brand-muted font-serif italic">Collections are being curated. Check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(function (c: any) {
                  const color = c.color || (c.theme_id && (THEMES as any)[c.theme_id]?.color) || '#C75B2A'
                  const itemCount = c.item_ids ? c.item_ids.split(',').filter(Boolean).length : null

                  return (
                    <Link
                      key={c.collection_id || c.id}
                      href={'/collections/' + (c.collection_id || c.id)}
                      className="group bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-lg transition-all"
                     
                    >
                      <div className="h-2" style={{ backgroundColor: color }} />
                      <div className="p-5">
                        <h3 className="font-serif font-bold text-brand-text text-base leading-tight group-hover:text-brand-accent transition-colors">
                          {c.collection_name || c.title}
                        </h3>
                        {(c.description_5th_grade || c.description || c.summary) && (
                          <p className="text-sm text-brand-muted mt-2 line-clamp-3">
                            {c.description_5th_grade || c.description || c.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {itemCount && (
                            <span className="text-xs text-brand-muted-light">{itemCount} resources</span>
                          )}
                          {c.theme_id && (THEMES as any)[c.theme_id] && (
                            <span className="flex items-center gap-1 text-xs text-brand-muted-light">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: (THEMES as any)[c.theme_id].color }} />
                              {(THEMES as any)[c.theme_id].label}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder
                currentPage="collections"
                color="#C75B2A"
                related={[
                  { label: 'Library', href: '/library' },
                  { label: 'News', href: '/news' },
                  { label: 'Guides', href: '/guides' },
                ]}
              />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
