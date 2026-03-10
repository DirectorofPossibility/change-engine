/**
 * @fileoverview POST /api/ingest-org — Deep-crawl an organization's website.
 *
 * Given an org URL, this route:
 *   1. Creates/updates the organization entity
 *   2. Discovers internal pages (programs, services, events, volunteer, etc.)
 *   3. Scrapes each page and asks Claude to classify it as entity type
 *   4. Routes each page to the correct table (services_211, events, opportunities, etc.)
 *   5. Links every child entity back to the parent org via org_id
 *   6. Runs full taxonomy classification on each child
 *   7. Populates junction tables so children travel the knowledge mesh
 *
 * The org is the "scrapbook" — children are individual pages that scatter
 * across the mesh by focus area, pathway, audience, etc.
 *
 * Auth: API key or CRON_SECRET bearer token.
 *
 * Request: { url: "https://feedingamerica.org", org_name?: "Feeding America" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase helpers ─────────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
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

async function supaJunctionInsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    })
  } catch (e) {
    console.error(`Junction insert ${table}:`, (e as Error).message)
  }
}

// ── Claude helpers ───────────────────────────────────────────────────

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
        signal: AbortSignal.timeout(30000),
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

// ── Scraping helpers ─────────────────────────────────────────────────

function stripHtml(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote|section|article)[^>]*>/gi, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  return text.trim()
}

function extractMeta(html: string): { title: string; description: string; image: string } {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)?.[1]
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1]
  const image = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i)?.[1]
    || ''
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]

  return {
    title: ogTitle || titleTag || '',
    description: ogDesc || '',
    image,
  }
}

async function fetchPage(url: string): Promise<{ html: string; text: string; meta: ReturnType<typeof extractMeta> } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChangeEngine/1.0; +https://changeengine.us)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return { html, text: stripHtml(html), meta: extractMeta(html) }
  } catch {
    return null
  }
}

// ── Page discovery ───────────────────────────────────────────────────

// Keywords that indicate a page has org resources worth extracting
const USEFUL_KEYWORDS = [
  'program', 'service', 'volunteer', 'donate', 'help', 'find',
  'ways-to', 'event', 'resource', 'sign-up', 'apply', 'enroll',
  'clinic', 'food', 'shelter', 'housing', 'counsel', 'class',
  'workshop', 'training', 'support', 'assist', 'benefit', 'grant',
  'partner', 'campaign', 'initiative', 'project', 'location',
  'get-involved', 'take-action', 'how-to', 'eligib', 'referral',
  'pantry', 'meal', 'legal', 'financial', 'health', 'mental',
  'child', 'youth', 'senior', 'veteran', 'immigrant', 'education',
]

const JUNK_PATTERNS = [
  '/wp-', '/feed', '.js', '.css', '.xml', '.json', '.pdf',
  '/cart', '/checkout', '/login', '/admin', '/search',
  '/tag/', '/category/', '/author/', '/page/', '/attachment/',
  'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
  'mailto:', 'tel:', 'javascript:', '#',
]

function discoverPages(html: string, baseUrl: string): string[] {
  const parsed = new URL(baseUrl)
  const baseDomain = parsed.hostname
  const linkRegex = /href=["'](https?:\/\/[^"']*?|\/?[^"'#?]*?)["']/gi
  const seen = new Set<string>()
  const pages: string[] = []

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1]
    if (href.startsWith('/')) href = `${parsed.protocol}//${baseDomain}${href}`
    if (!href.startsWith('http')) continue

    try {
      const hrefParsed = new URL(href)
      if (hrefParsed.hostname !== baseDomain) continue
      const clean = `${hrefParsed.protocol}//${hrefParsed.hostname}${hrefParsed.pathname}`.replace(/\/$/, '')
      if (seen.has(clean) || clean === baseUrl.replace(/\/$/, '')) continue
      seen.add(clean)

      const path = hrefParsed.pathname.toLowerCase()
      if (JUNK_PATTERNS.some(p => path.includes(p) || href.includes(p))) continue

      const isUseful = USEFUL_KEYWORDS.some(kw => path.includes(kw))
      // Also include top-level pages (1-2 segments) as they often describe programs
      const segments = path.split('/').filter(Boolean)
      const isTopLevel = segments.length <= 2 && segments.length >= 1

      if (isUseful || isTopLevel) {
        pages.push(clean)
      }
    } catch { /* invalid URL */ }
  }

  return pages
}

// ── Entity type classification ───────────────────────────────────────

type EntityType = 'service' | 'event' | 'opportunity' | 'campaign' | 'benefit' | 'content' | 'skip'

const CLASSIFY_PAGE_SYSTEM = `You are classifying pages from a nonprofit/community organization's website for The Change Engine, a Houston civic platform.

For each page, determine what type of ENTITY it represents:

- "service" — A specific service the org provides (food pantry, legal aid, counseling, classes, shelter, etc.)
- "event" — A specific upcoming event (workshop, fundraiser, meeting, class session, etc.)
- "opportunity" — A volunteer opportunity, internship, or way to get involved
- "campaign" — An advocacy campaign, petition, fundraiser, or community initiative
- "benefit" — A benefit program people can apply for (grants, assistance programs, scholarships)
- "content" — A news article, blog post, report, or educational resource
- "skip" — Navigation page, contact page, about page, privacy policy, or not a distinct resource

CRITICAL RULES:
1. Each entity should represent ONE specific offering that someone could USE, ATTEND, or APPLY FOR
2. Generic "our programs" overview pages are "skip" — we want the individual program pages
3. "About us" and "our mission" pages are "skip"
4. If a page describes multiple distinct services, mark it as "service" and list them in children[]
5. Write all descriptions at 6th-grade reading level
6. Extract EVERY concrete detail: addresses, phone numbers, hours, eligibility, costs

Return JSON only.`

interface PageClassification {
  entity_type: EntityType
  name: string
  description_5th_grade: string
  focus_area_keywords: string[]
  audience_keywords: string[]
  // Service-specific
  eligibility?: string
  fees?: string
  hours?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  website?: string
  service_category?: string
  // Event-specific
  start_datetime?: string
  end_datetime?: string
  is_virtual?: boolean
  registration_url?: string
  is_free?: boolean
  // Opportunity-specific
  time_commitment?: string
  skills_needed?: string[]
  spots_available?: number
  // Campaign-specific
  goal?: string
  campaign_type?: string
  // Benefit-specific
  benefit_type?: string
  application_url?: string
  eligibility_summary?: string
  // Multi-resource pages
  children?: Array<{
    name: string
    description_5th_grade: string
    entity_type: EntityType
  }>
  confidence: number
}

async function classifyPage(
  text: string,
  meta: { title: string; description: string },
  url: string,
  orgName: string,
): Promise<PageClassification> {
  const userPrompt = `Organization: ${orgName}
Page URL: ${url}
Page Title: ${meta.title}
Meta Description: ${meta.description}

PAGE TEXT (${text.length} chars):
${text.substring(0, 5000)}

Classify this page. Return JSON:
{
  "entity_type": "service|event|opportunity|campaign|benefit|content|skip",
  "name": "Clear name for this resource (6th grade, max 60 chars)",
  "description_5th_grade": "What this resource offers, who it helps, and how to access it (100-200 words, 6th grade)",
  "focus_area_keywords": ["food", "housing", "health", ...],
  "audience_keywords": ["families", "seniors", "veterans", ...],
  "eligibility": "Who can use this (if applicable)",
  "fees": "Cost or 'Free' (if applicable)",
  "hours": "Operating hours (if mentioned)",
  "phone": "Phone number (if mentioned)",
  "address": "Street address (if mentioned)",
  "city": "City (if mentioned)",
  "state": "State (if mentioned)",
  "zip_code": "ZIP (if mentioned)",
  "website": "${url}",
  "service_category": "Category like 'Food Assistance', 'Legal Aid', 'Mental Health' (if service)",
  "start_datetime": "ISO 8601 (if event)",
  "end_datetime": "ISO 8601 (if event)",
  "is_virtual": false,
  "registration_url": "URL (if event/opportunity)",
  "is_free": true,
  "time_commitment": "e.g. '2 hours/week' (if opportunity)",
  "skills_needed": [],
  "goal": "Campaign goal (if campaign)",
  "campaign_type": "advocacy|fundraiser|petition|awareness (if campaign)",
  "benefit_type": "grant|assistance|scholarship (if benefit)",
  "application_url": "URL (if benefit)",
  "eligibility_summary": "Who qualifies (if benefit)",
  "children": [],
  "confidence": 0.0
}`

  const raw = await callClaude(CLASSIFY_PAGE_SYSTEM, userPrompt, 2000)
  return parseClaudeJson(raw)
}

// ── Entity insertion ─────────────────────────────────────────────────

/**
 * Generate a deterministic entity ID from the source URL.
 * Same URL always produces the same ID, so re-crawling an org
 * upserts instead of duplicating.
 */
function makeEntityId(prefix: string, sourceUrl: string): string {
  // Simple hash: take URL path, strip special chars, truncate
  const path = sourceUrl.replace(/https?:\/\/[^/]+/, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40).toUpperCase()
  return `${prefix}_${path || 'ROOT'}`.replace(/_+/g, '_').replace(/_$/, '')
}

async function insertService(
  c: PageClassification, orgId: string, entityId: string, sourceUrl: string, domain: string,
) {
  await supaRest('POST', `services_211?on_conflict=service_id`, {
    service_id: entityId,
    service_name: c.name,
    description_5th_grade: c.description_5th_grade,
    org_id: orgId,
    service_cat_id: null,
    eligibility: c.eligibility || null,
    fees: c.fees || null,
    hours: c.hours || null,
    phone: c.phone || null,
    address: c.address || null,
    city: c.city || 'Houston',
    state: c.state || 'TX',
    zip_code: c.zip_code || null,
    website: sourceUrl,
    is_active: 'Yes',
    data_source: domain,
    last_updated: new Date().toISOString(),
    engagement_level: 'Resource',
  })
  return entityId
}

async function insertEvent(
  c: PageClassification, orgId: string, entityId: string, sourceUrl: string, domain: string,
) {
  await supaRest('POST', `events?on_conflict=event_id`, {
    event_id: entityId,
    event_name: c.name,
    description_5th_grade: c.description_5th_grade,
    org_id: orgId,
    event_type: 'community',
    address: c.address || null,
    city: c.city || 'Houston',
    state: c.state || 'TX',
    zip_code: c.zip_code || null,
    is_virtual: c.is_virtual ? 'Yes' : 'No',
    start_datetime: c.start_datetime || null,
    end_datetime: c.end_datetime || null,
    registration_url: c.registration_url || sourceUrl,
    is_free: c.is_free !== false ? 'Yes' : 'No',
    is_active: 'Yes',
    data_source: domain,
    last_updated: new Date().toISOString(),
    engagement_level: 'Action',
  })
  return entityId
}

async function insertOpportunity(
  c: PageClassification, orgId: string, entityId: string, sourceUrl: string, domain: string,
) {
  await supaRest('POST', `opportunities?on_conflict=opportunity_id`, {
    opportunity_id: entityId,
    opportunity_name: c.name,
    description_5th_grade: c.description_5th_grade,
    org_id: orgId,
    address: c.address || null,
    city: c.city || 'Houston',
    state: c.state || 'TX',
    zip_code: c.zip_code || null,
    is_virtual: c.is_virtual ? 'Yes' : 'No',
    registration_url: c.registration_url || sourceUrl,
    is_active: 'Yes',
    data_source: domain,
    last_updated: new Date().toISOString(),
    engagement_level: 'Action',
  })
  return entityId
}

async function insertCampaign(
  c: PageClassification, orgId: string, entityId: string, domain: string,
) {
  await supaRest('POST', `campaigns?on_conflict=campaign_id`, {
    campaign_id: entityId,
    campaign_name: c.name,
    description_5th_grade: c.description_5th_grade,
    campaign_type: c.campaign_type || 'awareness',
    org_id: orgId,
    goal_description: c.goal || null,
    status: 'Active',
    data_source: domain,
    last_updated: new Date().toISOString(),
    engagement_level: 'Action',
  })
  return entityId
}

async function insertBenefit(
  c: PageClassification, entityId: string, domain: string,
) {
  await supaRest('POST', `benefit_programs?on_conflict=benefit_id`, {
    benefit_id: entityId,
    benefit_name: c.name,
    description_5th_grade: c.description_5th_grade,
    benefit_type: c.benefit_type || 'assistance',
    eligibility_summary: c.eligibility_summary || c.eligibility || null,
    application_url: c.application_url || null,
    application_method: c.application_url ? 'Online' : null,
    is_active: 'Yes',
    data_source: domain,
    last_updated: new Date().toISOString(),
    engagement_level: 'Resource',
  })
  return entityId
}

// ── Junction table population for entities ───────────────────────────

const ENTITY_JUNCTION_MAP: Record<string, { table: string; idCol: string; junctionTable: string }> = {
  service: { table: 'services_211', idCol: 'service_id', junctionTable: 'service_focus_areas' },
  event: { table: 'events', idCol: 'event_id', junctionTable: 'event_focus_areas' },
  opportunity: { table: 'opportunities', idCol: 'opportunity_id', junctionTable: 'opportunity_focus_areas' },
  campaign: { table: 'campaigns', idCol: 'campaign_id', junctionTable: 'campaign_focus_areas' },
}

// ── Main route ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const orgUrl: string = body.url || ''
  const orgNameHint: string = body.org_name || ''
  const maxPages: number = Math.min(body.max_pages || 30, 50)

  if (!orgUrl) {
    return NextResponse.json({ error: 'Provide "url" for the organization website' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(orgUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const domain = parsed.hostname

  // Step 1: Fetch and scrape the homepage
  const homepage = await fetchPage(orgUrl)
  if (!homepage) {
    return NextResponse.json({ error: `Could not fetch ${orgUrl}` }, { status: 502 })
  }

  // Step 2: Create or resolve the organization
  const orgId = 'ORG_' + domain.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30).toUpperCase()
  const orgName = orgNameHint || homepage.meta.title.split('|')[0].split('-')[0].trim() || domain

  await supaRest('POST', `organizations?on_conflict=org_id`, {
    org_id: orgId,
    org_name: orgName,
    website: orgUrl,
    description_5th_grade: homepage.meta.description || null,
    description_full: homepage.text.substring(0, 2000),
    hero_image_url: homepage.meta.image || null,
    data_source: 'org_crawl',
    last_updated: new Date().toISOString(),
    crawl_status: 'active',
  })

  // Ensure domain mapping exists
  await supaRest('POST', `org_domains?on_conflict=domain`, {
    org_id: orgId,
    domain,
  }).catch(() => {})

  // Step 3: Discover internal pages
  const discoveredUrls = discoverPages(homepage.html, orgUrl)

  // Step 4: Dedup against already-ingested URLs across ALL entity tables
  const toProcess: string[] = []
  const skipped: string[] = []

  async function isDuplicate(url: string): Promise<boolean> {
    const encoded = encodeURIComponent(url)
    const checks = await Promise.all([
      supaRest('GET', `services_211?website=eq.${encoded}&select=service_id&limit=1`).catch(() => []),
      supaRest('GET', `events?registration_url=eq.${encoded}&select=event_id&limit=1`).catch(() => []),
      supaRest('GET', `opportunities?registration_url=eq.${encoded}&select=opportunity_id&limit=1`).catch(() => []),
      supaRest('GET', `content_inbox?source_url=eq.${encoded}&select=id&limit=1`).catch(() => []),
    ])
    return checks.some(r => r && r.length > 0)
  }

  for (const url of discoveredUrls.slice(0, maxPages)) {
    if (await isDuplicate(url)) {
      skipped.push(url)
    } else {
      toProcess.push(url)
    }
  }

  // Step 5: Process each page
  const results: Array<{
    url: string
    entity_type: string
    entity_id?: string
    name?: string
    status: string
    error?: string
    children?: number
  }> = []
  for (const pageUrl of toProcess) {
    try {
      const page = await fetchPage(pageUrl)
      if (!page || page.text.length < 80) {
        results.push({ url: pageUrl, entity_type: 'skip', status: 'insufficient_content' })
        continue
      }

      const classification = await classifyPage(page.text, page.meta, pageUrl, orgName)

      if (classification.entity_type === 'skip') {
        results.push({ url: pageUrl, entity_type: 'skip', name: classification.name, status: 'skipped' })
        continue
      }

      // Insert the main entity
      const entityId = makeEntityId(
        classification.entity_type === 'service' ? 'SVC' :
        classification.entity_type === 'event' ? 'EVT' :
        classification.entity_type === 'opportunity' ? 'OPP' :
        classification.entity_type === 'campaign' ? 'CMP' :
        classification.entity_type === 'benefit' ? 'BEN' : 'CTN',
        pageUrl,
      )

      let insertedId: string | null = null

      switch (classification.entity_type) {
        case 'service':
          insertedId = await insertService(classification, orgId, entityId, pageUrl, domain)
          break
        case 'event':
          insertedId = await insertEvent(classification, orgId, entityId, pageUrl, domain)
          break
        case 'opportunity':
          insertedId = await insertOpportunity(classification, orgId, entityId, pageUrl, domain)
          break
        case 'campaign':
          insertedId = await insertCampaign(classification, orgId, entityId, domain)
          break
        case 'benefit':
          insertedId = await insertBenefit(classification, entityId, domain)
          break
        case 'content':
          // Route to the standard content ingest pipeline
          try {
            const baseUrl = req.nextUrl.origin
            await fetch(`${baseUrl}/api/ingest`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': req.headers.get('x-api-key') || '',
                'Authorization': req.headers.get('authorization') || '',
              },
              body: JSON.stringify({ url: pageUrl }),
            })
          } catch { /* content pipeline handles its own errors */ }
          results.push({ url: pageUrl, entity_type: 'content', name: classification.name, status: 'routed_to_ingest' })
          continue
      }

      // Handle children (multi-resource pages)
      let childrenCreated = 0
      if (classification.children && classification.children.length > 0) {
        for (const child of classification.children) {
          if (child.entity_type === 'skip') continue
          const childIdx = classification.children!.indexOf(child)
          const childId = makeEntityId(
            child.entity_type === 'service' ? 'SVC' :
            child.entity_type === 'event' ? 'EVT' :
            child.entity_type === 'opportunity' ? 'OPP' : 'CTN',
            pageUrl + '/child_' + childIdx,
          )
          const childClassification = { ...classification, ...child, name: child.name, description_5th_grade: child.description_5th_grade }

          switch (child.entity_type) {
            case 'service':
              await insertService(childClassification, orgId, childId, pageUrl, domain)
              childrenCreated++
              break
            case 'event':
              await insertEvent(childClassification, orgId, childId, pageUrl, domain)
              childrenCreated++
              break
            case 'opportunity':
              await insertOpportunity(childClassification, orgId, childId, pageUrl, domain)
              childrenCreated++
              break
          }
        }
      }

      results.push({
        url: pageUrl,
        entity_type: classification.entity_type,
        entity_id: insertedId || entityId,
        name: classification.name,
        status: 'created',
        children: childrenCreated || undefined,
      })

      // Rate limit between pages
      await new Promise(r => setTimeout(r, 1500))

    } catch (e) {
      results.push({ url: pageUrl, entity_type: 'error', status: 'error', error: (e as Error).message })
    }
  }

  // Step 6: Trigger enrichment for all new entities (classification + junction tables)
  const entityCounts: Record<string, number> = {}
  for (const r of results) {
    if (r.status === 'created') {
      entityCounts[r.entity_type] = (entityCounts[r.entity_type] || 0) + 1
    }
  }

  // Enrich each entity type
  const enrichResults: Record<string, any> = {}
  for (const entityType of Object.keys(entityCounts)) {
    const tableMap: Record<string, string> = {
      service: 'services_211',
      event: 'events',
      opportunity: 'opportunities',
      campaign: 'campaigns',
      benefit: 'benefit_programs',
    }
    const table = tableMap[entityType]
    if (!table) continue

    try {
      const baseUrl = req.nextUrl.origin
      const enrichRes = await fetch(`${baseUrl}/api/enrich-entity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.headers.get('x-api-key') || '',
          'Authorization': req.headers.get('authorization') || '',
        },
        body: JSON.stringify({ table, limit: entityCounts[entityType] + 5, force: false }),
      })
      if (enrichRes.ok) {
        enrichResults[entityType] = await enrichRes.json()
      }
    } catch (e) {
      enrichResults[entityType] = { error: (e as Error).message }
    }
  }

  // Log
  const created = results.filter(r => r.status === 'created').length
  const skippedCount = results.filter(r => r.status === 'skipped').length
  const errors = results.filter(r => r.status === 'error').length

  // Update org crawl tracking
  await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(orgId)}`, {
    last_crawled_at: new Date().toISOString(),
    crawl_status: errors === 0 ? 'completed' : 'partial',
    pages_found: discoveredUrls.length,
    entities_found: created,
  }).catch(() => {})

  await supaRest('POST', 'ingestion_log', {
    event_type: 'org_deep_crawl',
    source: domain,
    source_url: orgUrl,
    status: errors === 0 ? 'success' : 'partial',
    message: `Org crawl: ${orgName} | ${discoveredUrls.length} pages found | ${created} entities created (${Object.entries(entityCounts).map(([k, v]) => `${v} ${k}s`).join(', ')}) | ${skippedCount} skipped | ${errors} errors`,
    item_count: created,
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    org_id: orgId,
    org_name: orgName,
    domain,
    pages_discovered: discoveredUrls.length,
    pages_processed: toProcess.length,
    entities_created: created,
    entity_counts: entityCounts,
    skipped_existing: skipped.length,
    errors,
    enrichment: enrichResults,
    results,
  })
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'Change Engine Org Deep-Crawl',
    version: '1.0',
    description: 'Ingest an organization and discover all their resources as separate entities across the knowledge mesh',
    usage: 'POST { "url": "https://example.org", "org_name": "Example Org", "max_pages": 30 }',
  })
}
