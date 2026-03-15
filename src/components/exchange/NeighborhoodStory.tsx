'use client'

/**
 * @fileoverview "State of My Neighborhood" data story component.
 *
 * Renders a visual narrative of a neighborhood's civic profile:
 * demographics, representatives, community resources, recent activity,
 * and civic engagement opportunities.
 *
 * Designed for mobile-first, card-based layout using brand colors.
 */

import Link from 'next/link'
import {
  Users, DollarSign, MapPin, Building2, Landmark,
  Scale, Newspaper, Vote, Calendar, ExternalLink,
  ChevronRight, Phone, Globe, Briefcase, Heart,
  GraduationCap, Home, ShieldCheck,
} from 'lucide-react'
import { THEMES, LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import type { NeighborhoodStoryData, ServiceCategoryCount } from '@/lib/data/neighborhood-story'

// ── Category icon mapping ──

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Health: <Heart size={16} />,
  Education: <GraduationCap size={16} />,
  Housing: <Home size={16} />,
  Employment: <Briefcase size={16} />,
  'Legal Aid': <Scale size={16} />,
  Safety: <ShieldCheck size={16} />,
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || <Building2 size={16} />
}

// ── Section wrapper ──

function StorySection({
  title,
  icon,
  color,
  children,
}: {
  title: string
  icon: React.ReactNode
  color: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <h2 className="text-xl font-display font-bold text-brand-text">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ── Format helpers ──

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// ── Main component ──

interface NeighborhoodStoryProps {
  data: NeighborhoodStoryData
}

export function NeighborhoodStory({ data }: NeighborhoodStoryProps) {
  const { neighborhood, superNeighborhoodName, stats, serviceCategoryCounts, topServices, officials, recentPolicies, recentContent, upcomingElections } = data

  // Group officials by level for display order
  const officialsByLevel: Record<string, typeof officials> = {}
  const levelOrder = ['City', 'County', 'State', 'Federal']
  for (const o of officials) {
    const level = o.level || 'Other'
    if (!officialsByLevel[level]) officialsByLevel[level] = []
    officialsByLevel[level].push(o)
  }

  return (
    <div className="space-y-2">
      {/* ── Section 1: At a Glance ── */}
      <StorySection
        title="At a Glance"
        icon={<MapPin size={18} />}
        color={THEMES.THEME_03.color}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {neighborhood.population != null && (
            <StatCard
              icon={<Users size={18} />}
              value={neighborhood.population.toLocaleString()}
              label="Population"
              color={THEMES.THEME_03.color}
            />
          )}
          {neighborhood.median_income != null && (
            <StatCard
              icon={<DollarSign size={18} />}
              value={'$' + neighborhood.median_income.toLocaleString()}
              label="Median Income"
              color={THEMES.THEME_05.color}
            />
          )}
          {neighborhood.council_district && (
            <StatCard
              icon={<Landmark size={18} />}
              value={neighborhood.council_district}
              label="Council District"
              color={THEMES.THEME_04.color}
            />
          )}
          <StatCard
            icon={<Building2 size={18} />}
            value={String(stats.serviceCount)}
            label="Active Services"
            color={THEMES.THEME_01.color}
          />
          <StatCard
            icon={<Building2 size={18} />}
            value={String(stats.organizationCount)}
            label="Organizations"
            color={THEMES.THEME_07.color}
          />
          <StatCard
            icon={<Landmark size={18} />}
            value={String(stats.officialCount)}
            label="Representatives"
            color={THEMES.THEME_04.color}
          />
        </div>

        {superNeighborhoodName && (
          <p className="text-sm text-brand-muted mt-3">
            Part of the <span className="font-medium text-brand-text">{superNeighborhoodName}</span> super neighborhood
          </p>
        )}

        {neighborhood.description && (
          <p className="text-sm text-brand-muted mt-3 leading-relaxed max-w-3xl">
            {neighborhood.description}
          </p>
        )}
      </StorySection>

      {/* ── Section 2: Your Representatives ── */}
      {officials.length > 0 && (
        <StorySection
          title="Your Representatives"
          icon={<Landmark size={18} />}
          color={THEMES.THEME_04.color}
        >
          <div className="space-y-4">
            {levelOrder.map(function (level) {
              const group = officialsByLevel[level]
              if (!group || group.length === 0) return null
              return (
                <div key={level}>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted mb-2">
                    {level}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.map(function (official) {
                      const levelColor = LEVEL_COLORS[official.level || ''] || DEFAULT_LEVEL_COLOR
                      return (
                        <Link
                          key={official.official_id}
                          href={'/officials/' + official.official_id}
                          className="bg-white border border-brand-border p-4 hover:border-ink hover:border-brand-accent/30 transition-all flex items-start gap-3"
                        >
                          <div
                            className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: levelColor }}
                          >
                            {(official.official_name || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-text text-sm truncate">
                              {official.official_name}
                            </p>
                            <p className="text-xs text-brand-muted truncate">
                              {official.title}
                            </p>
                            {official.party && (
                              <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-brand-muted mt-1 bg-brand-bg rounded px-1.5 py-0.5">
                                {official.party}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <Link
            href="/officials/lookup"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline mt-4"
          >
            See all your representatives <ChevronRight size={14} />
          </Link>
        </StorySection>
      )}

      {/* ── Section 3: Community Resources ── */}
      {(serviceCategoryCounts.length > 0 || topServices.length > 0) && (
        <StorySection
          title="Community Resources"
          icon={<Heart size={18} />}
          color={THEMES.THEME_01.color}
        >
          {/* Category breakdown */}
          {serviceCategoryCounts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
              {serviceCategoryCounts.slice(0, 8).map(function (cat) {
                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2.5 bg-white border border-brand-border px-3 py-2.5"
                  >
                    <span className="text-brand-accent">{getCategoryIcon(cat.category)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-text truncate">{cat.category}</p>
                      <p className="text-xs text-brand-muted">{cat.count} service{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top services */}
          {topServices.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-brand-text mb-2">Nearby Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topServices.map(function (svc) {
                  return (
                    <Link
                      key={svc.service_id}
                      href={'/services/' + svc.service_id}
                      className="bg-white border border-brand-border p-4 hover:border-ink hover:border-brand-accent/30 transition-all"
                    >
                      <h4 className="font-semibold text-brand-text text-sm line-clamp-2">
                        {svc.service_name}
                      </h4>
                      {svc.description_5th_grade && (
                        <p className="text-xs text-brand-muted mt-1 line-clamp-2">
                          {svc.description_5th_grade}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
                        {svc.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {svc.phone}
                          </span>
                        )}
                        {svc.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {svc.city}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline mt-4"
          >
            Browse all services <ChevronRight size={14} />
          </Link>
        </StorySection>
      )}

      {/* ── Section 4: Recent Activity ── */}
      {(recentPolicies.length > 0 || recentContent.length > 0) && (
        <StorySection
          title="Recent Activity"
          icon={<Newspaper size={18} />}
          color={THEMES.THEME_06.color}
        >
          {/* Policies */}
          {recentPolicies.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-brand-text mb-2 flex items-center gap-1.5">
                <Scale size={14} className="text-brand-accent" />
                Legislation and Policy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentPolicies.map(function (policy) {
                  const levelColor = LEVEL_COLORS[policy.level || ''] || DEFAULT_LEVEL_COLOR
                  return (
                    <Link
                      key={policy.policy_id}
                      href={'/policies/' + policy.policy_id}
                      className="bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {policy.level && (
                          <span
                            className="text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: levelColor }}
                          >
                            {policy.level}
                          </span>
                        )}
                        {policy.status && (
                          <span className="text-xs text-brand-muted">{policy.status}</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-brand-text text-sm line-clamp-2">
                        {policy.title_6th_grade || policy.policy_name}
                      </h4>
                      {policy.bill_number && (
                        <p className="text-xs font-mono text-brand-muted mt-1">{policy.bill_number}</p>
                      )}
                      {policy.last_action_date && (
                        <p className="text-xs text-brand-muted mt-1">{formatDate(policy.last_action_date)}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* News / Content */}
          {recentContent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-text mb-2 flex items-center gap-1.5">
                <Newspaper size={14} className="text-brand-accent" />
                Community News
              </h3>
              <div className="space-y-2">
                {recentContent.map(function (item) {
                  const themeColor = item.pathway_primary
                    ? (THEMES as any)[item.pathway_primary]?.color || THEMES.THEME_03.color
                    : THEMES.THEME_03.color
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="flex items-start gap-3 bg-white border border-brand-border p-3 hover:border-ink transition-shadow"
                    >
                      <div
                        className="w-1.5 h-10 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: themeColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand-text text-sm line-clamp-1">
                          {item.title_6th_grade || 'Untitled'}
                        </p>
                        {item.summary_6th_grade && (
                          <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">
                            {item.summary_6th_grade}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                          {item.content_type && <span className="capitalize">{item.content_type}</span>}
                          {item.published_at && <span>{formatDate(item.published_at)}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </StorySection>
      )}

      {/* ── Section 5: Civic Engagement ── */}
      <StorySection
        title="Civic Engagement"
        icon={<Vote size={18} />}
        color={THEMES.THEME_04.color}
      >
        {upcomingElections.length > 0 ? (
          <div className="space-y-3 mb-5">
            {upcomingElections.map(function (election, i) {
              const days = daysUntil(election.election_date)
              const isUrgent = days <= 30
              return (
                <div
                  key={i}
                  className={
                    'bg-white border p-4 ' +
                    (isUrgent ? 'border-brand-accent/40' : 'border-brand-border')
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-brand-text text-sm">
                        {election.election_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                        <Calendar size={12} />
                        <span>{formatDate(election.election_date)}</span>
                        {election.election_type && (
                          <span className="bg-brand-bg rounded px-1.5 py-0.5 text-xs font-mono uppercase">
                            {election.election_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {days > 0 && (
                      <div className={
                        'text-center px-3 py-1.5 ' +
                        (isUrgent ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-bg text-brand-muted')
                      }>
                        <div className="text-lg font-bold leading-none">{days}</div>
                        <div className="text-xs font-mono uppercase">days</div>
                      </div>
                    )}
                  </div>

                  {/* Key dates */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {election.registration_deadline && (
                      <div className="bg-brand-bg px-3 py-2">
                        <p className="font-semibold text-brand-text">Registration Deadline</p>
                        <p className="text-brand-muted">{formatDate(election.registration_deadline)}</p>
                      </div>
                    )}
                    {election.early_voting_start && (
                      <div className="bg-brand-bg px-3 py-2">
                        <p className="font-semibold text-brand-text">Early Voting</p>
                        <p className="text-brand-muted">
                          {formatDate(election.early_voting_start)}
                          {election.early_voting_end ? ' - ' + formatDate(election.early_voting_end) : ''}
                        </p>
                      </div>
                    )}
                    {election.find_polling_url && (
                      <a
                        href={election.find_polling_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-accent/5 px-3 py-2 hover:bg-brand-accent/10 transition-colors flex items-center gap-1.5"
                      >
                        <MapPin size={12} className="text-brand-accent" />
                        <span className="font-semibold text-brand-accent">Find Polling Places</span>
                      </a>
                    )}
                  </div>

                  {/* Action links */}
                  {election.register_url && (
                    <a
                      href={election.register_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-brand-accent hover:underline"
                    >
                      Register to vote <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-brand-border p-5 text-center">
            <Vote size={28} className="mx-auto text-brand-muted mb-2" />
            <p className="text-sm text-brand-muted">No upcoming elections at this time.</p>
            <p className="text-xs text-brand-muted mt-1">Check back closer to election season.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-3">
          <Link
            href="/elections"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
          >
            Election dashboard <ChevronRight size={14} />
          </Link>
          <Link
            href="/call-your-senators"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
          >
            Contact your officials <ChevronRight size={14} />
          </Link>
        </div>
      </StorySection>
    </div>
  )
}

// ── Sub-components ──

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}) {
  return (
    <div className="bg-white border border-brand-border p-3 text-center">
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
      <div className="text-lg font-bold text-brand-text leading-tight">{value}</div>
      <div className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted mt-0.5">
        {label}
      </div>
    </div>
  )
}
