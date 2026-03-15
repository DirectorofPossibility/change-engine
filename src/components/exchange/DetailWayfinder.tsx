import Link from 'next/link'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import {
  BookOpen, Heart, Scale, ChevronDown, ChevronRight,
  Phone, Globe, Gift, Users, Calendar, MapPin,
  FileText, Compass, ArrowRight, Sparkles, ExternalLink,
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
  quote?: { text: string; attribution?: string }
  accentColor?: string
}

/* ── Design tokens ─────────────────────────────────────────────────── */
const TOOLKIT_BG = '#faf9f7'
const TOOLKIT_BORDER = '#e8e4df'
const TOOLKIT_TEXT = '#2c2c2c'
const TOOLKIT_MUTED = '#6b6560'
const TOOLKIT_ACCENT = '#C75B2A'

/* ── Compact resource card ─────────────────────────────────────────── */
function ResourceCard({ href, title, image, pathway, summary, sourceUrl }: {
  href: string
  title: string
  image?: string | null
  pathway?: string | null
  summary?: string | null
  sourceUrl?: string | null
}) {
  return (
    <div
      className="group rounded-lg overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: `1px solid ${TOOLKIT_BORDER}`, background: '#fff' }}
    >
      <Link href={href} className="block">
        {/* Image or colored fallback */}
        <div className="relative h-[72px] overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full overflow-hidden">
              <FolFallback pathway={pathway} height="h-full" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        {/* Title */}
        <div className="px-2.5 pt-2.5 pb-1">
          <span
            className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-[#C75B2A] transition-colors"
            style={{ color: TOOLKIT_TEXT }}
          >
            {title}
          </span>
        </div>
      </Link>
      {/* Source link */}
      {sourceUrl && (
        <div className="px-2.5 pb-2">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] hover:underline"
            style={{ color: TOOLKIT_MUTED }}
          >
            <ExternalLink size={9} /> Source
          </a>
        </div>
      )}
      {!sourceUrl && <div className="pb-1.5" />}
    </div>
  )
}

/* ── Compact action row ────────────────────────────────────────────── */
function ActionRow({ href, icon, label, meta, external }: {
  href: string
  icon: React.ReactNode
  label: string
  meta?: string | null
  external?: boolean
}) {
  const Tag = external ? 'a' : Link
  const extraProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <Tag
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all hover:bg-white hover:shadow-sm group"
      {...extraProps as any}
    >
      <span className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${TOOLKIT_ACCENT}10` }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium line-clamp-1 group-hover:text-[#C75B2A] transition-colors" style={{ color: TOOLKIT_TEXT }}>
          {label}
        </span>
        {meta && <span className="text-xs block" style={{ color: TOOLKIT_MUTED }}>{meta}</span>}
      </div>
      <ChevronRight size={12} className="text-brand-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Tag>
  )
}

/* ── Section header ────────────────────────────────────────────────── */
function ToolkitSection({ icon, label, count, color, children }: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="pt-4 first:pt-0">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: color + '12', color }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────

export async function DetailWayfinder({ data, currentType, currentId, userRole, quote, accentColor }: DetailWayfinderProps) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const userZip = cookieStore.get('zip')?.value || ''
  const archetype = cookieStore.get('archetype')?.value || ''
  const t = getUIStrings(lang)

  const accent = accentColor || TOOLKIT_ACCENT

  const EVENT_TYPES = new Set(['event', 'opportunity', 'campaign'])
  const newsContent = data.content.filter(c => !EVENT_TYPES.has(c.content_type || ''))
  const eventContent = data.content.filter(c => EVENT_TYPES.has(c.content_type || ''))

  const totalEntities =
    data.content.length + data.libraryNuggets.length +
    data.opportunities.length + data.services.length +
    data.officials.length + data.policies.length +
    data.foundations.length + data.organizations.length

  const exploreCount = newsContent.length + data.libraryNuggets.length
  const actionCount = data.opportunities.length + data.services.length + eventContent.length
  const accountabilityCount = data.officials.length + data.policies.length + data.foundations.length

  return (
    <aside
      className="rounded-xl overflow-hidden"
      style={{ background: TOOLKIT_BG, border: `1px solid ${TOOLKIT_BORDER}` }}
    >
      <WayfinderTracker entityType={currentType} entityId={currentId} />

      {/* ── Toolkit Header ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Compass size={16} style={{ color: accent }} />
          <h3 className="font-display text-base font-bold tracking-tight" style={{ color: TOOLKIT_TEXT }}>
            {t('wayfinder.title') || 'Resource Toolkit'}
          </h3>
        </div>
        {totalEntities > 0 && (
          <p className="text-[11px]" style={{ color: TOOLKIT_MUTED }}>
            {totalEntities} connected {totalEntities === 1 ? 'resource' : 'resources'} across pathways
          </p>
        )}
      </div>

      {/* ── Quote (pull-quote accent) ── */}
      {quote && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg relative" style={{ background: `${accent}08`, borderLeft: `3px solid ${accent}` }}>
          <p className="font-display text-sm italic leading-snug font-medium" style={{ color: TOOLKIT_TEXT }}>
            &ldquo;{quote.text.length > 140 ? quote.text.slice(0, 140) + '...' : quote.text}&rdquo;
          </p>
          {quote.attribution && (
            <cite className="block mt-1.5 text-xs font-mono uppercase tracking-wider not-italic" style={{ color: TOOLKIT_MUTED }}>
              {quote.attribution}
            </cite>
          )}
        </div>
      )}

      {/* ── Pathways strip ── */}
      {data.themes.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {data.themes.map(function (themeId) {
              const theme = THEMES[themeId as keyof typeof THEMES]
              if (!theme) return null
              return (
                <Link
                  key={themeId}
                  href={'/pathways/' + theme.slug}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all hover:shadow-sm hover:-translate-y-px"
                  style={{ background: theme.color + '14', color: theme.color, border: `1px solid ${theme.color}25` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: theme.color }} />
                  {theme.name}
                </Link>
              )
            })}
          </div>
          {/* Focus areas as subtle sub-tags */}
          {data.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 pl-0.5">
              {data.focusAreas.slice(0, 6).map(function (fa) {
                const themeKey = fa.theme_id as keyof typeof THEMES | null
                const color = themeKey ? THEMES[themeKey]?.color : TOOLKIT_MUTED
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="text-xs hover:underline transition-colors"
                    style={{ color: color || TOOLKIT_MUTED }}
                  >
                    {fa.focus_area_name}
                  </Link>
                )
              })}
              {data.focusAreas.length > 6 && (
                <span className="text-xs" style={{ color: TOOLKIT_MUTED }}>+{data.focusAreas.length - 6} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="mx-4" style={{ borderTop: `1px solid ${TOOLKIT_BORDER}` }} />

      {/* ── Organization anchors (non-org pages only) ── */}
      {data.organizations.length > 0 && currentType !== 'organization' && (
        <div className="px-4 py-3">
          {data.organizations.map(function (org) {
            return (
              <div key={org.org_id} className="mb-3 last:mb-0">
                <Link href={'/organizations/' + org.org_id} className="flex items-center gap-2.5 group mb-1.5">
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white flex-shrink-0 shadow-sm" width={48} height={32} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Users size={14} className="text-brand-muted" />
                    </div>
                  )}
                  <span className="text-sm font-semibold group-hover:text-[#C75B2A] transition-colors line-clamp-1" style={{ color: TOOLKIT_TEXT }}>
                    {org.org_name}
                  </span>
                </Link>
                {/* Quick actions */}
                <div className="flex flex-wrap gap-1.5 pl-[42px]">
                  {org.donate_url && (
                    <a href={org.donate_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                      <Gift size={10} /> {t('wayfinder.donate')}
                    </a>
                  )}
                  {org.volunteer_url && (
                    <a href={org.volunteer_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      <Heart size={10} /> {t('wayfinder.volunteer')}
                    </a>
                  )}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                      <Globe size={10} /> {t('wayfinder.visit')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
          <div className="mt-2" style={{ borderTop: `1px solid ${TOOLKIT_BORDER}` }} />
        </div>
      )}

      {/* ── EXPLORE: Content showcase as visual cards ── */}
      <div className="px-4 py-3 space-y-4">

        <ToolkitSection
          icon={<BookOpen size={14} className="text-amber-600" />}
          label={t('wayfinder.understand') || 'Explore'}
          count={exploreCount}
          color="#d97706"
        >
          {/* Content as 2-col visual card grid */}
          {newsContent.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {newsContent.slice(0, 4).map(function (c) {
                return (
                  <ResourceCard
                    key={c.id}
                    href={'/content/' + c.id}
                    title={c.title_6th_grade || 'Untitled'}
                    image={c.image_url}
                    pathway={c.pathway_primary}
                    summary={c.summary_6th_grade}
                    sourceUrl={c.source_url}
                  />
                )
              })}
            </div>
          )}
          {newsContent.length > 4 && (
            <Link
              href={'/search?org=' + currentId}
              className="flex items-center gap-1 text-[11px] font-medium mt-2 pl-1 hover:underline"
              style={{ color: accent }}
            >
              View all {newsContent.length} resources <ArrowRight size={11} />
            </Link>
          )}
          {/* Library nuggets */}
          {data.libraryNuggets.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {data.libraryNuggets.slice(0, 3).map(function (n) {
                return (
                  <Link key={n.id} href={'/library/doc/' + n.document_id}
                    className="flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-white transition-colors group"
                  >
                    <FileText size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] italic line-clamp-2 group-hover:text-[#C75B2A] transition-colors" style={{ color: TOOLKIT_MUTED }}>
                      {n.excerpt || n.title}
                      {n.page_ref && <span className="not-italic"> — p.{n.page_ref}</span>}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </ToolkitSection>

        {/* ── TAKE ACTION: Services, opportunities, events ── */}
        <ToolkitSection
          icon={<Heart size={14} className="text-green-600" />}
          label={t('wayfinder.get_involved') || 'Take Action'}
          count={actionCount}
          color="#059669"
        >
          <div className="space-y-0.5 rounded-lg overflow-hidden" style={{ background: '#fff', border: `1px solid ${TOOLKIT_BORDER}` }}>
            {eventContent.slice(0, 3).map(function (c) {
              return (
                <ActionRow
                  key={c.id}
                  href={'/content/' + c.id}
                  icon={<Calendar size={13} className="text-green-600" />}
                  label={c.title_6th_grade || 'Untitled'}
                  meta={c.content_type ? c.content_type.charAt(0).toUpperCase() + c.content_type.slice(1) : undefined}
                />
              )
            })}
            {data.opportunities.slice(0, 3).map(function (o) {
              return (
                <ActionRow
                  key={o.opportunity_id}
                  href={o.registration_url || '/opportunities/' + o.opportunity_id}
                  icon={<Sparkles size={13} className="text-green-600" />}
                  label={o.opportunity_name}
                  meta={o.time_commitment || undefined}
                  external={!!o.registration_url}
                />
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
              .slice(0, 4)
              .map(function (s) {
                const isNearby = userZip && s.zip_code === userZip
                return (
                  <ActionRow
                    key={s.service_id}
                    href={'/services/' + s.service_id}
                    icon={<MapPin size={13} className="text-green-600" />}
                    label={s.service_name}
                    meta={[s.city, isNearby ? 'Near you' : null].filter(Boolean).join(' · ') || undefined}
                  />
                )
              })}
          </div>
        </ToolkitSection>

        {/* ── ACCOUNTABILITY: Officials, policies, foundations ── */}
        <ToolkitSection
          icon={<Scale size={14} className="text-blue-600" />}
          label={t('wayfinder.go_deeper') || 'Accountability'}
          count={accountabilityCount}
          color="#2563eb"
        >
          <div className="space-y-0.5 rounded-lg overflow-hidden" style={{ background: '#fff', border: `1px solid ${TOOLKIT_BORDER}` }}>
            {data.officials.slice(0, 3).map(function (o) {
              return (
                <Link
                  key={o.official_id}
                  href={'/officials/' + o.official_id}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors group"
                >
                  {o.photo_url ? (
                    <Image src={o.photo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" width={28} height={28} />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Users size={11} className="text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium group-hover:text-[#C75B2A] transition-colors line-clamp-1" style={{ color: TOOLKIT_TEXT }}>
                      {o.official_name}
                    </span>
                    {(o.level || o.title) && (
                      <span className="text-xs block truncate" style={{ color: TOOLKIT_MUTED }}>
                        {[o.level, o.title].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
            {data.policies.slice(0, 3).map(function (p) {
              return (
                <ActionRow
                  key={p.policy_id}
                  href={'/policies/' + p.policy_id}
                  icon={<Scale size={13} className="text-blue-500" />}
                  label={p.title_6th_grade || p.policy_name}
                  meta={[p.bill_number, p.status].filter(Boolean).join(' · ') || undefined}
                />
              )
            })}
            {data.foundations.slice(0, 3).map(function (f) {
              return (
                <ActionRow
                  key={f.foundation_id}
                  href={f.website || '#'}
                  icon={<Gift size={13} className="text-blue-400" />}
                  label={f.name}
                  external={!!f.website}
                />
              )
            })}
          </div>
        </ToolkitSection>
      </div>

      {/* ── SDGs (compact, non-admin) ── */}
      {data.taxonomy?.sdgs && data.taxonomy.sdgs.length > 0 && (
        <details className="group mx-4 mb-3">
          <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider select-none py-1" style={{ color: TOOLKIT_MUTED }}>
            {t('wayfinder.global_goals') || 'Global Goals'}
            <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.taxonomy.sdgs.map(function (s) {
              return (
                <Link
                  key={s.sdg_id}
                  href={'/search?sdg=' + encodeURIComponent(s.sdg_id) + '&label=' + encodeURIComponent(s.sdg_name)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: s.sdg_color || '#4C9F38' }}
                >
                  {s.sdg_number}. {s.sdg_name}
                </Link>
              )
            })}
          </div>
        </details>
      )}

      {/* ── Classification codes (admin only) ── */}
      {(userRole === 'admin' || userRole === 'partner') && data.taxonomy && (
        (data.taxonomy.ntee_codes.length > 0 || data.taxonomy.airs_codes.length > 0 ||
         data.taxonomy.sdohDomain || data.taxonomy.govLevel ||
         data.taxonomy.actionTypes.length > 0 || data.taxonomy.timeCommitment) && (
          <details className="group mx-4 mb-4">
            <summary className="flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider select-none py-1" style={{ color: TOOLKIT_MUTED }}>
              Classification Details
              <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-2 text-[11px]" style={{ color: TOOLKIT_MUTED }}>
              {data.taxonomy.sdohDomain && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">Health Determinant: </span>
                  <Link href={'/search?sdoh=' + encodeURIComponent(data.taxonomy.sdohDomain.sdoh_code)} className="text-brand-accent hover:underline">
                    {data.taxonomy.sdohDomain.sdoh_name}
                  </Link>
                </div>
              )}
              {data.taxonomy.govLevel && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">Gov Level: </span>
                  <Link href={'/search?gov_level=' + encodeURIComponent(data.taxonomy.govLevel.gov_level_id)} className="text-brand-accent hover:underline">
                    {data.taxonomy.govLevel.gov_level_name}
                  </Link>
                </div>
              )}
              {data.taxonomy.actionTypes.length > 0 && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">Action Types: </span>
                  {data.taxonomy.actionTypes.map(function (at, i) {
                    return (
                      <span key={at.action_type_id}>
                        {i > 0 && ', '}
                        <Link href={'/search?action_type=' + encodeURIComponent(at.action_type_id) + '&label=' + encodeURIComponent(at.action_type_name)} className="text-brand-accent hover:underline">
                          {at.action_type_name}
                        </Link>
                      </span>
                    )
                  })}
                </div>
              )}
              {data.taxonomy.timeCommitment && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">Time: </span>
                  <Link href={'/search?time=' + encodeURIComponent(data.taxonomy.timeCommitment.time_id) + '&label=' + encodeURIComponent(data.taxonomy.timeCommitment.time_name)} className="text-brand-accent hover:underline">
                    {data.taxonomy.timeCommitment.time_name}
                  </Link>
                </div>
              )}
              {data.taxonomy.ntee_codes.length > 0 && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">NTEE: </span>
                  {data.taxonomy.ntee_codes.map(function (code, i) {
                    return (
                      <span key={code} className="font-mono">
                        {i > 0 && ', '}
                        <Link href={'/search?ntee=' + encodeURIComponent(code)} className="text-brand-accent hover:underline">
                          {code}
                        </Link>
                      </span>
                    )
                  })}
                </div>
              )}
              {data.taxonomy.airs_codes.length > 0 && (
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">AIRS: </span>
                  {data.taxonomy.airs_codes.map(function (code, i) {
                    return (
                      <span key={code} className="font-mono">
                        {i > 0 && ', '}
                        <Link href={'/search?airs=' + encodeURIComponent(code)} className="text-brand-accent hover:underline">
                          {code}
                        </Link>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </details>
        )
      )}

      {/* ── Bottom padding ── */}
      <div className="h-2" />
    </aside>
  )
}
