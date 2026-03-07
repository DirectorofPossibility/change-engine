import Link from 'next/link'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import {
  BookOpen, Heart, Scale, ChevronDown,
  Phone, Globe, Gift, Users, Calendar, MapPin,
  FileText, Tag,
} from 'lucide-react'
import type { WayfinderData } from '@/lib/types/exchange'
import { CompactCircleGraph } from './CompactCircleGraph'
import { WayfinderTooltipPos } from './WayfinderTooltips'

interface DetailWayfinderProps {
  data: WayfinderData
  currentType: string
  currentId: string
  /** User role — taxonomy section only shown for admin/partner */
  userRole?: string
}

/** Small "Connected through" label showing shared focus areas */
function ConnectionContext({ focusAreas }: { focusAreas: Array<{ focus_area_name: string; theme_id: string | null }> }) {
  if (focusAreas.length === 0) return null
  const names = focusAreas.slice(0, 3).map(fa => fa.focus_area_name)
  const more = focusAreas.length > 3 ? ' +' + (focusAreas.length - 3) + ' more' : ''
  return (
    <p className="text-[10px] text-brand-muted-light italic mb-2">
      Connected through: {names.join(', ')}{more}
    </p>
  )
}

export async function DetailWayfinder({ data, currentType, currentId, userRole }: DetailWayfinderProps) {
  const cookieStore = await cookies()
  const designV1 = cookieStore.get('design')?.value === 'v1'
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  // Separate event-type content into "What You Can Do", news/articles into "What's Happening"
  const EVENT_TYPES = new Set(['event', 'opportunity', 'campaign'])
  const newsContent = data.content.filter(c => !EVENT_TYPES.has(c.content_type || ''))
  const eventContent = data.content.filter(c => EVENT_TYPES.has(c.content_type || ''))

  const totalEntities =
    data.content.length + data.libraryNuggets.length +
    data.opportunities.length + data.services.length +
    data.officials.length + data.policies.length +
    data.foundations.length + data.organizations.length

  if (totalEntities === 0 && data.focusAreas.length === 0) return null

  const understandCount = newsContent.length + data.libraryNuggets.length
  const involvedCount = data.opportunities.length + data.services.length + eventContent.length
  const deeperCount = data.officials.length + data.policies.length + data.foundations.length

  const firstOpenTier = understandCount > 0 ? 'understand' : involvedCount > 0 ? 'involved' : 'deeper'

  return (
    <aside className="bg-white rounded-xl border border-brand-border lg:sticky lg:top-24">
      {/* Header */}
      <div className="p-4 border-b border-brand-border relative">
        <h3 className="font-serif text-base font-semibold text-brand-text tracking-wide">
          {t('wayfinder.title')}
        </h3>
        <WayfinderTooltipPos tipKey="wayfinder_panel" position="bottom" />
      </div>

      {/* Compact circle graph */}
      {!designV1 && data.themes.length > 0 && (
        <div className="border-b border-brand-border">
          <CompactCircleGraph
            activePathways={data.themes}
            accentColor={data.themes.length > 0 ? (THEMES as any)[data.themes[0]]?.color : undefined}
          />
        </div>
      )}

      {/* Organization anchors */}
      {data.organizations.length > 0 && (
        <div className="p-4 border-b border-brand-border space-y-3">
          {data.organizations.map(function (org) {
            return (
              <div key={org.org_id} className="space-y-2">
                <Link href={'/organizations/' + org.org_id} className="flex items-center gap-2 group">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-brand-bg flex-shrink-0" />
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
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                      <Gift size={11} /> {t('wayfinder.donate')}
                    </a>
                  )}
                  {org.volunteer_url && (
                    <a href={org.volunteer_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      <Heart size={11} /> {t('wayfinder.volunteer')}
                    </a>
                  )}
                  {org.newsletter_url && (
                    <a href={org.newsletter_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                      <FileText size={11} /> {t('wayfinder.subscribe')}
                    </a>
                  )}
                  {org.phone && (
                    <a href={'tel:' + org.phone}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                      <Phone size={11} /> {t('wayfinder.call')}
                    </a>
                  )}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                      <Globe size={11} /> {t('wayfinder.visit')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Focus area dots — all linked */}
      {data.focusAreas.length > 0 && (
        <div className="px-4 py-3 border-b border-brand-border relative">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Focus Areas</div>
          <WayfinderTooltipPos tipKey="focus_area_dots" position="bottom" />
          <div className="flex flex-wrap gap-1.5">
            {data.focusAreas.map(function (fa) {
              const themeKey = fa.theme_id as keyof typeof THEMES | null
              const color = themeKey ? THEMES[themeKey]?.color : '#8B7E74'
              return (
                <Link
                  key={fa.focus_id}
                  href={'/explore/focus/' + fa.focus_id}
                  className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color || '#8B7E74' }} />
                  {fa.focus_area_name}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Themes — linked to pathway pages */}
      {data.themes.length > 0 && (
        <div className="px-4 py-3 border-b border-brand-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Pathways</div>
          <div className="flex flex-wrap gap-1.5">
            {data.themes.map(function (themeId) {
              const theme = THEMES[themeId as keyof typeof THEMES]
              if (!theme) return null
              return (
                <Link
                  key={themeId}
                  href={'/pathways/' + theme.slug}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.color + '15', color: theme.color }}
                >
                  <span className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: theme.color }} />
                  {theme.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Taxonomy — SDGs, SDOH, action types, gov level (visible to all) */}
      {data.taxonomy && (
        <div className="px-4 py-3 border-b border-brand-border space-y-2.5 relative">
          <WayfinderTooltipPos tipKey="taxonomy_section" position="top" />
          {/* SDGs — linked to explore */}
          {data.taxonomy.sdgs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Global Goals</div>
              <div className="flex flex-wrap gap-1">
                {data.taxonomy.sdgs.map(function (s) {
                  return (
                    <Link
                      key={s.sdg_id}
                      href={'/search?q=' + encodeURIComponent(s.sdg_name)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: s.sdg_color || '#4C9F38' }}
                    >
                      {s.sdg_number}. {s.sdg_name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* SDOH — linked to search */}
          {data.taxonomy.sdohDomain && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Health Determinant</div>
              <Link
                href={'/search?q=' + encodeURIComponent(data.taxonomy.sdohDomain.sdoh_name)}
                className="text-xs text-brand-accent hover:underline"
              >
                {data.taxonomy.sdohDomain.sdoh_name}
              </Link>
            </div>
          )}

          {/* Government Level */}
          {data.taxonomy.govLevel && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Government Level</div>
              <Link
                href={'/search?q=' + encodeURIComponent(data.taxonomy.govLevel.gov_level_name)}
                className="text-xs text-brand-accent hover:underline"
              >
                {data.taxonomy.govLevel.gov_level_name}
              </Link>
            </div>
          )}

          {/* Action Types — linked to search */}
          {data.taxonomy.actionTypes.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Action Types</div>
              <div className="flex flex-wrap gap-1">
                {data.taxonomy.actionTypes.map(function (at) {
                  return (
                    <Link
                      key={at.action_type_id}
                      href={'/search?q=' + encodeURIComponent(at.action_type_name)}
                      className="px-1.5 py-0.5 rounded bg-brand-bg text-brand-accent text-xs hover:underline"
                    >
                      {at.action_type_name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Time Commitment */}
          {data.taxonomy.timeCommitment && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Time Commitment</div>
              <Link href={'/search?q=' + encodeURIComponent(data.taxonomy.timeCommitment.time_name)} className="text-xs text-brand-accent hover:underline">{data.taxonomy.timeCommitment.time_name}</Link>
            </div>
          )}

          {/* NTEE / AIRS codes — admin/partner only */}
          {(userRole === 'admin' || userRole === 'partner') && (
            <>
              {data.taxonomy.ntee_codes.length > 0 && (
                <div className="relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">NTEE</span>
                  <WayfinderTooltipPos tipKey="ntee_code" position="bottom" />
                  <p className="text-xs text-brand-text mt-0.5 font-mono">{data.taxonomy.ntee_codes.join(', ')}</p>
                </div>
              )}
              {data.taxonomy.airs_codes.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">AIRS</span>
                  <p className="text-xs text-brand-text mt-0.5 font-mono">{data.taxonomy.airs_codes.join(', ')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tier: What's Happening */}
      {understandCount > 0 && (
        <details open={firstOpenTier === 'understand'} className="group">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none relative">
            <WayfinderTooltipPos tipKey="engagement_tiers" position="right" />
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-amber-600" />
              <span className="text-sm font-medium text-brand-text">{t('wayfinder.understand')}</span>
              <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">{understandCount}</span>
              <Link href="/centers/learning" className="text-[10px] font-mono font-bold uppercase tracking-wider hover:underline ml-1" style={{ color: CENTER_COLORS.Learning }}>
                Learning
              </Link>
            </div>
            <ChevronDown size={14} className="text-brand-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <ConnectionContext focusAreas={data.focusAreas} />
            {newsContent.map(function (c) {
              const themeKey = c.pathway_primary as keyof typeof THEMES | null
              const color = themeKey ? THEMES[themeKey]?.color : '#8B7E74'
              return (
                <Link key={c.id} href={'/content/' + c.id} className="flex gap-2 group/card">
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="w-12 h-9 rounded object-contain bg-brand-bg flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-9 rounded flex-shrink-0" style={{ backgroundColor: (color || '#8B7E74') + '20' }} />
                  )}
                  <div className="min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: color || '#8B7E74' }} />
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
          </div>
        </details>
      )}

      {/* Tier: What You Can Do */}
      {involvedCount > 0 && (
        <details open={firstOpenTier === 'involved'} className="group border-t border-brand-border">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <div className="flex items-center gap-2">
              <Heart size={15} className="text-green-600" />
              <span className="text-sm font-medium text-brand-text">{t('wayfinder.get_involved')}</span>
              <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{involvedCount}</span>
              <Link href="/centers/action" className="text-[10px] font-mono font-bold uppercase tracking-wider hover:underline ml-1" style={{ color: CENTER_COLORS.Action }}>
                Action
              </Link>
            </div>
            <ChevronDown size={14} className="text-brand-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <ConnectionContext focusAreas={data.focusAreas} />
            {eventContent.map(function (c) {
              const themeKey = c.pathway_primary as keyof typeof THEMES | null
              const color = themeKey ? THEMES[themeKey]?.color : '#8B7E74'
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
            {data.services.map(function (s) {
              return (
                <Link key={s.service_id} href={'/services/' + s.service_id} className="flex items-start gap-2 group/svc">
                  {s.phone ? (
                    <Phone size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPin size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-brand-text group-hover/svc:text-brand-accent transition-colors line-clamp-2">{s.service_name}</span>
                    {(s.address || s.city) && (
                      <span className="text-[10px] text-brand-muted block">{[s.address, s.city].filter(Boolean).join(', ')}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </details>
      )}

      {/* Tier: Who's In Charge */}
      {deeperCount > 0 && (
        <details open={firstOpenTier === 'deeper'} className="group border-t border-brand-border">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-brand-bg/50 transition-colors select-none">
            <div className="flex items-center gap-2">
              <Scale size={15} className="text-blue-600" />
              <span className="text-sm font-medium text-brand-text">{t('wayfinder.go_deeper')}</span>
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{deeperCount}</span>
              <Link href="/centers/accountability" className="text-[10px] font-mono font-bold uppercase tracking-wider hover:underline ml-1" style={{ color: CENTER_COLORS.Accountability }}>
                Accountability
              </Link>
            </div>
            <ChevronDown size={14} className="text-brand-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <ConnectionContext focusAreas={data.focusAreas} />
            {data.officials.map(function (o) {
              return (
                <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-2 group/off">
                  {o.photo_url ? (
                    <img src={o.photo_url} alt="" className="w-7 h-7 rounded-full object-contain bg-brand-bg flex-shrink-0" />
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
          </div>
        </details>
      )}
    </aside>
  )
}
