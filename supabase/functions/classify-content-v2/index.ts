import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCallerRole, requireRole } from '../_shared/auth.ts';
import { CORS } from '../_shared/cors.ts';
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  callClaude,
  parseClaudeJson,
  validateAndEnrich,
  populateAllJunctions,
} from '../_shared/classifier.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // Auth: require service_role or partner
  const caller = await getCallerRole(req);
  const denied = requireRole(caller, ['service_role', 'partner']);
  if (denied) return denied;

  try {
    const body = await req.json();
    const url = body.url || '';
    const inputTitle = body.title || '';
    const inputDesc = body.description || '';

    if (!url && !inputTitle) {
      return new Response(JSON.stringify({ error: 'Provide url or title+description' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Scrape URL if provided ──────────────────────────────────────
    let pageTitle = inputTitle;
    let pageText = inputDesc;
    let sourceDomain = '';
    let imageUrl = '';
    let extractedBody = '';

    if (url) {
      try {
        const parsed = new URL(url);
        sourceDomain = parsed.hostname;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TheChangeEngine/2.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const html = await res.text();

        if (!pageTitle) {
          const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (m) pageTitle = m[1].trim();
        }
        if (!pageText) {
          const og = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
            || html.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i);
          if (og) pageText = og[1].trim();
        }

        // Extract og:image or twitter:image
        const ogImage = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (ogImage) {
          imageUrl = ogImage[1].trim();
        } else {
          const twImage = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
          if (twImage) imageUrl = twImage[1].trim();
        }

        // Extract body text for rich classification
        const stripHtmlNoise = (rawHtml: string) =>
          rawHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
        const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const contentSource = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || '';
        if (contentSource) {
          extractedBody = stripHtmlNoise(contentSource).substring(0, 5000);
        }

        if (!pageText || pageText.length < 100) {
          if (extractedBody.length > (pageText?.length || 0)) pageText = extractedBody.substring(0, 2500);
        }
      } catch (fetchErr) {
        console.error('Scrape error:', (fetchErr as Error).message);
      }
    }

    if (!pageTitle && !pageText) {
      return new Response(JSON.stringify({ error: 'No content to classify' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Classify using shared module ────────────────────────────────
    const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY);
    const systemPrompt = buildPromptForEntity(taxonomy, 'content');

    const contentPrompt = `You are the Change Engine v4 classifier for Houston, Texas civic content.

${systemPrompt}

Also produce:
- "body_6th_grade": structured markdown (200-500 words, 6th-grade level, asset-based language) with sections: ## Overview, ## Why It Matters, ## How It Works. Omit sections that don't apply.
- "hero_quote": A short inspirational quote from the source. Null if none found.
- "programs": Array of {"name":"...","description":"..."} for key programs mentioned. Max 4. Empty array if none.
- "action_items": {"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null}

Return JSON only. No markdown fences.`;

    const userContent = `Title: ${pageTitle}\nURL: ${url || 'N/A'}\nSource: ${sourceDomain || 'manual'}\nContent: ${(pageText || '').substring(0, 2500)}${extractedBody ? `\n\nFull page text:\n${extractedBody.substring(0, 5000)}` : ''}\n\nReturn JSON with: theme_primary, theme_secondary, focus_area_ids, sdg_ids, sdoh_code, ntee_codes, airs_codes, center, resource_type_id, content_type, audience_segment_ids, life_situation_ids, service_cat_ids, skill_ids, time_commitment_id, action_type_ids, gov_level_id, title_6th_grade, summary_6th_grade, body_6th_grade, hero_quote, programs, action_items, geographic_scope, confidence, reasoning`;

    const rawText = await callClaude(contentPrompt, userContent, ANTHROPIC_KEY, 3000);

    if (!rawText || rawText.length < 10) {
      return new Response(JSON.stringify({ error: 'Empty Claude response', raw: rawText }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let classification;
    try {
      classification = parseClaudeJson(rawText);
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: 'JSON parse failed', detail: (parseErr as Error).message, raw: rawText.substring(0, 500) }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const enriched = validateAndEnrich(classification, taxonomy);

    // ── Write to pipeline ───────────────────────────────────────────
    const inboxRes = await fetch(`${SUPABASE_URL}/rest/v1/content_inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=representation' },
      body: JSON.stringify({
        source_url: url,
        source_domain: sourceDomain,
        title: pageTitle,
        description: (pageText || '').substring(0, 1000),
        image_url: imageUrl || null,
        extracted_text: extractedBody || null,
        scraped_at: new Date().toISOString(),
        status: 'needs_review',
        source_trust_level: 'unknown',
        content_type: enriched.content_type || null,
      }),
    });
    const inboxData = await inboxRes.json();
    const inboxId = Array.isArray(inboxData) ? inboxData[0]?.id : inboxData?.id;

    if (inboxId) {
      // Write review queue entry
      await fetch(`${SUPABASE_URL}/rest/v1/content_review_queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ inbox_id: inboxId, ai_classification: enriched, confidence: enriched.confidence || 0, review_status: 'pending' }),
      });

      // Populate junction tables for the inbox content
      await populateAllJunctions('content', inboxId, enriched, SUPABASE_URL, SUPABASE_KEY);
    }

    // Log
    const faCount = (enriched.focus_area_ids || []).length;
    const sdgCount = (enriched.sdg_ids || []).length;
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({
        event_type: 'classify_v4',
        source: sourceDomain || 'manual',
        source_url: url,
        status: 'success',
        message: `v4-unified: ${faCount}FA ${sdgCount}SDG | conf:${enriched.confidence || 0}`,
        item_count: 1,
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      version: 'v4-unified',
      inbox_id: inboxId,
      classification: enriched,
      extracted: { title: pageTitle, domain: sourceDomain, image_url: imageUrl || null },
      taxonomy_count: { focus_areas: taxonomy.focusAreas.length, themes: taxonomy.themes.length },
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, stack: (err as Error).stack }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
