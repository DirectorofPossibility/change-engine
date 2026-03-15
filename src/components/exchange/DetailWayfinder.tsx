import Link from 'next/link'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import {
  BookOpen, Heart, Scale, ChevronDown,
  Phone, Globe, Gift, Users, Calendar, MapPin,
  FileText,
} from 'lucide-react'
import type { WayfinderData } from '@/lib/types/exchange'
import { getNeighborhoodByZip } from '@/lib/data/exchange'
import { CompactCircleGraph } from './CompactCircleGraph'
import { WayfinderTooltipPos } from './WayfinderTooltips'
import { WayfinderTracker } from './WayfinderTracker'
import Image from 'next/image'
import { FolFallback } from '@/components/ui/FolFallback'

interface DetailWayfinderProps {
  data: WayfinderData
  currentType: string
  currentId: string
  userRole?: string
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ConnectionContext({ focusAreas, t }: { focusAreas: Array<{ focus_area_name: string; theme_id: string | null }>; t: (key: string) => string }) {
  if (focusAreas.length === 0) return null
  const names = focusAreas.slice(0, 3).map(fa => fa.focus_area_name)
  const more = focusAreas.length > 3 ? ' +' + (focusAreas.length - 3) + ' more' : ''
  return (
    <p className="text-[10px] text-brand-muted-light italic mb-2">
      {t('wayfinder.connected_through')} {names.join(', ')}{more}
    </p>
  )
}

async function GeoContext({ zip, nearLabel }: { zip: string; nearLabel: string }) {
  const hood = await getNeighborhoodByZip(zip)
  return (
    <div className="px-4 py-2 border-b-[3px] border-brand-border bg-brand-bg/50">
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-brand-accent flex-shrink-0" />
        <span className="text-[11px] text-brand-muted">
          {nearLabel} <span className="font-medium text-brand-text">{zip}</span>
          {hood && (
            <>
              {' '}&middot;{' '}
              <Link href={'/neighborhoods/' + hood.neighborhood_id} className="text-brand-accent hover:underline">
                {hood.neighborhood_name}
              </Link>
            </>
          )}
        </span>
      </div>
    </div>
  )
}

/** Reusable collapsible tier wrapper — used for Understand, Get Involved, Go Deeper. */
function WayfinderTier({ icon, label, count, centerLabel, centerColor, centerHref, isOpen, tipKey, focusAreas, t, children }: {
  icon: React.ReactNode
  label: string
  count: number
  centerLabel: string
  centerColor: string
  centerHref: string
  isOpen: boolean
  tipKey?: string
  focusAreas: WayfinderData['focusAreas']
  t: (key: string) => string
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <details open={isOpen} className="group border-t-[3px] border-brand-border">
      <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none relative">
        {tipKey && <WayfinderTooltipPos tipKey={tipKey} position="right" />}
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-brand-text">{label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: centerColor + '15', color: centerColor }}>{count}</span>
          <Link href={centerHref} className="text-[10px] font-mono font-bold uppercase tracking-wider hover:underline ml-1" style={{ color: centerColor }}>
            {centerLabel}
          </Link>
        </div>
        <ChevronDown size={14} className="text-brand-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 space-y-2">
        <ConnectionContext focusAreas={focusAreas} t={t} />
        {children}
      </div>
    </details>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export async function DetailWayfinder({ data, currentType, currentId, userRole }: DetailWayfinderProps) {
  const cookieStore = await cookies()
  const designV1 = cookieStore.get('design')?.value === 'v1'
  const lang = cookieStore.get('lang')?.value || 'en'
  const userZip = cookieStore.get('zip')?.value || ''
  const archetype = cookieStore.get('archetype')?.value || ''
  const t = getUIStrings(lang)

  const EVENT_TYPES = new Set(['event', 'opportunity', 'campaign'])
  const newsContent = data.content.filter(c => !EVENT_TYPES.has(c.content_type || ''))
  const eventContent = data.content.filter(c => EVENT_TYPES.has(c.content_type || ''))

  const totalEntities =
    data.content.length + data.libraryNuggets.length +
    data.opportunities.length + data.services.length +
    data.officials.length + data.policies.length +
    data.foundations.length + data.organizations.length

  // Always render the wayfinder shell — even with no connections, the header
  // and org anchors provide useful navigation context for the visitor.

  const understandCount = newsContent.length + data.libraryNuggets.length
  const involvedCount = data.opportunities.length + data.services.length + eventContent.length
  const deeperCount = data.officials.length + data.policies.length + data.foundations.length

  // Archetype-based tier priority
  const archetypePriority: Record<string, string[]> = {
    seeker: ['understand', 'involved', 'deeper'],
    learner: ['understand', 'deeper', 'involved'],
    builder: ['involved', 'understand', 'deeper'],
    watchdog: ['deeper', 'understand', 'involved'],
    partner: ['deeper', 'involved', 'understand'],
    explorer: ['understand', 'involved', 'deeper'],
  }
  const tierCounts: Record<string, number> = { understand: understandCount, involved: involvedCount, deeper: deeperCount }
  const priority = archetypePriority[archetype.toLowerCase()] || ['understand', 'involved', 'deeper']
  const firstOpenTier = priority.find(t => tierCounts[t] > 0) || 'understand'

  return (
    <aside className="bg-white border border-brand-border lg:sticky lg:top-24">
      <WayfinderTracker entityType={currentType} entityId={currentId} />

      {/* Header */}
      <div className="p-4 border-b-[3px] border-brand-border relative">
        <h3 className="font-display text-base font-semibold text-brand-text tracking-wide">
          {t('wayfinder.title')}
        </h3>
        <WayfinderTooltipPos tipKey="wayfinder_panel" position="bottom" />
      </div>

      {userZip && <GeoContext zip={userZip} nearLabel={t('wayfinder.near')} />}

      {/* Organization anchors — always open */}
      {data.organizations.length > 0 && (
        <details open className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.organizations') || 'Organizations'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {data.organizations.map(function (org) {
              return (
                <div key={org.org_id} className="space-y-2">
                  <Link href={'/organizations/' + org.org_id} className="flex items-center gap-2 group">
                    {org.logo_url ? (
                      <Image src={org.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-brand-bg flex-shrink-0" width={48} height={32} />
                    ) : (
                      <div className="w-8 h-8 rounded bg-brand-bg flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-brand-muted" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
                      {org.org_name}
                    </span>
                  </Link>
                  <div className="flex flex-wrap gap-1.5 pl-10">
                    {org.donate_url && (
                      <a href={org.donate_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                        <Gift size={11} /> {t('wayfinder.donate')}
                      </a>
                    )}
                    {org.volunteer_url && (
                      <a href={org.volunteer_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <Heart size={11} /> {t('wayfinder.volunteer')}
                      </a>
                    )}
                    {org.newsletter_url && (
                      <a href={org.newsletter_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                        <FileText size={11} /> {t('wayfinder.subscribe')}
                      </a>
                    )}
                    {org.phone && (
                      <a href={'tel:' + org.phone}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                        <Phone size={11} /> {t('wayfinder.call')}
                      </a>
                    )}
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                        <Globe size={11} /> {t('wayfinder.visit')}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      )}

      {/* Flower of Life graph — collapsible, closed */}
      {!designV1 && data.themes.length > 0 && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.topics')}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="relative border-t-[3px] border-brand-border">
            <CompactCircleGraph
              activePathways={data.themes}
              accentColor={data.themes.length > 0 ? (THEMES as any)[data.themes[0]]?.color : undefined}
            />
            <WayfinderTooltipPos tipKey="fol_key" position="left" />
          </div>
          {/* Theme pills */}
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {data.themes.map(function (themeId) {
                const theme = THEMES[themeId as keyof typeof THEMES]
                if (!theme) return null
                return (
                  <Link key={themeId} href={'/pathways/' + theme.slug}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: theme.color + '15', color: theme.color }}>
                    <span className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: theme.color }} />
                    {theme.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      )}

      {/* Focus area dots — collapsible, closed */}
      {data.focusAreas.length > 0 && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.focus_areas')}</span>
            <WayfinderTooltipPos tipKey="focus_area_dots" position="bottom" />
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {data.focusAreas.map(function (fa) {
                const themeKey = fa.theme_id as keyof typeof THEMES | null
                const color = themeKey ? THEMES[themeKey]?.color : '#6B6560'
                return (
                  <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id}
                    className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color || '#6B6560' }} />
                    {fa.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      )}

      {/* SDGs */}
      {data.taxonomy?.sdgs && data.taxonomy.sdgs.length > 0 && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.global_goals') || 'Global Goals'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {data.taxonomy.sdgs.map(function (s) {
                return (
                  <Link key={s.sdg_id} href={'/search?sdg=' + encodeURIComponent(s.sdg_id) + '&label=' + encodeURIComponent(s.sdg_name)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: s.sdg_color || '#4C9F38' }}>
                    {s.sdg_number}. {s.sdg_name}
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      )}

      {/* Health Determinant */}
      {data.taxonomy?.sdohDomain && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.health_determinant') || 'Health Determinant'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <Link href={'/search?sdoh=' + encodeURIComponent(data.taxonomy.sdohDomain.sdoh_code) + '&label=' + encodeURIComponent(data.taxonomy.sdohDomain.sdoh_name)} className="text-xs text-brand-accent hover:underline">
              {data.taxonomy.sdohDomain.sdoh_name}
            </Link>
          </div>
        </details>
      )}

      {/* Government Level */}
      {data.taxonomy?.govLevel && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.government_level') || 'Government Level'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <Link href={'/search?gov_level=' + encodeURIComponent(data.taxonomy.govLevel.gov_level_id) + '&label=' + encodeURIComponent(data.taxonomy.govLevel.gov_level_name)} className="text-xs text-brand-accent hover:underline">
              {data.taxonomy.govLevel.gov_level_name}
            </Link>
          </div>
        </details>
      )}

      {/* Action Types */}
      {data.taxonomy?.actionTypes && data.taxonomy.actionTypes.length > 0 && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.action_types') || 'Action Types'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {data.taxonomy.actionTypes.map(function (at) {
                return (
                  <Link key={at.action_type_id} href={'/search?action_type=' + encodeURIComponent(at.action_type_id) + '&label=' + encodeURIComponent(at.action_type_name)}
                    className="px-1.5 py-0.5 rounded bg-brand-bg text-brand-accent text-xs hover:underline">
                    {at.action_type_name}
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      )}

      {/* Time Commitment */}
      {data.taxonomy?.timeCommitment && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.time_commitment') || 'Time Commitment'}</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <Link href={'/search?time=' + encodeURIComponent(data.taxonomy.timeCommitment.time_id) + '&label=' + encodeURIComponent(data.taxonomy.timeCommitment.time_name)} className="text-xs text-brand-accent hover:underline">
              {data.taxonomy.timeCommitment.time_name}
            </Link>
          </div>
        </details>
      )}

      {/* NTEE / AIRS (admin only) */}
      {(userRole === 'admin' || userRole === 'partner') && data.taxonomy && (data.taxonomy.ntee_codes.length > 0 || data.taxonomy.airs_codes.length > 0) && (
        <details className="border-t-[3px] border-brand-border group/section">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Classification Codes</span>
            <ChevronDown size={12} className="text-brand-muted transition-transform group-open/section:rotate-180" />
          </summary>
          <div className="px-4 pb-3 space-y-2">
            {data.taxonomy.ntee_codes.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">NTEE</span>
                <p className="text-xs text-brand-text mt-0.5 font-mono">{data.taxonomy.ntee_codes.join(', ')}</p>
              </div>
            )}
            {data.taxonomy.airs_codes.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">AIRS</span>
                <p className="text-xs text-brand-text mt-0.5 font-mono">{data.taxonomy.airs_codes.join(', ')}</p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Tier: What's Happening */}
      <WayfinderTier
        icon={<BookOpen size={15} className="text-amber-600" />}
        label={t('wayfinder.understand')}
        count={understandCount}
        centerLabel={t('wayfinder.center_learning')}
        centerColor={CENTER_COLORS.Learning}
        centerHref="/centers/learning"
        isOpen={firstOpenTier === 'understand'}
        tipKey="engagement_tiers"
        focusAreas={data.focusAreas}
        t={t}
      >
        {newsContent.map(function (c) {
          const themeKey = c.pathway_primary as keyof typeof THEMES | null
          const color = themeKey ? THEMES[themeKey]?.color : '#6B6560'
          return (
            <Link key={c.id} href={'/content/' + c.id} className="flex gap-2 group/card">
              {c.image_url ? (
                <Image src={c.image_url} alt="" className="w-12 h-9 rounded object-contain bg-brand-bg flex-shrink-0" width={200} height={36} />
              ) : (
                <div className="w-12 h-9 rounded flex-shrink-0 overflow-hidden">
                  <FolFallback pathway={c.pathway_primary} height="h-full" />
                </div>
              )}
              <div className="min-w-0">
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: color || '#6B6560' }} />
                <span className="text-xs font-medium text-brand-text group-hover/card:text-brand-accent transition-colors line-clamp-2">
                  {c.title_6th_grade || 'Untitled'}
                </span>
              </div>
            </Link>
          )
        })}
        {data.libraryNuggets.map(function (n) {
          return (
            <Link key={n.id} href={'/library/doc/' + n.document_id} className="block group/nugget">
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-brand-muted mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs italic text-brand-muted line-clamp-2">
                    {n.excerpt || n.title}
                  </span>
                  {n.page_ref && <span className="text-[10px] text-brand-muted"> — p.{n.page_ref}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </WayfinderTier>

      {/* Tier: What You Can Do */}
      <WayfinderTier
        icon={<Heart size={15} className="text-green-600" />}
        label={t('wayfinder.get_involved')}
        count={involvedCount}
        centerLabel={t('wayfinder.center_action')}
        centerColor={CENTER_COLORS.Action}
        centerHref="/centers/action"
        isOpen={firstOpenTier === 'involved'}
        focusAreas={data.focusAreas}
        t={t}
      >
        {eventContent.map(function (c) {
          return (
            <Link key={c.id} href={'/content/' + c.id} className="flex items-start gap-2 group/evt">
              <Calendar size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-medium text-brand-text group-hover/evt:text-brand-accent transition-colors line-clamp-2">
                  {c.title_6th_grade || 'Untitled'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 capitalize">{c.content_type}</span>
              </div>
            </Link>
          )
        })}
        {data.opportunities.map(function (o) {
          return (
            <div key={o.opportunity_id} className="flex items-start gap-2">
              <Calendar size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-brand-text line-clamp-2">{o.opportunity_name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {o.time_commitment && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                      {t('wayfinder.time')}: {o.time_commitment}
                    </span>
                  )}
                  {o.registration_url && (
                    <a href={o.registration_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-brand-accent hover:underline">
                      {t('wayfinder.register')} &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {data.services
          .slice()
          .sort((a, b) => {
            if (!userZip) return 0
            const aMatch = a.zip_code === userZip ? -1 : 0
            const bMatch = b.zip_code === userZip ? -1 : 0
            return aMatch - bMatch
          })
          .map(function (s) {
            const isNearby = userZip && s.zip_code === userZip
            return (
              <Link key={s.service_id} href={'/services/' + s.service_id} className="flex items-start gap-2 group/svc">
                {s.phone ? (
                  <Phone size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <MapPin size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-medium text-brand-text group-hover/svc:text-brand-accent transition-colors line-clamp-2">{s.service_name}</span>
                  <span className="text-[10px] text-brand-muted block">
                    {[s.address, s.city].filter(Boolean).join(', ')}
                    {isNearby && <span className="ml-1 text-brand-accent font-medium">{t('wayfinder.near_you')}</span>}
                  </span>
                </div>
              </Link>
            )
          })}
      </WayfinderTier>

      {/* Tier: Who's In Charge */}
      <WayfinderTier
        icon={<Scale size={15} className="text-blue-600" />}
        label={t('wayfinder.go_deeper')}
        count={deeperCount}
        centerLabel={t('wayfinder.center_accountability')}
        centerColor={CENTER_COLORS.Accountability}
        centerHref="/centers/accountability"
        isOpen={firstOpenTier === 'deeper'}
        focusAreas={data.focusAreas}
        t={t}
      >
        {data.officials.map(function (o) {
          return (
            <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-2 group/off">
              {o.photo_url ? (
                <Image src={o.photo_url} alt="" className="w-7 h-7 rounded-full object-contain bg-brand-bg flex-shrink-0" width={80} height={28} />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
                  <Users size={11} className="text-brand-muted" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-medium text-brand-text group-hover/off:text-brand-accent transition-colors">{o.official_name}</span>
                <div className="flex items-center gap-1">
                  {o.level && <span className="text-[10px] text-brand-muted">{o.level}</span>}
                  {o.title && <span className="text-[10px] text-brand-muted truncate">{o.title}</span>}
                </div>
              </div>
            </Link>
          )
        })}
        {data.policies.map(function (p) {
          return (
            <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="flex items-start gap-2 group/pol">
              <Scale size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                {p.bill_number && <span className="text-[10px] font-mono text-brand-muted mr-1">{p.bill_number}</span>}
                <span className="text-xs font-medium text-brand-text group-hover/pol:text-brand-accent transition-colors line-clamp-2">
                  {p.title_6th_grade || p.policy_name}
                </span>
                {p.status && <span className="text-[10px] text-brand-muted block">{p.status}</span>}
              </div>
            </Link>
          )
        })}
        {data.foundations.map(function (f) {
          return (
            <div key={f.foundation_id} className="flex items-start gap-2">
              <Gift size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-medium text-brand-text">{f.name}</span>
                {f.website && (
                  <a href={f.website} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-brand-accent hover:underline ml-1">
                    {t('wayfinder.visit')} &rarr;
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </WayfinderTier>
    </aside>
  )
}
