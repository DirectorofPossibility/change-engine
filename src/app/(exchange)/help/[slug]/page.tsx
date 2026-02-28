import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLifeSituation, getLifeSituationContent, getLearningPaths } from '@/lib/data/exchange'
import { ContentCard } from '@/components/exchange/ContentCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'

export default async function HelpDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const situation = await getLifeSituation(slug)
  if (!situation) notFound()

  const isCritical = situation.urgency_level === 'Critical'

  const { content, services } = await getLifeSituationContent(
    situation.focus_area_ids || '',
    situation.service_cat_ids
  )

  // Get related learning path
  const paths = situation.path_id ? await getLearningPaths() : []
  const relatedPath = paths.find(p => p.path_id === situation.path_id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/help" className="hover:text-brand-accent">I Need Help</Link>
        <span className="mx-2">/</span>
        <span>{situation.situation_name}</span>
      </div>

      {/* Crisis banner for Critical */}
      {isCritical && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700 font-semibold mb-1">Crisis Resources</p>
          <p className="text-sm text-red-600">
            Call <a href="tel:911" className="font-bold underline">911</a> for emergencies &bull;{' '}
            <a href="tel:988" className="font-bold underline">988</a> for mental health crisis &bull;{' '}
            <a href="tel:1-800-799-7233" className="font-bold underline">1-800-799-7233</a> for domestic violence
          </p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-brand-text mb-2">{situation.situation_name}</h1>
      {situation.description_5th_grade && (
        <p className="text-brand-muted mb-8 max-w-3xl">{situation.description_5th_grade}</p>
      )}

      {/* Matched Content */}
      {content.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Related Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
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
            ))}
          </div>
        </section>
      )}

      {/* Matched Services */}
      {services.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <ServiceCard
                key={svc.service_id}
                name={svc.service_name}
                orgName={svc.org_name}
                description={svc.description_5th_grade}
                phone={svc.phone}
                address={svc.address}
                city={svc.city}
                state={svc.state}
                zipCode={svc.zip_code}
                website={svc.website}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Learning Path */}
      {relatedPath && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Learning Path</h2>
          <div className="max-w-md">
            <LearningPathCard
              name={relatedPath.path_name}
              description={relatedPath.description_5th_grade}
              themeId={relatedPath.theme_id}
              difficulty={relatedPath.difficulty_level}
              moduleCount={relatedPath.module_count}
              estimatedMinutes={relatedPath.estimated_minutes}
            />
          </div>
        </section>
      )}
    </div>
  )
}
