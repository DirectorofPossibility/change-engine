import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ActionBar } from '@/components/exchange/ActionBar'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { RelatedContent } from '@/components/exchange/RelatedContent'

function resolveThemeSlug(themeId: string | null) {
  if (!themeId) return null
  var entry = Object.entries(THEMES).find(function ([id]) { return id === themeId })
  return entry ? entry[1].slug : null
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
        if (t.field_name === 'title' && t.translated_text) { translatedTitle = t.translated_text; isTranslated = true }
        if (t.field_name === 'summary' && t.translated_text) { translatedSummary = t.translated_text; isTranslated = true }
      })
    }
  }

  // Resolve focus areas
  var focusAreaNames: string[] = []
  if (item.focus_area_ids && item.focus_area_ids.length > 0) {
    const { data: areas } = await supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name')
      .in('focus_id', item.focus_area_ids)
    if (areas) {
      focusAreaNames = areas.map(function (a) { return a.focus_area_name })
    }
  }

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
          {focusAreaNames.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">Focus Areas</h3>
              <FocusAreaPills focusAreaNames={focusAreaNames} />
            </div>
          )}

          {/* SDGs */}
          {item.sdg_ids && item.sdg_ids.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">SDGs</h3>
              <div className="flex flex-wrap gap-1">
                {item.sdg_ids.map(function (sdg) {
                  return <span key={sdg} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">SDG {sdg.replace('SDG_', '')}</span>
                })}
              </div>
            </div>
          )}

          {/* SDOH Domain */}
          {item.sdoh_domain && (
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-semibold text-brand-muted mb-2">SDOH Domain</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.sdoh_domain}</span>
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
