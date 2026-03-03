import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

/**
 * @fileoverview POST /api/enrich — Step 3 (optional) of the content pipeline.
 *
 * Deep knowledge-graph enrichment for content that has already been classified.
 * Uses the FULL extracted text (not just og:description) to:
 *   1. Rewrite title + summary at 6th-grade reading level
 *   2. Reclassify with better accuracy (full text context)
 *   3. Extract organizations mentioned → create org entries + org_domains
 *   4. Resolve internal cross-references between content nodes
 *   5. Extract keywords from HTML meta tags
 *   6. Map action URLs (donate, volunteer, register, etc.)
 *
 * Auth: Requires API key (x-api-key) or cron secret (Bearer token).
 *
 * Body:
 *   { "batch_size": 5, "inbox_ids": ["uuid1"] }
 *
 * Env: ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helper ────────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=representation' : method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Taxonomy ────────────────────────────────────────────────────────────

async function fetchTaxonomy() {
  const get = (table: string, select = '*') =>
    supaRest('GET', `${table}?select=${select}&limit=500`)

  const [themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills] = await Promise.all([
    get('themes', 'theme_id,theme_name'),
    get('focus_areas', 'focus_id,focus_area_name,theme_id,sdg_id,ntee_code,airs_code,sdoh_code,is_bridging'),
    get('sdgs', 'sdg_id,sdg_number,sdg_name'),
    get('sdoh_domains', 'sdoh_code,sdoh_name'),
    get('ntee_codes', 'ntee_code,ntee_name'),
    get('airs_codes', 'airs_code,airs_name'),
    get('audience_segments', 'segment_id,segment_name,description'),
    get('life_situations', 'situation_id,situation_name,theme_id,urgency_level'),
    get('resource_types', 'resource_type_id,resource_type_name,center'),
    get('service_categories', 'service_cat_id,service_cat_name'),
    get('skills', 'skill_id,skill_name,skill_category'),
  ])

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills }
}

function buildTaxonomyPrompt(tax: Awaited<ReturnType<typeof fetchTaxonomy>>): string {
  const themeList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')

  const faByTheme: Record<string, string[]> = {}
  for (const fa of tax.focusAreas) {
    const key = fa.theme_id || 'NONE'
    if (!faByTheme[key]) faByTheme[key] = []
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`)
  }
  let faText = ''
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = tax.themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`
  }

  const segList = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const sitList = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rtList = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')
  const scList = tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n')
  const skillList = tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n')

  return `THEMES (pick 1 primary + 0-2 secondary):\n${themeList}\n\nFOCUS AREAS (pick 1-4 by ID):\n${faText}\n\nAUDIENCE SEGMENTS (pick 1-3):\n${segList}\n\nLIFE SITUATIONS (pick 0-3):\n${sitList}\n\nRESOURCE TYPES (pick 1):\n${rtList}\n\nSERVICE CATEGORIES (pick 0-2):\n${scList}\n\nSKILLS (pick 0-3):\n${skillList}\n\nCENTERS (pick 1): Learning | Action | Resource | Accountability`
}

// ── Claude helpers ──────────────────────────────────────────────────────

function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found`)
  return JSON.parse(text.substring(start, end + 1))
}

async function callClaude(system: string, user: string, maxTokens = 3000): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText.substring(0, 200)}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── Slug-to-inbox_id resolution ─────────────────────────────────────────

async function buildSlugMap(): Promise<Record<string, string>> {
  const items = await supaRest('GET', 'content_inbox?source_domain=eq.www.thechangelab.net&select=id,source_url&limit=500')
  const map: Record<string, string> = {}
  for (const item of items) {
    const slug = item.source_url.replace(/\/$/, '').split('/').pop()
    if (slug) map[slug] = item.id
  }
  return map
}

// ── Enrich a single item ────────────────────────────────────────────────

async function enrichItem(
  inboxItem: any,
  publishedItem: any,
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
  slugMap: Record<string, string>,
) {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  // Parse extracted_text JSON (contains full_text, tags, links, etc.)
  let extracted: any = {}
  try {
    extracted = typeof inboxItem.extracted_text === 'string'
      ? JSON.parse(inboxItem.extracted_text)
      : inboxItem.extracted_text || {}
  } catch {
    extracted = { full_text: inboxItem.extracted_text || '' }
  }

  const fullText = extracted.full_text || inboxItem.description || ''
  const sourceTags = extracted.tags || []
  const externalLinks = extracted.external_links || []
  const internalLinks = extracted.internal_links || []
  const downloadLinks = extracted.download_links || []
  const pageTitle = inboxItem.title || ''

  if (!pageTitle && fullText.length < 50) {
    return { success: false, error: 'Insufficient content' }
  }

  // Resolve internal links to inbox_ids
  const resolvedInternalLinks = internalLinks.map((link: any) => ({
    ...link,
    inbox_id: slugMap[link.slug] || null,
  })).filter((link: any) => link.inbox_id)

  // Build the enrichment prompt with FULL text
  const systemPrompt = `You are the Change Engine v2 knowledge graph enricher for Houston, Texas civic content.
You have the FULL article text (not just a summary). Your job is to:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) that captures ALL key information from the article
3. Classify against the EXACT taxonomy below using valid IDs only
4. Extract ALL organizations mentioned in the text with their URLs
5. Identify action items (donate, volunteer, sign up, etc.) from the content and links
6. Extract keywords that describe the content

The summary should be detailed enough that if the original source disappears, a reader would still understand the full scope of what was covered.

${taxonomyPrompt}`

  const userPrompt = `Original Title: ${pageTitle}
URL: ${inboxItem.source_url}
Source Tags: ${sourceTags.join(', ')}

FULL ARTICLE TEXT (${fullText.length} chars):
${fullText.substring(0, 6000)}

EXTERNAL LINKS FOUND ON PAGE:
${externalLinks.map((l: any) => `[${l.anchor_text}] → ${l.url} (${l.domain})`).join('\n')}

DOWNLOADABLE FILES:
${downloadLinks.map((l: any) => `[${l.anchor_text}] → ${l.url}`).join('\n')}

Return a single JSON object:
{
  "title_6th_grade": "Clear engaging title at 6th-grade level (max 80 chars)",
  "summary_6th_grade": "Comprehensive 150-300 word summary at 6th-grade level capturing all key info",
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
  "action_items": {
    "donate_url": null,
    "volunteer_url": null,
    "signup_url": null,
    "phone": null,
    "apply_url": null,
    "register_url": null,
    "attend_url": null
  },
  "organizations": [
    {"name": "Org Name", "url": "https://...", "description": "Brief description of what this org does"}
  ],
  "keywords": ["keyword1", "keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)

  let classification: any
  try {
    classification = parseClaudeJson(rawResponse)
  } catch {
    return { success: false, error: 'JSON parse failed', raw: rawResponse.substring(0, 200) }
  }

  // Validate + enrich focus areas (inherit SDGs, NTEE, AIRS, SDOH)
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

  const actions = classification.action_items || {}
  const confidence = classification.confidence ?? 0.85

  // ── Update content_published with enriched data ──
  const publishUpdate: any = {
    title_6th_grade: classification.title_6th_grade || publishedItem.title_6th_grade,
    summary_6th_grade: classification.summary_6th_grade || publishedItem.summary_6th_grade,
    pathway_primary: classification.theme_primary || publishedItem.pathway_primary,
    pathway_secondary: classification.theme_secondary || publishedItem.pathway_secondary || [],
    focus_area_ids: validFocusAreaIds.length > 0 ? validFocusAreaIds : publishedItem.focus_area_ids,
    center: classification.center || publishedItem.center,
    sdg_ids: allSdgIds,
    sdoh_domain: sdohCode || publishedItem.sdoh_domain,
    audience_segments: classification.audience_segment_ids || publishedItem.audience_segments || [],
    life_situations: classification.life_situation_ids || publishedItem.life_situations || [],
    resource_type: classification.resource_type_id || publishedItem.resource_type,
    geographic_scope: classification.geographic_scope || publishedItem.geographic_scope,
    confidence,
    classification_reasoning: classification.reasoning || '',
    action_donate: actions.donate_url || publishedItem.action_donate,
    action_volunteer: actions.volunteer_url || publishedItem.action_volunteer,
    action_signup: actions.signup_url || publishedItem.action_signup,
    action_register: actions.register_url || publishedItem.action_register,
    action_apply: actions.apply_url || publishedItem.action_apply,
    action_call: actions.phone || publishedItem.action_call,
    action_attend: actions.attend_url || publishedItem.action_attend,
  }

  await supaRest('PATCH', `content_published?inbox_id=eq.${inboxItem.id}`, publishUpdate)

  // ── Update content_review_queue with enriched classification ──
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
    _source_tags: sourceTags,
    _keywords: classification.keywords || [],
    _internal_refs: resolvedInternalLinks.map((l: any) => ({ inbox_id: l.inbox_id, slug: l.slug, anchor: l.anchor_text })),
    _external_orgs: classification.organizations || [],
    _download_links: downloadLinks,
    _version: 'v3-deep-enrich',
  }

  await supaRest('PATCH', `content_review_queue?inbox_id=eq.${inboxItem.id}`, {
    ai_classification: enrichedClassification,
    confidence,
  })

  // ── Create organization entries for extracted orgs ──
  const orgsCreated: string[] = []
  for (const org of (classification.organizations || [])) {
    if (!org.name || !org.url) continue
    const domain = org.url.match(/https?:\/\/([^/]+)/)?.[1] || ''
    if (!domain) continue

    // Check if org already exists by domain
    const existing = await supaRest('GET', `organizations?select=org_id&limit=1`)
      .catch(() => [])

    // We'll use org_domains to check
    const domainCheck = await supaRest('GET', `org_domains?domain=eq.${domain}&select=org_id`)
      .catch(() => [])

    if (domainCheck && domainCheck.length > 0) {
      orgsCreated.push(`${org.name} (exists: ${domainCheck[0].org_id})`)
      continue
    }

    // Create new org — use a deterministic ID from the domain
    const orgId = 'ORG_CL_' + domain.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30).toUpperCase()

    try {
      await supaRest('POST', 'organizations', {
        org_id: orgId,
        org_name: org.name,
        website: org.url,
        description_5th_grade: org.description || '',
        focus_area_ids: validFocusAreaIds.join(','),
        data_source: 'thechangelab.net',
      })
      // Also register the domain
      await supaRest('POST', 'org_domains', {
        org_id: orgId,
        domain,
      }).catch(() => {}) // ignore if org_domains schema differs

      orgsCreated.push(`${org.name} (NEW: ${orgId})`)
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.includes('duplicate') || msg.includes('23505')) {
        orgsCreated.push(`${org.name} (exists: ${orgId})`)
      } else {
        orgsCreated.push(`${org.name} (failed: ${msg.substring(0, 80)})`)
      }
    }
  }

  return {
    success: true,
    inbox_id: inboxItem.id,
    title: classification.title_6th_grade,
    summary_length: (classification.summary_6th_grade || '').length,
    focus_areas: validFocusAreaIds,
    center: classification.center,
    confidence,
    orgs_extracted: orgsCreated,
    internal_refs: resolvedInternalLinks.length,
    keywords: classification.keywords || [],
  }
}

// ── Route handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const batchSize = Math.min(body.batch_size || 5, 20)
  const inboxIds: string[] | undefined = body.inbox_ids

  // Fetch taxonomy + slug map once for the batch
  const [taxonomy, slugMap] = await Promise.all([
    fetchTaxonomy(),
    buildSlugMap(),
  ])
  const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

  // Get items to enrich — join inbox + published
  let inboxItems: any[]
  if (inboxIds && inboxIds.length > 0) {
    const idFilter = inboxIds.map(id => `"${id}"`).join(',')
    inboxItems = await supaRest('GET', `content_inbox?id=in.(${idFilter})&select=*`)
  } else {
    // Get published items from thechangelab.net that haven't been enriched yet
    // We'll check for items where the review queue still has v2-full-matrix version
    inboxItems = await supaRest('GET',
      `content_inbox?source_domain=eq.www.thechangelab.net&status=eq.published&select=*&order=created_at.asc&limit=${batchSize}`)
  }

  if (!inboxItems || inboxItems.length === 0) {
    return NextResponse.json({ message: 'No items to enrich', processed: 0 })
  }

  // For batch mode, track which have already been enriched
  const results: any[] = []
  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const inboxItem of inboxItems) {
    // Get the published item
    const pubItems = await supaRest('GET', `content_published?inbox_id=eq.${inboxItem.id}&select=*`)
    if (!pubItems || pubItems.length === 0) {
      results.push({ url: inboxItem.source_url, success: false, error: 'Not published' })
      skipped++
      continue
    }

    // Check if already enriched (v3)
    const queueItems = await supaRest('GET', `content_review_queue?inbox_id=eq.${inboxItem.id}&select=ai_classification`)
    if (queueItems && queueItems.length > 0) {
      const version = queueItems[0].ai_classification?._version
      if (version === 'v3-deep-enrich' && !inboxIds) {
        skipped++
        continue
      }
    }

    try {
      const result = await enrichItem(inboxItem, pubItems[0], taxonomy, taxonomyPrompt, slugMap)
      results.push({ url: inboxItem.source_url, ...result })
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ url: inboxItem.source_url, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit: 1.5s between Claude calls
    if (inboxItems.indexOf(inboxItem) < inboxItems.length - 1) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  return NextResponse.json({
    processed: succeeded + failed,
    succeeded,
    failed,
    skipped,
    results,
  })
}
