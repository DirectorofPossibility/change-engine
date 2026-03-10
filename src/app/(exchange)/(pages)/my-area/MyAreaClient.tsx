'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Users, FileText, Building2, Shield, Phone,
  ArrowRight, ChevronDown, ChevronRight, Briefcase, BookOpen, Compass
} from 'lucide-react'
import type { TranslationMap } from '@/lib/types/exchange'
import { THEMES } from '@/lib/constants'
import { CompactCircleGraph } from '@/components/exchange/CompactCircleGraph'
import { ArchetypeSelector } from '@/components/exchange/ArchetypeSelector'
import { trackWayfinderEvent } from '@/lib/wayfinder-analytics'

interface OfficialsByLevel {
  federal: any[]
  state: any[]
  county: any[]
  city: any[]
}

interface PoliciesByLevel {
  federal: any[]
  state: any[]
  city: any[]
}

interface MyAreaClientProps {
  zip: string
  neighborhoodName: string
  councilDistrict: string | null
  officials: OfficialsByLevel
  totalOfficials: number
  policies: PoliciesByLevel
  totalPolicies: number
  services: any[]
  municipal: any
  neighborhoodContent: any[]
  contentTranslations: TranslationMap
  activePathways: string[]
  archetype: string
}

function SectionHeader({ icon: Icon, title, count, color }: {
  icon: any, title: string, count?: number, color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '14' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <h2 className="font-serif font-bold text-brand-text text-lg">{title}</h2>
        {count !== undefined && count > 0 && (
          <p className="text-xs text-brand-muted">{count} found for your area</p>
        )}
      </div>
    </div>
  )
}

function OfficialCard({ official }: { official: any }) {
  const levelColors: Record<string, string> = {
    Federal: '#2B6CB0',
    State: '#7C3AED',
    County: '#CA9B1D',
    City: '#2D8659',
  }
  const color = levelColors[official.level] || '#6C7380'

  return (
    <Link
      href={'/officials/' + official.official_id}
      className="group flex items-start gap-3 p-3 rounded-lg border border-brand-border bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all"
    >
      <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors truncate">
          {official.official_name}
        </p>
        <p className="text-xs text-brand-muted truncate">{official.title || official.office}</p>
        <span className="inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '14', color }}>
          {official.level}
        </span>
      </div>
    </Link>
  )
}

function PolicyCard({ policy }: { policy: any }) {
  const statusColors: Record<string, string> = {
    active: '#2D8659',
    passed: '#2D8659',
    pending: '#CA9B1D',
    introduced: '#2B6CB0',
    failed: '#C53030',
  }
  const status = (policy.status || 'pending').toLowerCase()
  const color = statusColors[status] || '#6C7380'

  return (
    <Link
      href={'/policies/' + policy.policy_id}
      className="group block p-3 rounded-lg border border-brand-border bg-white hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
            {policy.title || policy.policy_name}
          </p>
          {policy.summary_6th_grade && (
            <p className="text-xs text-brand-muted mt-1 line-clamp-2">{policy.summary_6th_grade}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-medium" style={{ color }}>{policy.status || 'Pending'}</span>
            {policy.level && <span className="text-xs text-brand-muted">/ {policy.level}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ServiceCard({ service }: { service: any }) {
  return (
    <Link
      href={'/services/' + service.service_id}
      className="group block p-3 rounded-lg border border-brand-border bg-white hover:shadow-sm transition-all"
    >
      <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
        {service.service_name}
      </p>
      {service.org_name && (
        <p className="text-xs text-brand-muted mt-0.5">{service.org_name}</p>
      )}
      {service.description && (
        <p className="text-xs text-brand-muted mt-1 line-clamp-2">{service.description}</p>
      )}
      {service.phone && (
        <p className="text-xs text-brand-accent mt-1 font-medium">{service.phone}</p>
      )}
    </Link>
  )
}

function ContentCard({ item, translation }: { item: any, translation?: { title?: string, summary?: string } }) {
  const title = translation?.title || item.title_6th_grade || item.title || 'Untitled'
  const summary = translation?.summary || item.summary_6th_grade || item.summary || ''

  return (
    <Link
      href={'/content/' + item.id}
      className="group block p-3 rounded-lg border border-brand-border bg-white hover:shadow-sm transition-all"
    >
      <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
        {title}
      </p>
      {summary && (
        <p className="text-xs text-brand-muted mt-1 line-clamp-2">{summary}</p>
      )}
      {item.source_domain && (
        <p className="text-xs text-brand-muted/60 mt-1">{item.source_domain}</p>
      )}
    </Link>
  )
}

function CollapsibleSection({ title, level, children, defaultOpen = false }: {
  title: string, level: string, children: React.ReactNode, defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-2">
      <button
        onClick={function () { setOpen(!open) }}
        className="flex items-center gap-2 w-full text-left py-1.5"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={14} className="text-brand-muted" /> : <ChevronRight size={14} className="text-brand-muted" />}
        <span className="text-sm font-semibold text-brand-text">{title}</span>
        <span className="text-xs text-brand-muted">({level})</span>
      </button>
      {open && <div className="pl-5 pt-1">{children}</div>}
    </div>
  )
}

const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>

export function MyAreaClient({
  zip,
  neighborhoodName,
  councilDistrict,
  officials,
  totalOfficials,
  policies,
  totalPolicies,
  services,
  municipal,
  neighborhoodContent,
  contentTranslations,
  activePathways,
  archetype,
}: MyAreaClientProps) {

  // Archetype-based section ordering
  const archetypeSections: Record<string, string[]> = {
    seeker: ['pathways', 'services', 'officials', 'policies', 'municipal', 'news', 'action'],
    learner: ['pathways', 'news', 'policies', 'officials', 'services', 'municipal', 'action'],
    builder: ['pathways', 'action', 'services', 'officials', 'news', 'policies', 'municipal'],
    watchdog: ['pathways', 'officials', 'policies', 'news', 'services', 'municipal', 'action'],
    partner: ['pathways', 'officials', 'policies', 'services', 'action', 'news', 'municipal'],
    explorer: ['pathways', 'news', 'services', 'officials', 'policies', 'municipal', 'action'],
  }
  const sectionOrder = archetypeSections[archetype.toLowerCase()] || ['pathways', 'officials', 'policies', 'services', 'municipal', 'news', 'action']

  // Municipal services flattened for display
  const municipalGroups = municipal ? [
    { label: 'Emergency', items: municipal.emergency || [], icon: Shield },
    { label: 'Police', items: municipal.police || [], icon: Shield },
    { label: 'Fire', items: municipal.fire || [], icon: Shield },
    { label: 'Medical', items: municipal.medical || [], icon: Shield },
    { label: 'Parks', items: municipal.parks || [], icon: Building2 },
    { label: 'Library', items: municipal.library || [], icon: BookOpen },
    { label: 'Utilities', items: municipal.utilities || [], icon: Building2 },
  ].filter(function (g) { return g.items.length > 0 }) : []

  // Section renderers keyed by section name
  const sections: Record<string, React.ReactNode> = {
    pathways: (
      <section key="pathways" className="mb-10">
        <div className="bg-white rounded-lg border border-brand-border p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CompactCircleGraph activePathways={activePathways} accentColor="#C75B2A" />
            <div className="flex-1">
              <h2 className="font-serif font-bold text-brand-text text-lg mb-2">Your Pathways</h2>
              <p className="text-xs text-brand-muted mb-3">
                {activePathways.length > 0
                  ? activePathways.length + ' pathways are active in your area'
                  : 'Explore the 7 community pathways'}
              </p>
              <div className="flex flex-wrap gap-2">
                {THEME_KEYS.map(function (key) {
                  const theme = THEMES[key] as { name: string; color: string; slug: string }
                  const isActive = activePathways.includes(key)
                  return (
                    <Link
                      key={key}
                      href={'/pathways/' + theme.slug}
                      className="flex items-center gap-1.5 text-xs py-1 px-2 rounded border border-brand-border hover:border-brand-accent transition-colors"
                      style={{ opacity: isActive ? 1 : 0.5 }}
                      onClick={function () { trackWayfinderEvent('pathway_click', { pathway: theme.slug, source: 'my-area' }) }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                      <span className="text-brand-text">{theme.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Archetype selector */}
        <div className="bg-white rounded-lg border border-brand-border p-5 mt-4">
          <h2 className="font-serif font-bold text-brand-text text-lg mb-1">Your Journey</h2>
          <p className="text-xs text-brand-muted mb-4">Choose how you explore the community. This personalizes the order of sections below.</p>
          <ArchetypeSelector />
        </div>
      </section>
    ),

    officials: (
      <section key="officials" className="mb-10">
        <SectionHeader icon={Users} title="Who Represents You" count={totalOfficials} color="#2B6CB0" />
        {officials.city.length > 0 && (
          <CollapsibleSection title="City of Houston" level={officials.city.length + ' officials'} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {officials.city.map(function (o: any) { return <OfficialCard key={o.official_id} official={o} /> })}
            </div>
          </CollapsibleSection>
        )}
        {officials.county.length > 0 && (
          <CollapsibleSection title="Harris County" level={officials.county.length + ' officials'} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {officials.county.map(function (o: any) { return <OfficialCard key={o.official_id} official={o} /> })}
            </div>
          </CollapsibleSection>
        )}
        {officials.state.length > 0 && (
          <CollapsibleSection title="State of Texas" level={officials.state.length + ' officials'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {officials.state.map(function (o: any) { return <OfficialCard key={o.official_id} official={o} /> })}
            </div>
          </CollapsibleSection>
        )}
        {officials.federal.length > 0 && (
          <CollapsibleSection title="Federal" level={officials.federal.length + ' officials'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {officials.federal.map(function (o: any) { return <OfficialCard key={o.official_id} official={o} /> })}
            </div>
          </CollapsibleSection>
        )}
        {totalOfficials === 0 && (
          <p className="text-sm text-brand-muted italic">No officials found for ZIP {zip}. Try a different ZIP code.</p>
        )}
        <Link href="/officials" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline mt-2">
          View all officials <ArrowRight size={14} />
        </Link>
      </section>
    ),

    policies: (
      <section key="policies" className="mb-10">
        <SectionHeader icon={FileText} title="Policies Affecting Your Area" count={totalPolicies} color="#7C3AED" />
        {policies.city.length > 0 && (
          <CollapsibleSection title="City Ordinances" level={policies.city.length + ' policies'} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {policies.city.slice(0, 6).map(function (p: any) { return <PolicyCard key={p.policy_id} policy={p} /> })}
            </div>
            {policies.city.length > 6 && (
              <Link href="/policies?level=city" className="text-xs font-semibold text-brand-accent hover:underline">
                View all {policies.city.length} city policies
              </Link>
            )}
          </CollapsibleSection>
        )}
        {policies.state.length > 0 && (
          <CollapsibleSection title="State Legislation" level={policies.state.length + ' policies'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {policies.state.slice(0, 6).map(function (p: any) { return <PolicyCard key={p.policy_id} policy={p} /> })}
            </div>
            {policies.state.length > 6 && (
              <Link href="/policies?level=state" className="text-xs font-semibold text-brand-accent hover:underline">
                View all {policies.state.length} state policies
              </Link>
            )}
          </CollapsibleSection>
        )}
        {policies.federal.length > 0 && (
          <CollapsibleSection title="Federal" level={policies.federal.length + ' policies'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {policies.federal.slice(0, 6).map(function (p: any) { return <PolicyCard key={p.policy_id} policy={p} /> })}
            </div>
          </CollapsibleSection>
        )}
        {totalPolicies === 0 && (
          <p className="text-sm text-brand-muted italic">No policies mapped to your districts yet.</p>
        )}
        <Link href="/policies" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline mt-2">
          Browse all policies <ArrowRight size={14} />
        </Link>
      </section>
    ),

    services: (
      <section key="services" className="mb-10">
        <SectionHeader icon={Building2} title="Services Near You" count={services.length} color="#2D8659" />
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.slice(0, 9).map(function (s: any) { return <ServiceCard key={s.service_id} service={s} /> })}
          </div>
        ) : (
          <p className="text-sm text-brand-muted italic">No 211 services found for ZIP {zip}.</p>
        )}
        {services.length > 9 && (
          <Link href={'/services?zip=' + zip} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline mt-3">
            View all {services.length} services <ArrowRight size={14} />
          </Link>
        )}
      </section>
    ),

    municipal: municipalGroups.length > 0 ? (
      <section key="municipal" className="mb-10">
        <SectionHeader icon={Phone} title="City Services" count={undefined} color="#CA9B1D" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {municipalGroups.map(function (group) {
            return (
              <div key={group.label} className="bg-white rounded-lg border border-brand-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <group.icon size={16} className="text-brand-muted" />
                  <h3 className="text-sm font-bold text-brand-text">{group.label}</h3>
                </div>
                <ul className="space-y-1.5">
                  {group.items.slice(0, 3).map(function (item: any, i: number) {
                    return (
                      <li key={i} className="text-xs text-brand-muted">
                        <span className="font-medium text-brand-text">{item.service_name || item.name}</span>
                        {item.phone && <span className="block text-brand-accent">{item.phone}</span>}
                        {item.address && <span className="block">{item.address}</span>}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    ) : null,

    news: neighborhoodContent.length > 0 ? (
      <section key="news" className="mb-10">
        <SectionHeader icon={BookOpen} title={'News from ' + neighborhoodName} count={neighborhoodContent.length} color="#D97315" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {neighborhoodContent.slice(0, 6).map(function (item: any) {
            const tr = contentTranslations[item.inbox_id || item.id]
            return <ContentCard key={item.id} item={item} translation={tr} />
          })}
        </div>
      </section>
    ) : null,

    action: (
      <section key="action" className="mb-10">
        <SectionHeader icon={Briefcase} title="What You Can Do" count={undefined} color="#E8723A" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/opportunities" className="group block p-5 rounded-lg border border-brand-border bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors">Volunteer</h3>
            <p className="text-xs text-brand-muted mt-1">Find opportunities to give your time and skills</p>
          </Link>
          <Link href="/organizations" className="group block p-5 rounded-lg border border-brand-border bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors">Organizations</h3>
            <p className="text-xs text-brand-muted mt-1">Connect with groups working in your community</p>
          </Link>
          <Link href="/foundations" className="group block p-5 rounded-lg border border-brand-border bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors">Foundations</h3>
            <p className="text-xs text-brand-muted mt-1">Explore funding and grantmaking in your focus areas</p>
          </Link>
        </div>
      </section>
    ),
  }

  return (
    <div className="mt-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="bg-white rounded-lg border border-brand-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-brand-text">{totalOfficials}</p>
          <p className="text-xs text-brand-muted mt-1">Representatives</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-brand-text">{totalPolicies}</p>
          <p className="text-xs text-brand-muted mt-1">Active Policies</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-brand-text">{services.length}</p>
          <p className="text-xs text-brand-muted mt-1">Nearby Services</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-brand-text">{neighborhoodContent.length}</p>
          <p className="text-xs text-brand-muted mt-1">Local Updates</p>
        </div>
      </div>

      {/* Sections rendered in archetype-driven order */}
      {sectionOrder.map(function (key) { return sections[key] })}
    </div>
  )
}
