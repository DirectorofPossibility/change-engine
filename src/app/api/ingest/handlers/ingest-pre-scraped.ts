/**
 * Pre-scraped item ingestion pipeline (skip fetch, go straight to classify).
 *
 * Used by batch `items` mode where the caller has already extracted text
 * externally (e.g., government RSS feeds).
 */

import { callClaude, parseClaudeJson, translateItem } from './claude'
import { supaRest, supaUpsert, populateJunctionTables } from './supabase-helpers'
import type { Taxonomy } from './taxonomy'

export async function ingestPreScraped(
  item: { url: string; title: string; description: string; image_url: string; full_text: string; source: string; domain: string },
  taxonomy: Taxonomy,
  taxonomyPrompt: string,
): Promise<any> {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  // Dedup
  const existing = await supaRest('GET', `content_inbox?source_url=eq.${encodeURIComponent(item.url)}&select=id,status&limit=1`)
  if (existing && existing.length > 0) {
    return { success: false, stage: 'dedup', error: 'Already ingested', inbox_id: existing[0].id }
  }

  if (!item.full_text || item.full_text.length < 100) {
    return { success: false, stage: 'scrape', error: 'Insufficient content (< 100 chars)' }
  }

  // Create inbox entry
  const inboxId = crypto.randomUUID()
  await supaRest('POST', 'content_inbox', {
    id: inboxId,
    source_url: item.url,
    source_domain: item.domain || new URL(item.url).hostname,
    title: item.title,
    description: item.description,
    image_url: item.image_url || null,
    extracted_text: JSON.stringify({ full_text: item.full_text, tags: [], external_links: [], internal_links: [], download_links: [] }),
    status: 'pending',
  })

  // Classify
  const systemPrompt = `You are the Change Engine v3 knowledge graph enricher for Houston, Texas civic content.

CRITICAL: You are classifying NEWSFEED content — articles, videos, research, reports, DIY activities, courses. This is NOT community resource classification. News flows as a per-pathway feed. Resources are separate entity types (services, organizations, benefits).

You have the FULL article text. Your job is to identify EVERY dimension:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a subtitle/tagline if one exists on the page, or null
3. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
4. Extract the author name(s) and publication date if listed
5. Identify the ORGANIZATION(s) responsible — who published or is featured
6. Identify PARTNER ORGANIZATIONS — collaborating or featured orgs (separate from source)
7. Identify the LOCATION(s) — neighborhoods, ZIP codes, districts
8. Identify the SERVICE(s) referenced — what civic services are mentioned
9. Classify the OBJECT TYPE — what format is this (video, report, article, course, etc.)
10. Classify the THEME/PATHWAY — which of the 7 pathways
11. Classify the FOCUS AREA(s) — specific topics within the pathway
12. Classify the ENGAGEMENT LEVEL — Learning, Action, Resource, or Accountability
13. Identify TIME COMMITMENT — how long to engage with this
14. Identify ACTION TYPE(s) — what actions can someone take
15. Identify WHO this is for — audience segments
16. Identify WHAT LIFE SITUATION this addresses
17. Extract KEY STATISTICS — numbers/metrics as {value, label} pairs (max 4)
18. Extract STRUCTURED SECTIONS — numbered headings with plain-language summaries
19. Extract an exact PULL QUOTE with attribution if one exists
20. Extract STRUCTURED ACTION CARDS — each CTA on the page as {title, description, cta_text, cta_url}
21. Extract action item URLs (donate, volunteer, sign up, register, attend, apply, phone)
22. Extract download URL if a PDF or file is available
23. Identify cost: Free | Paid | Sliding Scale
24. Extract all raw tags/categories/labels from the page as-is
25. Extract keywords
26. Determine expiration: set expires_at for events/time-limited content, null for evergreen

RULES:
- Never invent data. Only extract what is on the page.
- OMIT any field you cannot determine from the page content — do not include null values or empty arrays. Exception: always include "cost" (use "Free" if unclear).
- summary and section summaries must be rewritten at 6th-grade level.
- hero_quote must be the exact quote — do not paraphrase.
- Use asset-based language — focus on strengths, opportunities, and what's available.
- The summary should be detailed enough that if the original source disappears, a reader would still understand everything.
- For expires_at: events expire after their end date, time-limited opportunities/resources expire on their deadline. Omit for evergreen content.

${taxonomyPrompt}`

  const userPrompt = `Title: ${item.title}
URL: ${item.url}
Source: ${item.source}

FULL TEXT (${item.full_text.length} chars):
${item.full_text.substring(0, 6000)}

Return JSON:
{
  "title_6th_grade": "...",
  "subtitle": "Tagline or sub-heading, or null",
  "summary_6th_grade": "...",
  "author": "Author name(s) or null",
  "publication_date": "YYYY-MM-DD or null",
  "theme_primary": "THEME_XX",
  "theme_secondary": [],
  "focus_area_ids": ["FA_XXX"],
  "sdg_ids": ["SDG_XX"],
  "sdoh_code": "SDOH_XX",
  "ntee_codes": ["X"],
  "airs_codes": ["X"],
  "center": "Learning|Action|Resource|Accountability",
  "resource_type_id": "RTYPE_XX",
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["SIT_XXX"],
  "service_cat_ids": ["SCAT_XX"],
  "skill_ids": ["SKILL_XX"],
  "time_commitment_id": "TIME_XX or null",
  "action_type_ids": ["ATYPE_XX"],
  "gov_level_id": "GOV_XX or null",
  "content_type": "article|event|report|video|opportunity|guide|course|announcement|campaign|tool",
  "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},
  "structured_actions": [{"title":"...","description":"...","cta_text":"...","cta_url":"https://..."}],
  "hero_quote": "Exact pull quote or null",
  "hero_quote_attribution": "Name and title/org or null",
  "key_stats": [{"value":"6","label":"States in pilot"}],
  "sections": [{"number":1,"heading":"...","summary":"..."}],
  "partner_organizations": [{"name":"...","url":"https://..."}],
  "download_url": "Direct PDF/file URL or null",
  "cost": "Free|Paid|Sliding Scale or null",
  "raw_tags": ["tag1","tag2"],
  "event_start_date": "ISO 8601 datetime if event, null otherwise",
  "event_end_date": "ISO 8601 datetime if event has end date, null otherwise",
  "expires_at": "ISO 8601 datetime when content expires, null for evergreen",
  "organizations": [{"name":"...","url":"https://...","description":"..."}],
  "locations": {"neighborhoods":[],"zip_codes":[],"city":"Houston","district":""},
  "keywords": ["keyword1","keyword2"],
  "geographic_scope": "Houston|Harris County|Texas|National|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  let classification: any
  try {
    const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)
    classification = parseClaudeJson(rawResponse)
  } catch (e) {
    const errMsg = (e as Error).message
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, {
      status: 'flagged',
      last_error: `Classification failed: ${errMsg}`.substring(0, 500),
      retry_count: 0,
    })
    return { success: false, stage: 'classify', error: `Classification failed: ${errMsg}`, inbox_id: inboxId }
  }

  // Validate focus areas + inherit taxonomy
  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    }
  }

  const validFocusAreaIds = enrichedFocusAreas.map((fa: any) => fa.focus_id)
  const allSdgIds = Array.from(new Set([...Array.from(inheritedSdgs), ...(classification.sdg_ids || [])]))
  const allNteeCodes = Array.from(new Set([...Array.from(inheritedNtee), ...(classification.ntee_codes || [])]))
  const allAirsCodes = Array.from(new Set([...Array.from(inheritedAirs), ...(classification.airs_codes || [])]))
  const sdohCode = classification.sdoh_code || inheritedSdoh
  const confidence = classification.confidence ?? 0.85

  const preScrapedStatus = 'needs_review'
  const preScrapedReviewStatus = 'pending'

  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: preScrapedStatus, content_type: classification.content_type || null })

  const enrichedClassification = {
    ...classification,
    sdg_ids: allSdgIds,
    ntee_codes: allNteeCodes,
    airs_codes: allAirsCodes,
    sdoh_code: sdohCode,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _keywords: classification.keywords || [],
    _external_orgs: classification.organizations || [],
    _version: 'v3-deep-enrich',
  }

  await supaRest('POST', 'content_review_queue', {
    inbox_id: inboxId,
    ai_classification: enrichedClassification,
    confidence,
    review_status: preScrapedReviewStatus,
  })

  await populateJunctionTables(inboxId, enrichedClassification)

  // Translate
  const translations: Record<string, any> = {}
  const title6 = classification.title_6th_grade || item.title
  const summary6 = classification.summary_6th_grade || item.description

  if (title6) {
    const langs = [
      { code: 'es', name: 'Spanish', id: 'LANG-ES' },
      { code: 'vi', name: 'Vietnamese', id: 'LANG-VI' },
    ]
    for (const lang of langs) {
      try {
        const result = await translateItem(title6, summary6, lang.code, lang.name)
        const idPrefix = inboxId.substring(0, 8)
        await supaUpsert('translations', {
          translation_id: `TR-${idPrefix}-${lang.code}-title`,
          content_type: 'content_published',
          content_id: inboxId,
          field_name: 'title_6th_grade',
          language_id: lang.id,
          translated_text: result.title,
          is_verified: 'No',
          machine_translated: 'Yes',
          data_source: 'Claude API',
          last_updated: new Date().toISOString(),
        }, 'translation_id')
        if (result.summary) {
          await supaUpsert('translations', {
            translation_id: `TR-${idPrefix}-${lang.code}-summary`,
            content_type: 'content_published',
            content_id: inboxId,
            field_name: 'summary_6th_grade',
            language_id: lang.id,
            translated_text: result.summary,
            is_verified: 'No',
            machine_translated: 'Yes',
            data_source: 'Claude API',
            last_updated: new Date().toISOString(),
          }, 'translation_id')
        }
        translations[lang.code] = { title: result.title, summary: result.summary }
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        translations[lang.code] = { error: (e as Error).message }
      }
    }
  }

  // Log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'gov_ingest',
    source: item.source,
    source_url: item.url,
    status: 'success',
    message: `Gov pipeline: ${validFocusAreaIds.length}FA ${allSdgIds.length}SDG | conf:${confidence} | ${Object.keys(translations).length} translations`,
    item_count: 1,
  })

  return {
    success: true,
    inbox_id: inboxId,
    stage: preScrapedStatus,
    title: classification.title_6th_grade,
    confidence,
    focus_areas: validFocusAreaIds,
    translations: Object.keys(translations).length,
  }
}
