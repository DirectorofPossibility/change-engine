import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  getLifeSituation, getLifeSituationContent, getLearningPaths,
  getRelatedOpportunities, getRelatedPolicies,
  getLangId, fetchTranslationsForTable, getWayfinderContext,
} from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { ContentCard } from '@/components/exchange/ContentCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { HelpMap } from '@/components/exchange/HelpMap'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { getLibraryNuggets } from '@/lib/data/library'

export const revalidate = 3600


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const situation = await getLifeSituation(slug)
  if (!situation) return { title: 'Not Found' }
  return {
    title: situation.situation_name,
    description: situation.description_5th_grade || 'Details on the Change Engine.',
  }
}

export default async function HelpDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const situation = await getLifeSituation(slug)
  if (!situation) notFound()

  const isCritical = situation.urgency_level === 'Critical'

  const supabase = await createClient()
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situation.situation_id)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)

  const [{ content, services }, paths, opportunities, policies, libraryNuggets] = await Promise.all([
    getLifeSituationContent(situation.situation_id, situation.service_cat_ids),
    situation.path_id ? getLearningPaths() : Promise.resolve([]),
    getRelatedOpportunities(focusIds),
    getRelatedPolicies(focusIds),
    getLibraryNuggets([], focusIds, 2),
  ])

  const relatedPath = paths.find(function (p) { return p.path_id === situation.path_id })

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

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('life_situation', situation.situation_id, userProfile?.role)

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {situation.situation_name}
          </h1>
          {situation.description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {situation.description_5th_grade}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/help" className="hover:underline" style={{ color: "#1b5e8a" }}>Available Resources</Link>
          <span className="mx-2">/</span>
          <span>{situation.situation_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Crisis banner for Critical */}
        {isCritical && (
          <div className="p-4 mb-6" style={{ border: '1px solid #c00', background: '#fef2f2' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>Crisis Resources</p>
            <p style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
              Call <a href="tel:911" className="font-bold underline">911</a> for emergencies &bull;{' '}
              <a href="tel:988" className="font-bold underline">988</a> for mental health crisis &bull;{' '}
              <a href="tel:1-800-799-7233" className="font-bold underline">1-800-799-7233</a> for domestic violence
            </p>
          </div>
        )}

        {/* Map of services and opportunities */}
        <HelpMap services={services} opportunities={opportunities} />

        {/* Matched Content */}
        {content.length > 0 && (
          <section className="mb-10 mt-8">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Related Resources</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{content.length} resources</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

        {/* Library Nuggets */}
        <LibraryNugget nuggets={libraryNuggets} variant="inline" />

        {/* Matched Services */}
        {services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Services</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{services.length} services</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {services.map(function (svc: any) {
                const st = serviceTranslations[svc.service_id]
                return (
                  <ServiceCard
                    key={svc.service_id}
                    name={svc.service_name}
                    orgName={svc.org_name}
                    description={svc.description_5th_grade || null}
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
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Opportunities</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{opportunities.length} opportunities</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Related Policies</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{policies.length} policies</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Learning Path</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '0.5rem' }} />
            <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>1 path</span>
            <div className="max-w-md mt-4">
              <Link href={'/learn/' + ((relatedPath as any).slug || relatedPath.path_id)}>
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

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/help" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Available Resources
        </Link>
      </div>
    </div>
  )
}
