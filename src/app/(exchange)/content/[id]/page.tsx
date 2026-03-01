import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { ActionBar } from '@/components/exchange/ActionBar'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { getFocusAreasByIds, getSDGMap, getSDOHMap, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'

function resolveThemeSlug(themeId: string | null) {
  if (!themeId) return null
  var entry = Object.entries(THEMES).find(function ([id]) { return id === themeId })
  return entry ? entry[1].slug : null
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  var { id } = await params
  var supabase = await createClient()
  var { data } = await supabase.from('content_published').select('title_6th_grade, summary_6th_grade').eq('id', id).eq('is_active', true).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.title_6th_grade,
    description: data.summary_6th_grade || 'Details on The Change Engine.',
  }
}

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('content_published')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!item) notFound()

  // Get language preference
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })

  // Fetch translations if non-English
  var translatedTitle: string | null = null
  var translatedSummary: string | null = null
  var isTranslated = false
  if (langConfig && langConfig.langId && item.inbox_id) {
    const { data: translations } = await supabase
      .from('translations')
      .select('field_name, translated_text, language_id')
      .eq('content_id', item.inbox_id)
      .eq('language_id', langConfig.langId)
    if (translations) {
      translations.forEach(function (t) {
        if ((t.field_name === 'title' || t.field_name === 'title_6th_grade') && t.translated_text) { translatedTitle = t.translated_text; isTranslated = true }
        if ((t.field_name === 'summary' || t.field_name === 'summary_6th_grade') && t.translated_text) { translatedSummary = t.translated_text; isTranslated = true }
      })
    }
  }

  // Resolve focus areas (full objects for clickable pills)
  const focusAreas = item.focus_area_ids && item.focus_area_ids.length > 0
    ? await getFocusAreasByIds(item.focus_area_ids)
    : []

  // Fetch SDG map, SDOH map, and related opportunities/policies in parallel
  const [sdgMap, sdohMap, opportunities, policies] = await Promise.all([
    item.sdg_ids && item.sdg_ids.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    item.sdoh_domain ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
    item.focus_area_ids && item.focus_area_ids.length > 0 ? getRelatedOpportunities(item.focus_area_ids) : Promise.resolve([]),
    item.focus_area_ids && item.focus_area_ids.length > 0 ? getRelatedPolicies(item.focus_area_ids) : Promise.resolve([]),
  ])

  // Resolve life situations
  var lifeSituationLinks: Array<{ name: string; slug: string }> = []
  if (item.life_situations && item.life_situations.length > 0) {
    const { data: sits } = await supabase
      .from('life_situations')
      .select('situation_id, situation_name, situation_slug')
      .in('situation_id', item.life_situations)
    if (sits) {
      lifeSituationLinks = sits
        .filter(function (s) { return s.situation_slug != null })
        .map(function (s) { return { name: s.situation_name, slug: s.situation_slug! } })
    }
  }

  // Related content
  const { data: related } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at')
    .eq('pathway_primary', item.pathway_primary || '')
    .eq('is_active', true)
    .neq('id', item.id)
    .limit(4)

  var title = translatedTitle || item.title_6th_grade
  var summary = translatedSummary || item.summary_6th_grade
  var themeSlug = resolveThemeSlug(item.pathway_primary)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          {item.image_url && (
            <div className="w-full mb-6 rounded-xl overflow-hidden">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <ThemePill themeId={item.pathway_primary} size="sm" />
            <CenterBadge center={item.center} />
            {isTranslated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Machine translated</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-brand-text mb-3">{title}</h1>

          <div className="flex items-center gap-3 text-sm text-brand-muted mb-6">
            {item.source_domain && <span>{item.source_domain}</span>}
            {item.published_at && <span>{new Date(item.published_at).toLocaleDateString()}</span>}
            {item.confidence != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg">{Math.round(item.confidence * 100)}% confidence</span>
            )}
          </div>

          {/* Summary */}
          <div className="prose max-w-none mb-8">
            <p className="text-brand-text leading-relaxed">{summary}</p>
          </div>

          {/* Classification reasoning */}
          {item.classification_reasoning && (
            <details className="mb-8 bg-brand-bg rounded-xl p-4">
              <summary className="cursor-pointer text-sm font-medium text-brand-muted">Why was this classified here?</summary>
              <p className="text-sm text-brand-muted mt-2">{item.classification_reasoning}</p>
            </details>
          )}

          {/* Action bar */}
          <div className="mb-8">
            <ActionBar
              actionDonate={item.action_donate}
              actionVolunteer={item.action_volunteer}
              actionSignup={item.action_signup}
              actionRegister={item.action_register}
              actionApply={item.action_apply}
              actionCall={item.action_call}
              actionAttend={item.action_attend}
            />
          </div>

          {/* Source link */}
          <div className="mb-8">
            <Link
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-brand-border rounded-lg text-sm text-brand-accent hover:bg-brand-bg transition-colors"
            >
              View original source &rarr;
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pathway */}
          {themeSlug && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Pathway</h3>
              <Link href={'/pathways/' + themeSlug}>
                <ThemePill themeId={item.pathway_primary} size="sm" />
              </Link>
            </div>
          )}

          {/* Focus Areas */}
          {focusAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Focus Areas</h3>
              <FocusAreaPills focusAreas={focusAreas} />
            </div>
          )}

          {/* SDGs */}
          {item.sdg_ids && item.sdg_ids.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">SDGs</h3>
              <div className="flex flex-wrap gap-1">
                {item.sdg_ids.map(function (sdg) {
                  var info = sdgMap[sdg]
                  if (info) {
                    return <SDGBadge key={sdg} sdgNumber={info.sdg_number} sdgName={info.sdg_name} sdgColor={info.sdg_color} linkToExplore />
                  }
                  return <span key={sdg} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">SDG {sdg.replace('SDG_', '')}</span>
                })}
              </div>
            </div>
          )}

          {/* SDOH Domain */}
          {item.sdoh_domain && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">SDOH Domain</h3>
              {sdohMap[item.sdoh_domain] ? (
                <SDOHBadge
                  sdohCode={item.sdoh_domain}
                  sdohName={sdohMap[item.sdoh_domain].sdoh_name}
                  sdohDescription={sdohMap[item.sdoh_domain].sdoh_description}
                  linkToExplore
                />
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.sdoh_domain}</span>
              )}
            </div>
          )}

          {/* Audience */}
          {item.audience_segments && item.audience_segments.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Audience</h3>
              <div className="flex flex-wrap gap-1">
                {item.audience_segments.map(function (seg) {
                  return <span key={seg} className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{seg}</span>
                })}
              </div>
            </div>
          )}

          {/* Life Situations */}
          {lifeSituationLinks.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Life Situations</h3>
              <div className="flex flex-wrap gap-1">
                {lifeSituationLinks.map(function (s) {
                  return (
                    <Link key={s.slug} href={'/help/' + s.slug} className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-accent hover:underline">
                      {s.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Opportunities</h3>
              <div className="space-y-3">
                {opportunities.slice(0, 5).map(function (o) {
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
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Policies */}
          {policies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Related Policies</h3>
              <div className="space-y-3">
                {policies.slice(0, 5).map(function (p) {
                  return (
                    <PolicyCard
                      key={p.policy_id}
                      name={p.policy_name}
                      summary={p.summary_5th_grade}
                      billNumber={p.bill_number}
                      status={p.status}
                      level={p.level}
                      sourceUrl={p.source_url}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related content */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <RelatedContent items={related} />
        </div>
      )}
    </div>
  )
}
