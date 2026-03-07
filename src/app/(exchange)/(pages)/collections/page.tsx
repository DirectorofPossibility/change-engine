import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Layers } from 'lucide-react'

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

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="vesica" gradientColor="#E8723A" title="Curated Collections" subtitle="Thoughtfully assembled collections of resources, guides, and content to help you navigate what matters most." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Collections' }]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {(collections || []).map(function (c: any) {
            return (
              <Link key={c.collection_id || c.id} href={`/collections/${c.collection_id || c.id}`} className="bg-white rounded-lg border border-brand-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-brand-text">{c.title || c.collection_name}</h3>
                    {(c.description || c.summary) && <p className="text-sm text-brand-muted mt-1 line-clamp-3">{c.description || c.summary}</p>}
                    {c.item_count && <span className="text-xs text-brand-muted mt-2 inline-block">{c.item_count} resources</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
