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

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-12 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            {situation.situation_name}
          </h1>
          {situation.description_5th_grade && (
            <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base max-w-xl mx-auto leading-relaxed">
              {situation.description_5th_grade}
            </p>
          )}
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/help" className="hover:underline">Available Resources</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>{situation.situation_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Crisis banner for Critical */}
        {isCritical && (
          <div className="border p-4 mb-6" style={{ borderColor: '#c00', background: '#fef2f2' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#991b1b' }}>Crisis Resources</p>
            <p className="text-sm" style={{ color: '#b91c1c' }}>
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
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Related Resources</h2>
            <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
              <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{content.length} resources</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Services</h2>
            <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
              <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{services.length} services</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Opportunities</h2>
            <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
              <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{opportunities.length} opportunities</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Related Policies</h2>
            <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
              <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{policies.length} policies</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Learning Path</h2>
            <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2 mb-4">
              <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">1 path</span>
            </div>
            <div className="max-w-md">
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

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Footer */}
        <div className="text-center">
          <Link href="/help" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
            Back to Available Resources
          </Link>
        </div>
      </div>
    </div>
  )
}
