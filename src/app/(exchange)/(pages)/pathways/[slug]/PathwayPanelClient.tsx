'use client'

import { useState } from 'react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { WayfinderPanel, type PanelData } from '@/components/exchange/WayfinderPanel'

/* ── Section heading (duplicated from page.tsx to keep this self-contained) ── */

const SECTION_ICONS: Record<string, string> = {
  services: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  officials: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  policies: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
  opportunities: 'M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m7.846-9.772H5.904m7.846 0a3 3 0 00-2.266-1.03H5.904a2.25 2.25 0 00-2.154 1.63l-2 6.75A2.25 2.25 0 003.904 18h.696',
  situations: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  paths: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
}

function SectionHeading({ icon, title, count, color }: { icon: string; title: string; count: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: (color || '#8B7E74') + '14' }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color || '#8B7E74'}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-display font-bold text-brand-text">{title}</h2>
        <span className="text-sm text-brand-muted">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>
    </div>
  )
}

/* ── Types for the raw DB rows passed from the server page ── */

interface ServiceRow {
  service_id: string
  service_name: string | null
  description_5th_grade: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  website: string | null
  org_name?: string | null
  org_id?: string | null
}

interface OfficialRow {
  official_id: string
  official_name: string | null
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  office_phone: string | null
  website: string | null
  photo_url?: string | null
}

interface PolicyRow {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  summary_5th_grade: string | null
  summary_6th_grade: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  source_url: string | null
}

interface OpportunityRow {
  opportunity_id: string
  opportunity_name: string
  description_5th_grade: string | null
  start_date: string | null
  end_date: string | null
  address: string | null
  city: string | null
  is_virtual: string | null
  registration_url: string | null
  spots_available: number | null
}

interface SituationRow {
  situation_id: string
  situation_name: string
  situation_slug: string | null
  description_5th_grade: string | null
  urgency_level: string | null
  icon_name: string | null
  theme_id: string | null
}

interface PathRow {
  path_id: string
  path_name: string
  description_5th_grade: string | null
  theme_id: string | null
  difficulty_level: string | null
  module_count: number | null
  estimated_minutes: number | null
}

type TransMap = Record<string, { title?: string; summary?: string }>

export interface PathwayPanelClientProps {
  themeColor: string
  services: ServiceRow[]
  officials: OfficialRow[]
  policies: PolicyRow[]
  opportunities: OpportunityRow[]
  situations: SituationRow[]
  paths: PathRow[]
  serviceTranslations: TransMap
  officialTranslations: TransMap
  policyTranslations: TransMap
  opportunityTranslations: TransMap
}

export function PathwayPanelClient({
  themeColor,
  services,
  officials,
  policies,
  opportunities,
  situations,
  paths,
  serviceTranslations,
  officialTranslations,
  policyTranslations,
  opportunityTranslations,
}: PathwayPanelClientProps) {
  const [panelData, setPanelData] = useState<PanelData | null>(null)

  /* ── Mappers: raw DB row → PanelData ── */

  function selectService(svc: ServiceRow) {
    const t = serviceTranslations[svc.service_id]
    setPanelData({
      type: 'service',
      id: svc.service_id,
      title: t?.title || svc.service_name || '',
      summary: t?.summary || svc.description_5th_grade || undefined,
      phone: svc.phone || undefined,
      address: svc.address || undefined,
      city: svc.city || undefined,
      state: svc.state || undefined,
      zipCode: svc.zip_code || undefined,
      website: svc.website || undefined,
      orgName: svc.org_name || undefined,
      orgId: svc.org_id || undefined,
      pathwayColor: themeColor,
    })
  }

  function selectOfficial(o: OfficialRow) {
    const t = officialTranslations[o.official_id]
    setPanelData({
      type: 'official',
      id: o.official_id,
      title: o.official_name || '',
      summary: t?.title || o.title || undefined,
      role: o.title || undefined,
      party: o.party || undefined,
      phone: o.office_phone || undefined,
      email: o.email || undefined,
      website: o.website || undefined,
      pathwayColor: themeColor,
    })
  }

  function selectPolicy(p: PolicyRow) {
    const t = policyTranslations[p.policy_id]
    setPanelData({
      type: 'policy',
      id: p.policy_id,
      title: t?.title || p.policy_name,
      summary: t?.summary || p.summary_5th_grade || undefined,
      status: p.status || undefined,
      billNumber: p.bill_number || undefined,
      pathwayColor: themeColor,
    })
  }

  function selectOpportunity(o: OpportunityRow) {
    const t = opportunityTranslations[o.opportunity_id]
    setPanelData({
      type: 'opportunity',
      id: o.opportunity_id,
      title: t?.title || o.opportunity_name,
      summary: t?.summary || o.description_5th_grade || undefined,
      startDate: o.start_date,
      endDate: o.end_date,
      address: o.address || undefined,
      city: o.city || undefined,
      isVirtual: o.is_virtual,
      registrationUrl: o.registration_url || undefined,
      spotsAvailable: o.spots_available,
      pathwayColor: themeColor,
    })
  }

  function selectSituation(s: SituationRow) {
    setPanelData({
      type: 'situation',
      id: s.situation_id,
      title: s.situation_name,
      summary: s.description_5th_grade || undefined,
      urgency: s.urgency_level,
      slug: s.situation_slug,
      pathwayColor: themeColor,
    })
  }

  function selectPath(p: PathRow) {
    setPanelData({
      type: 'path',
      id: p.path_id,
      title: p.path_name,
      summary: p.description_5th_grade || undefined,
      difficulty: p.difficulty_level,
      moduleCount: p.module_count,
      estimatedMinutes: p.estimated_minutes,
      themeId: p.theme_id,
      pathwayColor: themeColor,
    })
  }

  return (
    <>
      {/* ── Services ── */}
      {services.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.services} title="Services" count={services.length} color="#26BDE2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(function (svc) {
              const t = serviceTranslations[svc.service_id]
              return (
                <ServiceCard
                  key={svc.service_id}
                  serviceId={svc.service_id}
                  name={svc.service_name || ''}
                  description={svc.description_5th_grade}
                  phone={svc.phone}
                  address={svc.address}
                  city={svc.city}
                  state={svc.state}
                  zipCode={svc.zip_code}
                  website={svc.website}
                  translatedName={t?.title}
                  translatedDescription={t?.summary}
                  onSelect={function () { selectService(svc) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Elected Officials ── */}
      {officials.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.officials} title="Elected Officials" count={officials.length} color="#1b5e8a" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map(function (o) {
              const t = officialTranslations[o.official_id]
              return (
                <OfficialCard
                  key={o.official_id}
                  id={o.official_id}
                  name={o.official_name || ''}
                  title={o.title}
                  party={o.party}
                  level={o.level}
                  email={o.email}
                  phone={o.office_phone}
                  website={o.website}
                  translatedTitle={t?.title}
                  onSelect={function () { selectOfficial(o) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Policies ── */}
      {policies.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.policies} title="Policies" count={policies.length} color="#8B6BA8" />
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
                  onSelect={function () { selectPolicy(p) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Opportunities ── */}
      {opportunities.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.opportunities} title="Opportunities" count={opportunities.length} color="#DD1367" />
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
                  onSelect={function () { selectOpportunity(o) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Life Situations ── */}
      {situations.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.situations} title="Available Resources" count={situations.length} color="#7a2018" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {situations.map(function (s) {
              return (
                <LifeSituationCard
                  key={s.situation_id}
                  name={s.situation_name}
                  slug={s.situation_slug}
                  description={s.description_5th_grade || null}
                  urgency={s.urgency_level}
                  iconName={s.icon_name}
                  onSelect={function () { selectSituation(s) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Learning Paths ── */}
      {paths.length > 0 && (
        <section className="py-8 border-t border-brand-border">
          <SectionHeading icon={SECTION_ICONS.paths} title="Learning Paths" count={paths.length} color="#4C9F38" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map(function (p) {
              return (
                <LearningPathCard
                  key={p.path_id}
                  name={p.path_name}
                  description={p.description_5th_grade}
                  themeId={p.theme_id}
                  difficulty={p.difficulty_level}
                  moduleCount={p.module_count}
                  estimatedMinutes={p.estimated_minutes}
                  onSelect={function () { selectPath(p) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Detail Panel ── */}
      <WayfinderPanel
        panel={panelData}
        onClose={function () { setPanelData(null) }}
      />
    </>
  )
}
