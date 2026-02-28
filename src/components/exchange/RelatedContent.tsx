import { ContentCard } from './ContentCard'

interface RelatedItem {
  id: string
  title_6th_grade: string
  summary_6th_grade: string
  pathway_primary: string | null
  center: string | null
  source_url: string
  published_at: string | null
}

interface RelatedContentProps {
  title?: string
  items: RelatedItem[]
}

export function RelatedContent({ title, items }: RelatedContentProps) {
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-text mb-4">{title || 'Related Resources'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(function (item) {
          return (
            <ContentCard
              key={item.id}
              id={item.id}
              title={item.title_6th_grade}
              summary={item.summary_6th_grade}
              pathway={item.pathway_primary}
              center={item.center}
              sourceUrl={item.source_url}
              publishedAt={item.published_at}
            />
          )
        })}
      </div>
    </section>
  )
}
