/**
 * Multi-item extraction from listing/directory pages.
 *
 * Detects pages that contain multiple distinct items (events, articles,
 * videos, resources, tools, courses, etc.) and creates separate inbox +
 * review queue entries for each.
 */

import { callClaude, parseClaudeJson } from './claude'
import { supaRest } from './supabase-helpers'
import type { Taxonomy } from './taxonomy'

export async function extractMultipleEvents(
  fullText: string,
  meta: { title: string; description: string; image: string; domain: string },
  sourceUrl: string,
  taxonomy: Taxonomy,
  taxonomyPrompt: string,
  parentInboxId: string,
  validFocusIds: Set<any>,
  orgId?: string | null,
): Promise<Array<{ inbox_id: string; title: string }> | null> {
  const extractPrompt = `You are analyzing a web page that may contain MULTIPLE distinct events (like a calendar, event listing, or events page).

Look at the text and determine:
1. Does this page list MULTIPLE separate events with their own names/dates/details?
2. If yes, extract EACH individual event.

If this page describes only ONE event, return: {"single_event": true}

If this page lists MULTIPLE events, return:
{
  "single_event": false,
  "events": [
    {
      "title_6th_grade": "Clear, simple event title (max 80 chars)",
      "summary_6th_grade": "What this event is about in 2-3 sentences at 6th grade level",
      "event_start_date": "ISO 8601 datetime or null",
      "event_end_date": "ISO 8601 datetime or null",
      "location": "Event location or null",
      "registration_url": "Registration/RSVP URL or null",
      "is_virtual": false
    }
  ]
}

Extract up to 20 events. Return JSON only.`

  const userMsg = `Page title: ${meta.title}
URL: ${sourceUrl}
Source: ${meta.domain}

PAGE TEXT:
${fullText.substring(0, 8000)}`

  const rawResponse = await callClaude(extractPrompt, userMsg, 4000)
  const parsed = parseClaudeJson(rawResponse)

  if (parsed.single_event || !parsed.events || !Array.isArray(parsed.events) || parsed.events.length < 2) {
    return null
  }

  const results: Array<{ inbox_id: string; title: string }> = []

  for (const event of parsed.events) {
    const eventInboxId = crypto.randomUUID()
    const eventTitle = event.title_6th_grade || 'Untitled Event'
    const eventSummary = event.summary_6th_grade || ''

    await supaRest('POST', 'content_inbox', {
      id: eventInboxId,
      source_url: sourceUrl,
      source_domain: meta.domain,
      title: eventTitle,
      description: eventSummary,
      image_url: meta.image || null,
      extracted_text: JSON.stringify({
        full_text: `${eventTitle}\n\n${eventSummary}\n\nLocation: ${event.location || 'TBD'}\nDate: ${event.event_start_date || 'TBD'}`,
        tags: [],
        external_links: [],
        internal_links: [],
        download_links: [],
      }),
      parent_inbox_id: parentInboxId,
      status: 'needs_review',
      content_type: 'event',
      ...(orgId ? { org_id: orgId } : {}),
    })

    const eventClassification: any = {
      title_6th_grade: eventTitle,
      summary_6th_grade: eventSummary,
      content_type: 'event',
      event_start_date: event.event_start_date || null,
      event_end_date: event.event_end_date || null,
      action_items: {
        attend_url: event.registration_url || null,
        register_url: event.registration_url || null,
      },
      geographic_scope: 'Houston',
      confidence: 0.75,
      reasoning: `Extracted from multi-event page: ${meta.title}`,
      _version: 'v3-multi-event',
    }

    await supaRest('POST', 'content_review_queue', {
      inbox_id: eventInboxId,
      ai_classification: eventClassification,
      confidence: 0.75,
      review_status: 'pending',
      ...(orgId ? { org_id: orgId } : {}),
    })

    results.push({ inbox_id: eventInboxId, title: eventTitle })

    if (results.length < parsed.events.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  await supaRest('POST', 'ingestion_log', {
    event_type: 'multi_event_extract',
    source: meta.domain,
    source_url: sourceUrl,
    status: 'success',
    message: `Extracted ${results.length} events from listing page: ${meta.title}`,
    item_count: results.length,
  })

  return results
}

export async function extractMultipleArticles(
  fullText: string,
  meta: { title: string; description: string; image: string; domain: string },
  sourceUrl: string,
  taxonomy: Taxonomy,
  taxonomyPrompt: string,
  parentInboxId: string,
  validFocusIds: Set<any>,
  orgId?: string | null,
): Promise<Array<{ inbox_id: string; title: string }> | null> {
  const extractPrompt = `You are analyzing a web page that may contain MULTIPLE distinct news articles or stories (like a news feed, blog listing, roundup, or newsletter).

Look at the text and determine:
1. Does this page list MULTIPLE separate news articles/stories with their own headlines and content?
2. If yes, extract EACH individual article.

If this page describes only ONE article or story, return: {"single_article": true}

If this page lists MULTIPLE articles/stories, return:
{
  "single_article": false,
  "articles": [
    {
      "title_6th_grade": "Clear, simple headline (max 80 chars, 6th grade reading level)",
      "summary_6th_grade": "Summary of this article in 2-4 sentences at 6th grade level, capturing all key information",
      "source_url": "Direct URL to the individual article if available, null otherwise",
      "image_url": "Image URL if mentioned, null otherwise",
      "published_date": "ISO 8601 date if mentioned, null otherwise"
    }
  ]
}

Extract up to 25 articles. Return JSON only.`

  const userMsg = `Page title: ${meta.title}
URL: ${sourceUrl}
Source: ${meta.domain}

PAGE TEXT:
${fullText.substring(0, 8000)}`

  const rawResponse = await callClaude(extractPrompt, userMsg, 4000)
  const parsed = parseClaudeJson(rawResponse)

  if (parsed.single_article || !parsed.articles || !Array.isArray(parsed.articles) || parsed.articles.length < 2) {
    return null
  }

  const results: Array<{ inbox_id: string; title: string }> = []

  for (const article of parsed.articles) {
    const articleInboxId = crypto.randomUUID()
    const articleTitle = article.title_6th_grade || 'Untitled Article'
    const articleSummary = article.summary_6th_grade || ''

    await supaRest('POST', 'content_inbox', {
      id: articleInboxId,
      source_url: article.source_url || sourceUrl,
      source_domain: meta.domain,
      title: articleTitle,
      description: articleSummary,
      image_url: article.image_url || meta.image || null,
      extracted_text: JSON.stringify({
        full_text: `${articleTitle}\n\n${articleSummary}`,
        tags: [],
        external_links: [],
        internal_links: [],
        download_links: [],
      }),
      parent_inbox_id: parentInboxId,
      status: 'needs_review',
      content_type: 'article',
      ...(orgId ? { org_id: orgId } : {}),
    })

    const articleClassification: any = {
      title_6th_grade: articleTitle,
      summary_6th_grade: articleSummary,
      content_type: 'article',
      geographic_scope: 'Houston',
      confidence: 0.70,
      reasoning: `Extracted from multi-article page: ${meta.title}`,
      _version: 'v3-multi-article',
    }

    await supaRest('POST', 'content_review_queue', {
      inbox_id: articleInboxId,
      ai_classification: articleClassification,
      confidence: 0.70,
      review_status: 'pending',
      ...(orgId ? { org_id: orgId } : {}),
    })

    results.push({ inbox_id: articleInboxId, title: articleTitle })

    if (results.length < parsed.articles.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  await supaRest('POST', 'ingestion_log', {
    event_type: 'multi_article_extract',
    source: meta.domain,
    source_url: sourceUrl,
    status: 'success',
    message: `Extracted ${results.length} articles from listing page: ${meta.title}`,
    item_count: results.length,
  })

  return results
}

/**
 * Generalized listing/directory page extraction.
 *
 * Handles ANY content type (videos, resources, tools, courses, guides, etc.)
 * by asking Claude to detect whether the page is a directory and extract
 * each child item with its URL, title, and description.
 */
export async function extractMultipleResources(
  fullText: string,
  meta: { title: string; description: string; image: string; domain: string },
  sourceUrl: string,
  internalLinks: Array<{ url: string; anchor: string; slug: string }>,
  contentType: string,
  parentInboxId: string,
  orgId?: string | null,
): Promise<Array<{ inbox_id: string; title: string; source_url?: string }> | null> {
  const extractPrompt = `You are analyzing a web page to determine if it is a LISTING or DIRECTORY page — a page whose primary purpose is to link to multiple child resources.

Examples of listing pages:
- A video library page listing 20+ individual videos
- A resource hub linking to tools, guides, or downloads
- A course catalog with individual course pages
- An organization directory with links to each org
- A publications page listing reports or briefs

Examples that are NOT listing pages:
- A single article, even if long
- A page with a sidebar of related links
- A homepage with featured content

Analyze the page text and internal links provided. Determine:
1. Is this page primarily a LISTING/DIRECTORY of multiple distinct resources?
2. If yes, extract EACH child item.

If this is NOT a listing page, return: {"is_listing": false}

If this IS a listing page, return:
{
  "is_listing": true,
  "listing_type": "video|resource|tool|course|guide|report|organization|mixed",
  "items": [
    {
      "title_6th_grade": "Clear, simple title (max 80 chars, 6th-grade level)",
      "summary_6th_grade": "What this item is about in 1-3 sentences at 6th-grade level",
      "source_url": "Direct URL to the individual item page (from internal links), or null",
      "image_url": "Thumbnail URL if visible, or null",
      "content_type": "video|report|guide|tool|course|article"
    }
  ]
}

RULES:
- Extract up to 30 items.
- Match items to their URLs from the INTERNAL LINKS list when possible.
- Write summaries in asset-based language (strengths, opportunities, what's available).
- If you can't determine a meaningful title/summary for an item, skip it.
- Return JSON only.`

  const userMsg = `Page title: ${meta.title}
URL: ${sourceUrl}
Source: ${meta.domain}
Claude classified this page as content_type: "${contentType}"

PAGE TEXT (${fullText.length} chars):
${fullText.substring(0, 8000)}

INTERNAL LINKS (${internalLinks.length} links to same domain):
${internalLinks.slice(0, 50).map(l => `[${l.anchor}] → ${l.url}`).join('\n')}`

  const rawResponse = await callClaude(extractPrompt, userMsg, 4000)
  const parsed = parseClaudeJson(rawResponse)

  if (!parsed.is_listing || !parsed.items || !Array.isArray(parsed.items) || parsed.items.length < 2) {
    return null
  }

  const results: Array<{ inbox_id: string; title: string; source_url?: string }> = []
  const listingType = parsed.listing_type || 'resource'

  for (const item of parsed.items) {
    const itemInboxId = crypto.randomUUID()
    const itemTitle = item.title_6th_grade || 'Untitled'
    const itemSummary = item.summary_6th_grade || ''
    const itemUrl = item.source_url || sourceUrl
    const itemType = item.content_type || contentType || 'resource'

    await supaRest('POST', 'content_inbox', {
      id: itemInboxId,
      source_url: itemUrl,
      source_domain: meta.domain,
      title: itemTitle,
      description: itemSummary,
      image_url: item.image_url || meta.image || null,
      extracted_text: JSON.stringify({
        full_text: `${itemTitle}\n\n${itemSummary}`,
        tags: [],
        external_links: [],
        internal_links: [],
        download_links: [],
      }),
      parent_inbox_id: parentInboxId,
      status: 'needs_review',
      content_type: itemType,
      ...(orgId ? { org_id: orgId } : {}),
    })

    const itemClassification: any = {
      title_6th_grade: itemTitle,
      summary_6th_grade: itemSummary,
      content_type: itemType,
      geographic_scope: 'National',
      confidence: 0.70,
      reasoning: `Extracted from ${listingType} listing page: ${meta.title}`,
      _version: 'v3-multi-resource',
    }

    await supaRest('POST', 'content_review_queue', {
      inbox_id: itemInboxId,
      ai_classification: itemClassification,
      confidence: 0.70,
      review_status: 'pending',
      ...(orgId ? { org_id: orgId } : {}),
    })

    results.push({ inbox_id: itemInboxId, title: itemTitle, source_url: itemUrl })

    if (results.length < parsed.items.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  await supaRest('POST', 'ingestion_log', {
    event_type: 'multi_resource_extract',
    source: meta.domain,
    source_url: sourceUrl,
    status: 'success',
    message: `Extracted ${results.length} ${listingType} items from listing page: ${meta.title}`,
    item_count: results.length,
  })

  return results
}

/**
 * Heuristic: should we try listing page extraction?
 * Returns true if the page looks like a directory based on
 * internal link count and text length.
 */
export function looksLikeListingPage(
  fullText: string,
  internalLinks: Array<{ url: string; anchor: string; slug: string }>,
  contentType: string,
): boolean {
  // Already handled by event/article extractors
  if (contentType === 'event' || contentType === 'article') return false
  // Pages with many internal links and substantial text
  if (internalLinks.length >= 8 && fullText.length > 2000) return true
  // Long pages that Claude classified as video/course/tool/guide/resource
  if (fullText.length > 3000 && ['video', 'course', 'tool', 'guide', 'resource'].includes(contentType)) return true
  return false
}
