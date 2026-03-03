/**
 * @fileoverview Unified content ingestion pipeline for The Change Engine.
 *
 * This is step 1 of the content pipeline. It accepts URLs (single, batch, or
 * pre-scraped items) and drives the full ingestion flow:
 *
 *   1. **Scrape** -- fetch the URL, strip HTML, extract metadata and links.
 *   2. **Classify** -- send full extracted text to Claude with the complete
 *      taxonomy prompt; receive theme, focus-area, SDG, NTEE, AIRS, SDOH,
 *      audience, and action-item classifications.
 *   3. **Review** -- create `content_inbox` and `content_review_queue` rows;
 *      confidence thresholds determine whether content is auto-classified,
 *      flagged, or queued for human review.
 *   4. **Translate** -- translate the 6th-grade title and summary to Spanish
 *      (LANG-ES) and Vietnamese (LANG-VI) via Claude.
 *   5. **Extract orgs** -- pull organization names/URLs from the Claude
 *      response and upsert them into `organizations` / `org_domains`.
 *
 * Two request shapes are supported:
 *   - **URL mode:** `{ "url": "..." }` or `{ "urls": [...] }` -- the route
 *     fetches and scrapes each URL before classifying.
 *   - **Pre-scraped batch mode:** `{ "items": [...] }` -- callers supply
 *     already-extracted text, skipping the fetch/scrape step.
 *
 * SSRF protection: {@link validateUrl} rejects private/internal IP ranges,
 * localhost, and link-local addresses before any outbound fetch is made.
 *
 * Auth: every request is validated by {@link validateApiRequest} from
 * `@/lib/api-auth`.
 *
 * Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY` (or
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback), `NEXT_PUBLIC_SUPABASE_URL`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helpers ──────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function supaUpsert(table: string, body: Record<string, unknown>, conflictCol: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── URL scraping ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  // Convert block tags to newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote|section|article)[^>]*>/gi, '\n')
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  return text.trim()
}

function extractMeta(html: string): { title: string; description: string; image: string; domain: string } {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)?.[1]
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1]
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i)?.[1]
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]

  return {
    title: ogTitle || titleTag || '',
    description: ogDesc || '',
    image: ogImage || '',
    domain: '',
  }
}

function extractLinks(html: string, baseUrl: string): { external: Array<{url: string; anchor: string; domain: string}>; internal: Array<{url: string; anchor: string; slug: string}> } {
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi
  const external: Array<{url: string; anchor: string; domain: string}> = []
  const internal: Array<{url: string; anchor: string; slug: string}> = []
  const baseDomain = new URL(baseUrl).hostname

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const anchor = match[2].replace(/<[^>]+>/g, '').trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) continue

    try {
      const url = new URL(href, baseUrl)
      const domain = url.hostname
      if (domain === baseDomain || domain.endsWith('.' + baseDomain)) {
        const slug = url.pathname.replace(/\/$/, '').split('/').pop() || ''
        if (slug && anchor) internal.push({ url: url.href, anchor, slug })
      } else if (anchor && url.protocol.startsWith('http')) {
        external.push({ url: url.href, anchor, domain })
      }
    } catch { /* invalid URL, skip */ }
  }

  return { external, internal }
}

/**
 * Validate a URL for safety before fetching.
 *
 * Guards against SSRF by rejecting private/internal IP ranges (RFC 1918),
 * localhost, link-local, and cloud metadata endpoints. Only `http:` and
 * `https:` schemes are permitted.
 *
 * @param url - The raw URL string to validate.
 * @throws {Error} If the URL is malformed, non-HTTP(S), or targets a private address.
 */
function validateUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed')
  }
  const hostname = parsed.hostname.toLowerCase()
  // Block private/internal IPs and localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Internal/private URLs are not allowed')
  }
}

/**
 * Fetch a URL, extract its text content, metadata, and links.
 *
 * Validates the URL via {@link validateUrl} first (SSRF protection), then
 * fetches with a 15-second timeout. The raw HTML is processed to extract:
 *   - Full plain text (HTML stripped, nav/footer removed)
 *   - OpenGraph / meta-tag metadata (title, description, image)
 *   - Internal and external hyperlinks
 *   - Download links (PDFs, docs, spreadsheets, etc.)
 *
 * @param url - A public HTTP(S) URL to scrape.
 * @returns Scraped content including full text, metadata, and categorized links.
 * @throws {Error} On fetch failure, timeout, or SSRF-blocked URL.
 */
async function scrapeUrl(url: string): Promise<{
  fullText: string
  meta: { title: string; description: string; image: string; domain: string }
  externalLinks: Array<{url: string; anchor: string; domain: string}>
  internalLinks: Array<{url: string; anchor: string; slug: string}>
  downloadLinks: Array<{url: string; anchor: string}>
}> {
  validateUrl(url)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChangeEngine/1.0 (+https://changeengine.us)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const html = await res.text()
  const meta = extractMeta(html)
  meta.domain = new URL(url).hostname

  const fullText = stripHtml(html)
  const { external, internal } = extractLinks(html, url)

  // Find download links (PDFs, docs, etc.)
  const downloadLinks = external
    .filter(l => /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|zip)$/i.test(l.url))
    .map(l => ({ url: l.url, anchor: l.anchor }))

  return { fullText, meta, externalLinks: external, internalLinks: internal, downloadLinks }
}

// ── Taxonomy ──────────────────────────────────────────────────────────

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

// ── Claude helpers ────────────────────────────────────────────────────

function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return JSON.parse(text.substring(start, end + 1))
}

async function callClaude(system: string, user: string, maxTokens = 3000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
      const data = await res.json()
      if (data.error) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(data.error.message || 'Claude API error')
      }
      return data.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries exceeded')
}

// ── Translation helper ────────────────────────────────────────────────

const TRANSLATE_SYSTEM = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.
Translate civic content simplified to a 5th/6th-grade reading level.
CRITICAL: Maintain reading level, keep proper nouns in original form, use Southern Vietnamese dialect for Vietnamese.
Respond with JSON only. No markdown, no backticks.`

async function translateItem(
  title: string,
  summary: string,
  langCode: string,
  langName: string,
): Promise<{ title: string; summary: string }> {
  const raw = await callClaude(
    TRANSLATE_SYSTEM,
    `Translate to ${langName}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
    2000,
  )
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

// ── Main ingest pipeline ──────────────────────────────────────────────

async function ingestUrl(
  url: string,
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
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

  // Step 4: Classify + enrich with full text (single Claude call)
  const systemPrompt = `You are the Change Engine v2 knowledge graph enricher for Houston, Texas civic content.
You have the FULL article text. Your job is to:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
3. Classify against the EXACT taxonomy below using valid IDs only
4. Extract ALL organizations mentioned with their URLs
5. Identify action items (donate, volunteer, sign up, etc.)
6. Extract keywords

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
  "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},
  "organizations": [{"name":"...","url":"https://...","description":"..."}],
  "keywords": ["keyword1","keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  let classification: any
  try {
    const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)
    classification = parseClaudeJson(rawResponse)
  } catch (e) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'flagged' })
    return { success: false, stage: 'classify', error: `Classification failed: ${(e as Error).message}`, inbox_id: inboxId }
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
  const actions = classification.action_items || {}
  const confidence = classification.confidence ?? 0.85

  const status = confidence >= 0.8 ? 'classified' : confidence >= 0.5 ? 'needs_review' : 'flagged'

  // Step 6: Update inbox + create review queue entry
  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status })

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
    review_status: 'pending',
  })

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
          field_name: 'title',
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
            field_name: 'summary',
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
  for (const org of (classification.organizations || [])) {
    if (!org.name) continue
    const orgUrl = org.url || ''
    const domain = orgUrl.match(/https?:\/\/([^/]+)/)?.[1] || ''
    if (!domain) continue

    const domainCheck = await supaRest('GET', `org_domains?domain=eq.${domain}&select=org_id`).catch(() => [])
    if (domainCheck && domainCheck.length > 0) {
      orgsCreated.push(`${org.name} (exists)`)
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
      orgsCreated.push(`${org.name} (NEW: ${orgId})`)
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.includes('duplicate') || msg.includes('23505')) {
        orgsCreated.push(`${org.name} (exists)`)
      }
    }
  }

  // Step 10: Log
  await supaRest('POST', 'ingestion_log', {
    event_type: 'unified_ingest',
    source: meta.domain,
    source_url: url,
    status: 'success',
    message: `Full pipeline: ${validFocusAreaIds.length}FA ${allSdgIds.length}SDG | conf:${confidence} | ${Object.keys(translations).length} translations | ${orgsCreated.length} orgs`,
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

// ── Route handler ────────────────────────────────────────────────────

// ── Pre-scraped ingest (skip fetch, go straight to classify) ─────────

async function ingestPreScraped(
  item: { url: string; title: string; description: string; image_url: string; full_text: string; source: string; domain: string },
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
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
  const systemPrompt = `You are the Change Engine v2 knowledge graph enricher for Houston, Texas civic content.
You have the FULL article text. Your job is to:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words) capturing ALL key information
3. Classify against the EXACT taxonomy below using valid IDs only
4. Extract ALL organizations mentioned with their URLs
5. Identify action items (donate, volunteer, sign up, etc.)
6. Extract keywords

The summary should be detailed enough that if the original source disappears, a reader would still understand everything.

${taxonomyPrompt}`

  const userPrompt = `Title: ${item.title}
URL: ${item.url}
Source: ${item.source}

FULL TEXT (${item.full_text.length} chars):
${item.full_text.substring(0, 6000)}

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
  "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},
  "organizations": [{"name":"...","url":"https://...","description":"..."}],
  "keywords": ["keyword1","keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  let classification: any
  try {
    const rawResponse = await callClaude(systemPrompt, userPrompt, 3000)
    classification = parseClaudeJson(rawResponse)
  } catch (e) {
    await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status: 'flagged' })
    return { success: false, stage: 'classify', error: `Classification failed: ${(e as Error).message}`, inbox_id: inboxId }
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
  const actions = classification.action_items || {}
  const confidence = classification.confidence ?? 0.85
  const status = confidence >= 0.8 ? 'classified' : confidence >= 0.5 ? 'needs_review' : 'flagged'

  await supaRest('PATCH', `content_inbox?id=eq.${inboxId}`, { status })

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
    review_status: 'pending',
  })

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
          field_name: 'title',
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
            field_name: 'summary',
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
    stage: status,
    title: classification.title_6th_grade,
    confidence,
    focus_areas: validFocusAreaIds,
    translations: Object.keys(translations).length,
  }
}

// ── Route handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const autoPublish = body.auto_publish !== false // default true

  // Pre-scraped batch mode: { items: [{ url, title, description, image_url, full_text, source, domain }], auto_publish }
  if (body.items && Array.isArray(body.items)) {
    if (body.items.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 pre-scraped items per request' }, { status: 400 })
    }

    const taxonomy = await fetchTaxonomy()
    const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

    const results: any[] = []
    let succeeded = 0
    let failed = 0

    for (const item of body.items) {
      try {
        const result = await ingestPreScraped(item, taxonomy, taxonomyPrompt)
        results.push({ url: item.url, ...result })
        if (result.success) succeeded++
        else failed++
      } catch (err) {
        results.push({ url: item.url, success: false, error: (err as Error).message })
        failed++
      }
      if (results.length < body.items.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    return NextResponse.json({ processed: body.items.length, succeeded, failed, auto_publish: autoPublish, results })
  }

  // Standard URL mode
  const urls: string[] = body.urls || (body.url ? [body.url] : [])

  if (urls.length === 0) {
    return NextResponse.json({ error: 'Provide "url", "urls", or "items" in request body' }, { status: 400 })
  }

  if (urls.length > 25) {
    return NextResponse.json({ error: 'Maximum 25 URLs per request' }, { status: 400 })
  }

  // Fetch taxonomy once for all URLs
  const taxonomy = await fetchTaxonomy()
  const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

  const results: any[] = []
  let succeeded = 0
  let failed = 0

  for (const url of urls) {
    try {
      const result = await ingestUrl(url, taxonomy, taxonomyPrompt)
      results.push({ url, ...result })
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ url, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit between URLs
    if (results.length < urls.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({
    processed: urls.length,
    succeeded,
    failed,
    auto_publish: autoPublish,
    results,
  })
}
