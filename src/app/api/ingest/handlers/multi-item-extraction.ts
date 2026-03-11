/**
 * Multi-event and multi-article extraction from listing pages.
 *
 * Detects pages that contain multiple distinct events or articles
 * and creates separate inbox + review queue entries for each.
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
        parent_inbox_id: parentInboxId,
      }),
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
        parent_inbox_id: parentInboxId,
      }),
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
