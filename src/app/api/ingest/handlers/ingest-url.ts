/**
 * Full URL ingestion pipeline (10 steps):
 * dedup → scrape → inbox → classify → multi-item → validate → review → translate → orgs → log
 */

import { scrapeUrl } from './scraper'
import { callClaude, parseClaudeJson, translateItem } from './claude'
import { supaRest, supaUpsert, populateJunctionTables, junctionErrors } from './supabase-helpers'
import { extractMultipleEvents, extractMultipleArticles } from './multi-item-extraction'
import type { Taxonomy } from './taxonomy'

export async function ingestUrl(
  url: string,
  taxonomy: Taxonomy,
  taxonomyPrompt: string,
): Promise<any> {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  // Step 1: Check for duplicates
  const existing = await supaRest('GET', `content_inbox?source_url=eq.${encodeURIComponent(url)}&select=id,status&limit=1`)
  if (existing && existing.length > 0) {
    return { success: false, stage: 'dedup', error: 'URL already ingested', inbox_id: existing[0].id }
  }

  // Step 2: Scrape the URL
  let scraped
  try {
    scraped = await scrapeUrl(url)
  } catch (e) {
    return { success: false, stage: 'scrape', error: `Failed to fetch URL: ${(e as Error).message}` }
  }

  const { fullText, meta, externalLinks, internalLinks, downloadLinks } = scraped
  if (fullText.length < 100) {
    return { success: false, stage: 'scrape', error: 'Insufficient content extracted (< 100 chars)' }
  }

  // Step 3: Create inbox entry
  const inboxId = crypto.randomUUID()
  await supaRest('POST', 'content_inbox', {
    id: inboxId,
    source_url: url,
    source_domain: meta.domain,
    title: meta.title,
    description: meta.description,
    image_url: meta.image || null,
    extracted_text: JSON.stringify({
      full_text: fullText,
      tags: [],
      external_links: externalLinks.map(l => ({ url: l.url, anchor_text: l.anchor, domain: l.domain })),
      internal_links: internalLinks.map(l => ({ url: l.url, anchor_text: l.anchor, slug: l.slug })),
      download_links: downloadLinks.map(l => ({ url: l.url, anchor_text: l.anchor })),
    }),
    status: 'pending',
  })

  // Step 4: Classify with Claude
  const systemPrompt = `You are the Change Engine v3 knowledge graph enricher for Houston, Texas civic content.

CRITICAL: You are classifying NEWSFEED content — articles, videos, research, reports, DIY activities, courses. This is NOT community resource classification. News flows as a per-pathway feed. Resources are separate entity types (services, organizations, benefits).

You have the FULL article text. Your job is to identify EVERY dimension:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
3. Identify the ORGANIZATION(s) responsible — who published or is featured
4. Identify the LOCATION(s) — neighborhoods, ZIP codes, districts
5. Identify the SERVICE(s) referenced — what civic services are mentioned
6. Classify the OBJECT TYPE — what format is this (video, report, article, course, etc.)
7. Classify the THEME/PATHWAY — which of the 7 pathways
8. Classify the FOCUS AREA(s) — specific topics within the pathway
9. Classify the ENGAGEMENT LEVEL — Learning, Action, Resource, or Accountability
10. Identify TIME COMMITMENT — how long to engage with this
11. Identify ACTION TYPE(s) — what actions can someone take
12. Identify WHO this is for — audience segments
13. Identify WHAT LIFE SITUATION this addresses
14. Extract action items (donate, volunteer, sign up, etc.)
15. Extract keywords

The summary should be detailed enough that if the original source disappears, a reader would still understand everything.

${taxonomyPrompt}`

  const userPrompt = `Title: ${meta.title}
URL: ${url}
Source: ${meta.domain}

FULL TEXT (${fullText.length} chars):
${fullText.substring(0, 6000)}

EXTERNAL LINKS:
${externalLinks.slice(0, 30).map(l => `[${l.anchor}] → ${l.url}`).join('\n')}

DOWNLOADS:
${downloadLinks.map(l => `[${l.anchor}] → ${l.url}`).join('\n')}

Return JSON:
{
  "title_6th_grade": "...",
  "summary_6th_grade": "...",
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
  "event_start_date": "ISO 8601 datetime if this is an event, null otherwise",
  "event_end_date": "ISO 8601 datetime if event has end date, null otherwise",
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

  // Step 4b: Multi-item extraction
  let earlyOrgId: string | null = null
  const earlyDomainMatch = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(meta.domain)}&select=org_id`).catch(() => [])
  if (earlyDomainMatch && earlyDomainMatch.length > 0) {
    earlyOrgId = earlyDomainMatch[0].org_id
  }

  const isEventListing = classification.content_type === 'event'
  const isNewsListing = classification.content_type === 'article' && fullText.length > 3000
  if (isEventListing || isNewsListing) {
    try {
      const multiResult = isEventListing
        ? await extractMultipleEvents(fullText, meta, url, taxonomy, taxonomyPrompt, inboxId, validFocusIds, earlyOrgId)
        : await extractMultipleArticles(fullText, meta, url, taxonomy, taxonomyPrompt, inboxId, validFocusIds, earlyOrgId)
      if (multiResult) {
        const listingType = isEventListing ? 'event_listing' : 'news_listing'
        await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'processed', content_type: listingType })
        return {
          success: true,
          inbox_id: inboxId,
          stage: isEventListing ? 'multi_event' : 'multi_article',
          title: meta.title,
          items_extracted: multiResult.length,
          items: multiResult,
        }
      }
    } catch (e) {
      console.error('Multi-item extraction failed, continuing with single item:', (e as Error).message)
    }
  }

  // Step 5: Validate + enrich focus areas
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

  const status = 'needs_review'
  const reviewStatus = 'pending'

  // Step 6: Update inbox + create review queue entry
  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status, content_type: classification.content_type || null })

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
    _download_links: downloadLinks.map(l => ({ url: l.url, anchor_text: l.anchor })),
    _version: 'v3-deep-enrich',
  }

  await supaRest('POST', 'content_review_queue', {
    inbox_id: inboxId,
    ai_classification: enrichedClassification,
    confidence,
    review_status: reviewStatus,
  })

  // Step 7: Populate junction tables
  await populateJunctionTables(inboxId, enrichedClassification)

  // Step 8: Translate to Spanish + Vietnamese
  const translations: Record<string, any> = {}
  const title6 = classification.title_6th_grade || meta.title
  const summary6 = classification.summary_6th_grade || meta.description

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

  // Step 9: Create organization entries
  const orgsCreated: string[] = []
  let resolvedOrgId: string | null = null

  const sourceDomainMatch = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(meta.domain)}&select=org_id`).catch(() => [])
  if (sourceDomainMatch && sourceDomainMatch.length > 0) {
    resolvedOrgId = sourceDomainMatch[0].org_id
  }

  for (const org of (classification.organizations || [])) {
    if (!org.name) continue
    const orgUrl = org.url || ''
    const domain = orgUrl.match(/https?:\/\/([^/]+)/)?.[1] || ''
    if (!domain) continue

    const domainCheck = await supaRest('GET', `org_domains?domain=eq.${encodeURIComponent(domain)}&select=org_id`).catch(() => [])
    if (domainCheck && domainCheck.length > 0) {
      orgsCreated.push(`${org.name} (exists)`)
      if (!resolvedOrgId && domain === meta.domain) {
        resolvedOrgId = domainCheck[0].org_id
      }
      continue
    }

    const orgId = 'ORG_ING_' + domain.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30).toUpperCase()
    try {
      await supaRest('POST', 'organizations', {
        org_id: orgId,
        org_name: org.name,
        website: orgUrl,
        description_5th_grade: org.description || '',
        focus_area_ids: validFocusAreaIds.join(','),
        data_source: meta.domain,
      })
      await supaRest('POST', 'org_domains', { org_id: orgId, domain }).catch(() => {})

      for (const focusId of validFocusAreaIds) {
        await supaRest('POST', 'organization_focus_areas', {
          org_id: orgId,
          focus_id: focusId,
        }).catch(() => {})
      }

      orgsCreated.push(`${org.name} (NEW: ${orgId})`)
      if (!resolvedOrgId) resolvedOrgId = orgId
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.includes('duplicate') || msg.includes('23505')) {
        orgsCreated.push(`${org.name} (exists)`)
      }
    }
  }

  // Step 9b: Link resolved org to this content
  if (resolvedOrgId) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { org_id: resolvedOrgId }).catch(() => {})
    await supaRest('PATCH', `content_review_queue?inbox_id=eq.${inboxId}`, { org_id: resolvedOrgId }).catch(() => {})
  }

  // Step 10: Log
  const junctionIssues = junctionErrors.length > 0
    ? ` | junction_errors: ${junctionErrors.map(e => e.table).join(', ')}`
    : ''
  junctionErrors.length = 0

  const translationIssues = Object.entries(translations)
    .filter(([, v]: [string, any]) => v.error)
    .map(([lang]) => lang)
  const translationNote = translationIssues.length > 0
    ? ` | translation_failed: ${translationIssues.join(', ')}`
    : ''

  await supaRest('POST', 'ingestion_log', {
    event_type: 'unified_ingest',
    source: meta.domain,
    source_url: url,
    status: junctionIssues || translationNote ? 'partial' : 'success',
    message: `Full pipeline: ${validFocusAreaIds.length}FA ${allSdgIds.length}SDG | conf:${confidence} | ${Object.keys(translations).length} translations | ${orgsCreated.length} orgs${junctionIssues}${translationNote}`,
    item_count: 1,
  })

  return {
    success: true,
    inbox_id: inboxId,
    stage: status,
    title: classification.title_6th_grade,
    confidence,
    focus_areas: validFocusAreaIds,
    center: classification.center,
    sdgs: allSdgIds,
    keywords: classification.keywords || [],
    organizations: orgsCreated,
    translations,
    downloads: downloadLinks.length,
    text_length: fullText.length,
  }
}
