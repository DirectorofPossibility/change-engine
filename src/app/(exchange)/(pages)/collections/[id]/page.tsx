import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: collection } = await supabase.from('featured_collections').select('*').or(`collection_id.eq.${id},id.eq.${id}`).single()
  if (!collection) notFound()

  const c = collection as any

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Collections', href: '/collections' }, { label: c.title || c.collection_name }]} />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mt-4">{c.title || c.collection_name}</h1>
          {(c.description || c.summary) && <p className="text-brand-muted mt-3 max-w-2xl">{c.description || c.summary}</p>}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-brand-muted text-sm">Collection content will be displayed here as items are curated.</p>
      </div>
    </div>
  )
}
