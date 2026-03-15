import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import {
  BookOpen, Heart, Scale, ChevronDown,
  Globe, Gift, Users, Calendar, MapPin,
  FileText, Compass, ArrowRight, Sparkles, ExternalLink,
} from 'lucide-react'
import type { WayfinderData } from '@/lib/types/exchange'
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
const TK = {
  bg: '#faf9f7',
  card: '#ffffff',
  border: '#e8e4df',
  rule: '#f0ece7',
  text: '#2c2c2c',
  muted: '#6b6560',
  accent: '#C75B2A',
}

/* ── Truncate helper ───────────────────────────────────────────────── */
function trunc(s: string | null | undefined, max = 75): string {
  if (!s) return ''
  return s.length > max ? s.slice(0, max) + '...' : s
}

/* ── Collapsible section ───────────────────────────────────────────── */
function Section({ icon, label, count, color, defaultOpen, children }: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <details className="group" open={defaultOpen}>
      <summary
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none transition-colors hover:bg-white/60"
        style={{ borderBottom: `1px solid ${TK.rule}` }}
      >
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider flex-1" style={{ color }}>{label}</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: color + '12', color }}>{count}</span>
        <ChevronDown size={12} className="transition-transform group-open:rotate-180 ml-1" style={{ color: TK.muted }} />
      </summary>
      <div className="px-4 py-3">
        {children}
      </div>
    </details>
  )
}

/* ── Compact link row ──────────────────────────────────────────────── */
function Row({ href, icon, label, meta, external }: {
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
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors hover:bg-[#f5f3f0] group"
      {...extraProps as any}
    >
      <span className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{ background: `${TK.accent}08` }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium line-clamp-1 group-hover:text-[#C75B2A] transition-colors" style={{ color: TK.text }}>
          {trunc(label)}
        </span>
        {meta && <span className="text-[11px] block truncate" style={{ color: TK.muted }}>{meta}</span>}
      </div>
    </Tag>
  )
}

// ── Main component ───────────────────────────────────────────────────

export async function DetailWayfinder({ data, currentType, currentId, userRole, quote, accentColor }: DetailWayfinderProps) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const userZip = cookieStore.get('zip')?.value || ''
  const t = getUIStrings(lang)

  const accent = accentColor || TK.accent

  const EVENT_TYPES = new Set(['event', 'opportunity', 'campaign'])
  const newsContent = data.content.filter(c => !EVENT_TYPES.has(c.content_type || ''))
  const eventContent = data.content.filter(c => EVENT_TYPES.has(c.content_type || ''))

  const totalEntities =
    data.content.length + data.libraryNuggets.length +
    data.opportunities.length + data.services.length +
    data.officials.length + data.policies.length +
    data.organizations.length

  const exploreCount = newsContent.length + data.libraryNuggets.length
  const actionCount = data.opportunities.length + data.services.length + eventContent.length
  const accountabilityCount = data.officials.length + data.policies.length

  return (
    <aside
      className="rounded-xl overflow-hidden"
      style={{ background: TK.bg, border: `1px solid ${TK.border}` }}
    >
      <WayfinderTracker entityType={currentType} entityId={currentId} />

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${TK.rule}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Compass size={15} style={{ color: accent }} />
          <h3 className="font-display text-sm font-bold tracking-tight" style={{ color: TK.text }}>
            {t('wayfinder.title') || 'Resource Toolkit'}
          </h3>
        </div>
        {totalEntities > 0 && (
          <p className="text-[11px]" style={{ color: TK.muted }}>
            {totalEntities} connected {totalEntities === 1 ? 'resource' : 'resources'}
          </p>
        )}
      </div>

      {/* ── Pathways + Focus Areas ── */}
      {data.themes.length > 0 && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${TK.rule}` }}>
          <div className="flex flex-wrap gap-1.5">
            {data.themes.map(function (themeId) {
              const theme = THEMES[themeId as keyof typeof THEMES]
              if (!theme) return null
              return (
                <Link
                  key={themeId}
                  href={'/pathways/' + theme.slug}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all hover:shadow-sm"
                  style={{ background: theme.color + '14', color: theme.color, border: `1px solid ${theme.color}20` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.color }} />
                  {theme.name}
                </Link>
              )
            })}
          </div>
          {data.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-2">
              {data.focusAreas.slice(0, 5).map(function (fa) {
                const themeKey = fa.theme_id as keyof typeof THEMES | null
                const color = themeKey ? THEMES[themeKey]?.color : TK.muted
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="text-[11px] hover:underline"
                    style={{ color: color || TK.muted }}
                  >
                    {fa.focus_area_name}
                  </Link>
                )
              })}
              {data.focusAreas.length > 5 && (
                <span className="text-[11px]" style={{ color: TK.muted }}>+{data.focusAreas.length - 5}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Organization anchor ── */}
      {data.organizations.length > 0 && currentType !== 'organization' && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${TK.rule}` }}>
          {data.organizations.slice(0, 2).map(function (org) {
            return (
              <div key={org.org_id} className="mb-2 last:mb-0">
                <Link href={'/organizations/' + org.org_id} className="flex items-center gap-2 group">
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt="" className="w-7 h-7 rounded-md object-contain bg-white flex-shrink-0" width={28} height={28} />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
                      <Users size={12} style={{ color: TK.muted }} />
                    </div>
                  )}
                  <span className="text-xs font-semibold group-hover:text-[#C75B2A] transition-colors line-clamp-1" style={{ color: TK.text }}>
                    {org.org_name}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1.5 pl-9">
                  {org.donate_url && (
                    <a href={org.donate_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                      <Gift size={9} /> {t('wayfinder.donate')}
                    </a>
                  )}
                  {org.volunteer_url && (
                    <a href={org.volunteer_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      <Heart size={9} /> {t('wayfinder.volunteer')}
                    </a>
                  )}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                      <Globe size={9} /> {t('wayfinder.visit')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Quote ── */}
      {quote && (
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${TK.rule}` }}>
          <div className="px-3 py-2.5 rounded-md" style={{ background: `${accent}06`, borderLeft: `2px solid ${accent}` }}>
            <p className="font-display text-xs italic leading-snug" style={{ color: TK.text }}>
              &ldquo;{trunc(quote.text, 120)}&rdquo;
            </p>
            {quote.attribution && (
              <cite className="block mt-1 text-[10px] font-mono uppercase tracking-wider not-italic" style={{ color: TK.muted }}>
                {quote.attribution}
              </cite>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          COLLAPSIBLE SECTIONS — each opens/closes independently
         ══════════════════════════════════════════════════════════════ */}

      {/* ── EXPLORE ── */}
      <Section
        icon={<BookOpen size={13} className="text-amber-600" />}
        label={t('wayfinder.understand') || 'Explore'}
        count={exploreCount}
        color="#d97706"
        defaultOpen={true}
      >
        {newsContent.length > 0 && (
          <div className="space-y-1.5">
            {newsContent.slice(0, 4).map(function (c) {
              return (
                <Link
                  key={c.id}
                  href={'/content/' + c.id}
                  className="flex items-start gap-2.5 py-1.5 group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    {c.image_url ? (
                      <Image src={c.image_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full"><FolFallback pathway={c.pathway_primary} height="h-full" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <span className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-[#C75B2A] transition-colors" style={{ color: TK.text }}>
                      {trunc(c.title_6th_grade || 'Untitled')}
                    </span>
                    {c.source_url && (
                      <span className="text-[10px] block mt-0.5" style={{ color: TK.muted }}>
                        {(() => { try { return new URL(c.source_url).hostname.replace('www.', '') } catch { return '' } })()}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        {newsContent.length > 4 && (
          <Link
            href={'/search?org=' + currentId}
            className="flex items-center gap-1 text-[11px] font-semibold mt-2 hover:underline"
            style={{ color: accent }}
          >
            View all {newsContent.length} <ArrowRight size={10} />
          </Link>
        )}
        {data.libraryNuggets.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${TK.rule}` }}>
            {data.libraryNuggets.slice(0, 2).map(function (n) {
              return (
                <Link key={n.id} href={'/library/doc/' + n.document_id}
                  className="flex items-start gap-2 py-1.5 group"
                >
                  <FileText size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] italic line-clamp-1 group-hover:text-[#C75B2A] transition-colors" style={{ color: TK.muted }}>
                    {trunc(n.excerpt || n.title, 60)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── TAKE ACTION ── */}
      <Section
        icon={<Heart size={13} className="text-green-600" />}
        label={t('wayfinder.get_involved') || 'Take Action'}
        count={actionCount}
        color="#059669"
      >
        <div className="space-y-0.5">
          {eventContent.slice(0, 2).map(function (c) {
            return (
              <Row
                key={c.id}
                href={'/content/' + c.id}
                icon={<Calendar size={12} className="text-green-600" />}
                label={c.title_6th_grade || 'Untitled'}
                meta={c.content_type ? c.content_type.charAt(0).toUpperCase() + c.content_type.slice(1) : undefined}
              />
            )
          })}
          {data.opportunities.slice(0, 2).map(function (o) {
            return (
              <Row
                key={o.opportunity_id}
                href={o.registration_url || '/opportunities/' + o.opportunity_id}
                icon={<Sparkles size={12} className="text-green-600" />}
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
              return (a.zip_code === userZip ? -1 : 0) - (b.zip_code === userZip ? -1 : 0)
            })
            .slice(0, 3)
            .map(function (s) {
              const isNearby = userZip && s.zip_code === userZip
              return (
                <Row
                  key={s.service_id}
                  href={'/services/' + s.service_id}
                  icon={<MapPin size={12} className="text-green-600" />}
                  label={s.service_name}
                  meta={[s.city, isNearby ? 'Near you' : null].filter(Boolean).join(' · ') || undefined}
                />
              )
            })}
        </div>
      </Section>

      {/* ── ACCOUNTABILITY ── */}
      <Section
        icon={<Scale size={13} className="text-blue-600" />}
        label={t('wayfinder.go_deeper') || 'Accountability'}
        count={accountabilityCount}
        color="#2563eb"
      >
        <div className="space-y-0.5">
          {data.officials.slice(0, 3).map(function (o) {
            return (
              <Link
                key={o.official_id}
                href={'/officials/' + o.official_id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#f5f3f0] transition-colors group"
              >
                {o.photo_url ? (
                  <Image src={o.photo_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" width={24} height={24} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users size={10} className="text-blue-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium group-hover:text-[#C75B2A] transition-colors line-clamp-1" style={{ color: TK.text }}>
                    {o.official_name}
                  </span>
                  {(o.level || o.title) && (
                    <span className="text-[11px] block truncate" style={{ color: TK.muted }}>
                      {[o.level, o.title].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
          {data.policies.slice(0, 3).map(function (p) {
            return (
              <Row
                key={p.policy_id}
                href={'/policies/' + p.policy_id}
                icon={<Scale size={12} className="text-blue-500" />}
                label={p.title_6th_grade || p.policy_name}
                meta={[p.bill_number, p.status].filter(Boolean).join(' · ') || undefined}
              />
            )
          })}
        </div>
      </Section>

      {/* ── SDGs + SDOH (compact footer) ── */}
      {data.taxonomy?.sdgs && data.taxonomy.sdgs.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${TK.rule}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TK.muted }}>
            {t('wayfinder.global_goals') || 'Global Goals'}
          </p>
          <div className="flex flex-wrap gap-1">
            {data.taxonomy.sdgs.map(function (s) {
              return (
                <Link
                  key={s.sdg_id}
                  href={'/search?sdg=' + encodeURIComponent(s.sdg_id) + '&label=' + encodeURIComponent(s.sdg_name)}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white text-[10px] font-semibold hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: s.sdg_color || '#4C9F38' }}
                >
                  {s.sdg_number}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {data.taxonomy?.sdohDomain && (
        <div className="px-4 pb-3">
          <Link
            href={'/search?sdoh=' + encodeURIComponent(data.taxonomy.sdohDomain.sdoh_code)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:underline"
            style={{ color: TK.accent }}
          >
            <Heart size={10} /> {data.taxonomy.sdohDomain.sdoh_name}
          </Link>
        </div>
      )}

      {/* ── Classification codes (admin only) ── */}
      {(userRole === 'admin' || userRole === 'partner') && data.taxonomy && (
        (data.taxonomy.ntee_codes.length > 0 || data.taxonomy.airs_codes.length > 0 ||
         data.taxonomy.govLevel ||
         data.taxonomy.actionTypes.length > 0 || data.taxonomy.timeCommitment) && (
          <details className="group">
            <summary className="flex items-center gap-1.5 px-4 py-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider select-none" style={{ color: TK.muted, borderTop: `1px solid ${TK.rule}` }}>
              Classification
              <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-3 space-y-1.5 text-[11px]" style={{ color: TK.muted }}>
              {data.taxonomy.govLevel && (
                <div>
                  <span className="font-bold">Gov: </span>
                  <Link href={'/search?gov_level=' + encodeURIComponent(data.taxonomy.govLevel.gov_level_id)} className="text-brand-accent hover:underline">
                    {data.taxonomy.govLevel.gov_level_name}
                  </Link>
                </div>
              )}
              {data.taxonomy.actionTypes.length > 0 && (
                <div>
                  <span className="font-bold">Actions: </span>
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
                  <span className="font-bold">Time: </span>
                  <Link href={'/search?time=' + encodeURIComponent(data.taxonomy.timeCommitment.time_id) + '&label=' + encodeURIComponent(data.taxonomy.timeCommitment.time_name)} className="text-brand-accent hover:underline">
                    {data.taxonomy.timeCommitment.time_name}
                  </Link>
                </div>
              )}
              {data.taxonomy.ntee_codes.length > 0 && (
                <div>
                  <span className="font-bold">NTEE: </span>
                  {data.taxonomy.ntee_codes.map(function (code, i) {
                    return (
                      <span key={code} className="font-mono">
                        {i > 0 && ', '}
                        <Link href={'/search?ntee=' + encodeURIComponent(code)} className="text-brand-accent hover:underline">{code}</Link>
                      </span>
                    )
                  })}
                </div>
              )}
              {data.taxonomy.airs_codes.length > 0 && (
                <div>
                  <span className="font-bold">AIRS: </span>
                  {data.taxonomy.airs_codes.map(function (code, i) {
                    return (
                      <span key={code} className="font-mono">
                        {i > 0 && ', '}
                        <Link href={'/search?airs=' + encodeURIComponent(code)} className="text-brand-accent hover:underline">{code}</Link>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </details>
        )
      )}

      {/* ── Bottom cap ── */}
      <div className="h-1" />
    </aside>
  )
}
