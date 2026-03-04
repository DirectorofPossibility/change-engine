import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getLifeSituation, getLifeSituationContent, getLearningPaths,
  getRelatedOpportunities, getRelatedPolicies,
  getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { ContentCard } from '@/components/exchange/ContentCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { HelpMap } from '@/components/exchange/HelpMap'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const situation = await getLifeSituation(slug)
  if (!situation) return { title: 'Not Found' }
  return {
    title: situation.situation_name,
    description: situation.description_5th_grade || 'Details on The Change Engine.',
  }
}

export default async function HelpDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const situation = await getLifeSituation(slug)
  if (!situation) notFound()

  const isCritical = situation.urgency_level === 'Critical'

  // Get focus area IDs from junction table (replaces comma-separated text parsing)
  const supabase = await createClient()
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situation.situation_id)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)

  const [{ content, services }, paths, opportunities, policies] = await Promise.all([
    getLifeSituationContent(situation.situation_id, situation.service_cat_ids),
    situation.path_id ? getLearningPaths() : Promise.resolve([]),
    getRelatedOpportunities(focusIds),
    getRelatedPolicies(focusIds),
  ])

  const relatedPath = paths.find(function (p) { return p.path_id === situation.path_id })

  // Fetch translations for non-English
  const langId = await getLangId()
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  let opportunityTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const cIds = content.map(function (c) { return c.inbox_id }).filter(function (id): id is string { return id != null })
    const sIds = services.map(function (s) { return s.service_id })
    const oIds = opportunities.map(function (o) { return o.opportunity_id })
    const pIds = policies.map(function (p) { return p.policy_id })
    ;[contentTranslations, serviceTranslations, opportunityTranslations, policyTranslations] = await Promise.all([
      cIds.length > 0 ? fetchTranslationsForTable('content_published', cIds, langId) : {},
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
      oIds.length > 0 ? fetchTranslationsForTable('opportunities', oIds, langId) : {},
      pIds.length > 0 ? fetchTranslationsForTable('policies', pIds, langId) : {},
    ])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Available Resources', href: '/help' }, { label: situation.situation_name }]} />

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

      {/* Map of services and opportunities */}
      <HelpMap services={services} opportunities={opportunities} />

      {/* Matched Content */}
      {content.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Related Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map(function (item) {
              const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
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
                  imageUrl={item.image_url ?? null}
                  translatedTitle={ct?.title}
                  translatedSummary={ct?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Matched Services */}
      {services.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(function (svc) {
              const st = serviceTranslations[svc.service_id]
              return (
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
                  translatedName={st?.title}
                  translatedDescription={st?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map(function (o) {
              const ot = opportunityTranslations[o.opportunity_id]
              return (
                <OpportunityCard
                  key={o.opportunity_id}
                  name={o.opportunity_name}
                  description={o.description_5th_grade}
                  startDate={o.start_date}
                  endDate={o.end_date}
                  address={o.address}
                  city={o.city}
                  isVirtual={o.is_virtual}
                  registrationUrl={o.registration_url}
                  spotsAvailable={o.spots_available}
                  translatedName={ot?.title}
                  translatedDescription={ot?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Policies */}
      {policies.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Related Policies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map(function (p) {
              const pt = policyTranslations[p.policy_id]
              return (
                <PolicyCard
                  key={p.policy_id}
                  name={p.title_6th_grade || p.policy_name}
                  summary={p.summary_6th_grade || p.summary_5th_grade}
                  billNumber={p.bill_number}
                  status={p.status}
                  level={p.level}
                  sourceUrl={p.source_url}
                  translatedName={pt?.title}
                  translatedSummary={pt?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Related Learning Path */}
      {relatedPath && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Learning Path</h2>
          <div className="max-w-md">
            <Link href={'/learn/' + relatedPath.path_id}>
              <LearningPathCard
                name={relatedPath.path_name}
                description={relatedPath.description_5th_grade}
                themeId={relatedPath.theme_id}
                difficulty={relatedPath.difficulty_level}
                moduleCount={relatedPath.module_count}
                estimatedMinutes={relatedPath.estimated_minutes}
              />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
