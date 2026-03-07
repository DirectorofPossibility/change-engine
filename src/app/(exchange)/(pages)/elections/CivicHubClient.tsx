'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { SearchBar } from '@/components/exchange/SearchBar'
import { useTranslation } from '@/lib/use-translation'
import { Landmark, Star, Building2, Building } from 'lucide-react'
import type { ElectedOfficial, TranslationMap } from '@/lib/types/exchange'
import { TurnoutLabel, CertifiedBadge } from './ElectionsSectionHeaders'

/* ── Tab definitions ── */

const TABS = [
  { level: 'City',    label: 'Houston',      color: '#38a169', Icon: Building },
  { level: 'County',  label: 'Harris County', color: '#d69e2e', Icon: Building2 },
  { level: 'State',   label: 'Texas',        color: '#805ad5', Icon: Star },
  { level: 'Federal', label: 'Federal',      color: '#3182ce', Icon: Landmark },
] as const

/** Map election jurisdiction values to government levels. */
const JURISDICTION_TO_LEVEL: Record<string, string> = {
  'Houston': 'City',
  'Harris County': 'County',
  'Texas': 'State',
}

/* ── Types ── */

interface CivicHubClientProps {
  officials: ElectedOfficial[]
  policies: any[]
  elections: any[]
  officialTranslations: TranslationMap
  policyTranslations: TranslationMap
  linkedinProfiles?: Record<string, string>
}

/* ── Component ── */

export function CivicHubClient({
  officials,
  policies,
  elections,
  officialTranslations,
  policyTranslations,
  linkedinProfiles = {},
}: CivicHubClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialLevel = searchParams.get('level') || 'City'
  const [activeTab, setActiveTab] = useState(initialLevel)
  const [search, setSearch] = useState('')

  function handleTabChange(level: string) {
    setActiveTab(level)
    setSearch('')
    const params = new URLSearchParams(searchParams.toString())
    params.set('level', level)
    router.replace('?' + params.toString(), { scroll: false })
  }

  /* ── Filter data for active tab ── */

  const filteredOfficials = useMemo(() => {
    return officials.filter(function (o) {
      if (o.level !== activeTab) return false
      if (search && !o.official_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [officials, activeTab, search])

  const filteredPolicies = useMemo(() => {
    return policies.filter(function (p) {
      return p.level === activeTab
    })
  }, [policies, activeTab])

  const filteredElections = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return elections.filter(function (e) {
      const electionLevel = JURISDICTION_TO_LEVEL[e.jurisdiction] || 'State'
      if (electionLevel === activeTab) return true
      // General elections are relevant at Federal level too
      if (activeTab === 'Federal' && (e.election_type === 'General' || e.election_type === 'Primary') && e.jurisdiction === 'Texas') return true
      return false
    })
  }, [elections, activeTab])

  const futureElections = filteredElections.filter(function (e) {
    const today = new Date().toISOString().split('T')[0]
    return e.election_date && e.election_date >= today
  })
  const pastElections = filteredElections.filter(function (e) {
    const today = new Date().toISOString().split('T')[0]
    return !e.election_date || e.election_date < today
  })

  /* ── Tab accent color for section headers ── */
  const currentTab = TABS.find(function (tab) { return tab.level === activeTab })
  const accentColor = currentTab?.color || '#38a169'

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(function (tab) {
          const count = officials.filter(function (o) { return o.level === tab.level }).length
          const pCount = policies.filter(function (p) { return p.level === tab.level }).length
          const isActive = activeTab === tab.level
          const Icon = tab.Icon

          return (
            <button
              key={tab.level}
              onClick={function () { handleTabChange(tab.level) }}
              className={
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' +
                (isActive
                  ? 'text-white shadow-md'
                  : 'bg-white border-2 hover:shadow-sm')
              }
              style={isActive
                ? { backgroundColor: tab.color }
                : { borderColor: tab.color, color: tab.color }
              }
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className={'text-xs ' + (isActive ? 'opacity-80' : 'opacity-60')}>
                {count} officials
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Section 1: Representatives ── */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <span
              className="w-1.5 h-6 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {t('civicHub.representatives')}
            <span className="text-sm font-normal text-brand-muted">
              ({filteredOfficials.length})
            </span>
          </h2>
          <div className="w-full sm:w-64">
            <SearchBar
              placeholder={t('civicHub.search_officials')}
              onSearch={setSearch}
            />
          </div>
        </div>

        {filteredOfficials.length === 0 ? (
          <p className="text-brand-muted text-sm py-6 text-center">{t('civicHub.no_officials')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficials.map(function (o) {
              const tr = officialTranslations[o.official_id]
              return (
                <OfficialCard
                  key={o.official_id}
                  id={o.official_id}
                  name={o.official_name}
                  title={o.title}
                  party={o.party}
                  level={o.level}
                  email={o.email}
                  phone={o.office_phone}
                  website={o.website}
                  photoUrl={(o as any).photo_url}
                  linkedinUrl={linkedinProfiles[o.official_id]}
                  translatedTitle={tr?.title}
                />
              )
            })}
          </div>
        )}

        {filteredOfficials.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href={'/officials'}
              className="text-sm text-brand-accent hover:underline"
            >
              {t('civicHub.view_all_officials')} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* ── Section 2: Policies ── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-brand-text flex items-center gap-2 mb-4">
          <span
            className="w-1.5 h-6 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {t('civicHub.policies')}
          <span className="text-sm font-normal text-brand-muted">
            ({filteredPolicies.length})
          </span>
        </h2>

        {filteredPolicies.length === 0 ? (
          <p className="text-brand-muted text-sm py-6 text-center">{t('civicHub.no_policies')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPolicies.map(function (p) {
              const tr = policyTranslations[p.policy_id]
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                  <PolicyCard
                    name={p.title_6th_grade || p.policy_name}
                    summary={p.summary_6th_grade || p.summary_5th_grade}
                    billNumber={p.bill_number}
                    status={p.status}
                    level={p.level}
                    sourceUrl={p.source_url}
                    translatedName={tr?.title}
                    translatedSummary={tr?.summary}
                  />
                </Link>
              )
            })}
          </div>
        )}

        {filteredPolicies.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href={'/policies'}
              className="text-sm text-brand-accent hover:underline"
            >
              {t('civicHub.view_all_policies')} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* ── Section 3: Elections ── */}
      <section>
        <h2 className="text-xl font-bold text-brand-text flex items-center gap-2 mb-4">
          <span
            className="w-1.5 h-6 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {t('civicHub.elections')}
          <span className="text-sm font-normal text-brand-muted">
            ({filteredElections.length})
          </span>
        </h2>

        {filteredElections.length === 0 ? (
          <p className="text-brand-muted text-sm py-6 text-center">{t('civicHub.no_elections')}</p>
        ) : (
          <div>
            {/* Upcoming */}
            {futureElections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
                  {t('elections.upcoming')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {futureElections.map(function (e) {
                    return (
                      <Link
                        key={e.election_id}
                        href={'/elections/' + e.election_id}
                        className="bg-white rounded-xl border-2 border-brand-border p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-brand-text">{e.election_name}</h4>
                        </div>
                        {e.election_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">
                            {e.election_type}
                          </span>
                        )}
                        {e.election_date && (
                          <p className="text-sm text-brand-muted mt-2">
                            {new Date(e.election_date + 'T00:00:00').toLocaleDateString()}
                          </p>
                        )}
                        {e.jurisdiction && (
                          <p className="text-xs text-brand-muted mt-1">{e.jurisdiction}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {pastElections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
                  {t('elections.past')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastElections.map(function (e) {
                    return (
                      <Link
                        key={e.election_id}
                        href={'/elections/' + e.election_id}
                        className="bg-white rounded-xl border-2 border-brand-border p-5 hover:shadow-md transition-shadow opacity-75"
                      >
                        <h4 className="font-semibold text-brand-text mb-1">{e.election_name}</h4>
                        {e.election_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">
                            {e.election_type}
                          </span>
                        )}
                        {e.election_date && (
                          <p className="text-sm text-brand-muted mt-2">
                            {new Date(e.election_date + 'T00:00:00').toLocaleDateString()}
                          </p>
                        )}
                        {e.turnout_pct != null && <TurnoutLabel pct={e.turnout_pct} />}
                        {e.results_certified === 'Yes' && <CertifiedBadge />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
