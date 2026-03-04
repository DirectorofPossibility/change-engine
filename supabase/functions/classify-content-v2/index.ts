import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCallerRole, requireRole } from '../_shared/auth.ts';
import { CORS } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

async function fetchTaxonomy() {
  const get = async (table: string, select = '*') => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=500`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return res.json();
  };

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
  ]);

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills };
}

function buildTaxonomyPrompt(tax: Awaited<ReturnType<typeof fetchTaxonomy>>): string {
  const themeList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n');

  const faByTheme: Record<string, string[]> = {};
  for (const fa of tax.focusAreas) {
    const key = fa.theme_id || 'NONE';
    if (!faByTheme[key]) faByTheme[key] = [];
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`);
  }
  let faText = '';
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = tax.themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId;
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`;
  }

  const segList = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n');
  const sitList = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n');
  const rtList = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n');
  const scList = tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n');
  const skillList = tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n');

  return `THEMES (pick 1 primary + 0-2 secondary):\n${themeList}\n\nFOCUS AREAS (pick 1-4 by ID):\n${faText}\n\nAUDIENCE SEGMENTS (pick 1-3):\n${segList}\n\nLIFE SITUATIONS (pick 0-3):\n${sitList}\n\nRESOURCE TYPES (pick 1):\n${rtList}\n\nSERVICE CATEGORIES (pick 0-2):\n${scList}\n\nSKILLS (pick 0-3):\n${skillList}\n\nCONTENT TYPE (pick 1 — REQUIRED): article | event | report | video | opportunity | guide | course | announcement | campaign | tool\n\nCENTERS (pick 1): Learning | Action | Resource | Accountability`;
}

function parseClaudeJson(raw: string): any {
  // Strip markdown fences
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  text = text.trim();
  // Find first { and last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON object found in: ${text.substring(0, 200)}`);
  return JSON.parse(text.substring(start, end + 1));
}

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

    const taxonomy = await fetchTaxonomy();
    const taxonomyPrompt = buildTaxonomyPrompt(taxonomy);

    const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id));
    const validThemeIds = new Set(taxonomy.themes.map((t: any) => t.theme_id));
    const validSegmentIds = new Set(taxonomy.segments.map((s: any) => s.segment_id));
    const validSituationIds = new Set(taxonomy.situations.map((s: any) => s.situation_id));
    const validResourceTypeIds = new Set(taxonomy.resourceTypes.map((r: any) => r.resource_type_id));

    // Use input title/desc as primary, scrape only if not provided
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
        if (!imageUrl) {
          const ogImage = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogImage) {
            imageUrl = ogImage[1].trim();
          } else {
            const twImage = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
              || html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
            if (twImage) {
              imageUrl = twImage[1].trim();
            }
          }
        }

        // Always extract full body text for rich content generation
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

        // Prefer <article> or <main> content over full <body> to avoid nav/sidebar noise
        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
        const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

        const contentSource = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || '';
        if (contentSource) {
          extractedBody = stripHtmlNoise(contentSource).substring(0, 5000);
        }

        // Fall back to body text for pageText if og:description was too short
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

    const systemPrompt = `You are the Change Engine v2 classifier for Houston, Texas civic content.
Classify content against the EXACT taxonomy below. Return ONLY valid IDs. Respond with a single JSON object, no markdown, no backticks.

Also produce a 'body_6th_grade' field using this structured markdown template (200-500 words total, 6th-grade reading level). Use asset-based language — focus on strengths, opportunities, and what's available.

## Overview
Author/creator name, organization, what it is, and who it's for. Include website URL if available.

## Why It Matters
Why this resource is valuable. How it connects to community wellbeing, equity, or civic life in Houston. Frame challenges as opportunities.

## How It Works
Key programs, frameworks, methods, or strategies. Use bullet points for specific items when appropriate.

Omit any section that doesn't apply. Preserve specific names, organizations, URLs, and details from the source.

Also produce:
- "hero_quote": A short (1-2 sentence) inspirational or mission-oriented quote extracted or paraphrased from the source content. Use asset-based framing — focus on possibility, community strength, or vision. Null if no suitable quote found.
- "programs": An array of {"name":"...","description":"..."} objects for key programs or initiatives mentioned in the content. Max 4 items. Empty array if none apply.

${taxonomyPrompt}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Title: ${pageTitle}\nURL: ${url || 'N/A'}\nSource: ${sourceDomain || 'manual'}\nContent: ${(pageText || '').substring(0, 2500)}${extractedBody ? `\n\nFull page text:\n${extractedBody.substring(0, 5000)}` : ''}\n\nReturn JSON: {"theme_primary":"THEME_XX","theme_secondary":[],"focus_area_ids":["FA_XXX"],"sdg_ids":["SDG_XX"],"sdoh_code":"SDOH_XX","ntee_codes":["X"],"airs_codes":["X"],"center":"Learning|Action|Resource|Accountability","resource_type_id":"RTYPE_XX","content_type":"article|event|report|video|opportunity|guide|course|announcement|campaign|tool","audience_segment_ids":["SEG_XX"],"life_situation_ids":["SIT_XXX"],"service_cat_ids":["SCAT_XX"],"skill_ids":["SKILL_XX"],"title_6th_grade":"...","summary_6th_grade":"...","body_6th_grade":"3-5 paragraphs with key details preserved","hero_quote":"...or null","programs":[{"name":"...","description":"..."}],"action_items":{"donate_url":null,"volunteer_url":null,"signup_url":null,"phone":null,"apply_url":null,"register_url":null,"attend_url":null},"geographic_scope":"Houston","confidence":0.0,"reasoning":"..."}` }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return new Response(JSON.stringify({ error: 'Claude API error', status: claudeRes.status, detail: errText }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '';

    if (!rawText || rawText.length < 10) {
      return new Response(JSON.stringify({ error: 'Empty Claude response', raw: rawText, stop_reason: claudeData.stop_reason }), {
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

    // VALIDATE + ENRICH
    const validation: Record<string, string[]> = { valid: [], invalid: [], enriched: [] };
    const enrichedFocusAreas: any[] = [];
    const inheritedSdgs = new Set<string>();
    const inheritedNtee = new Set<string>();
    const inheritedAirs = new Set<string>();
    let inheritedSdoh = '';

    for (const faId of (classification.focus_area_ids || [])) {
      if (validFocusIds.has(faId)) {
        validation.valid.push(faId);
        const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId);
        if (fa) {
          enrichedFocusAreas.push(fa);
          if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id);
          if (fa.ntee_code) inheritedNtee.add(fa.ntee_code);
          if (fa.airs_code) inheritedAirs.add(fa.airs_code);
          if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code;
        }
      } else {
        validation.invalid.push(faId);
      }
    }

    const finalSdgs = [...new Set([...inheritedSdgs, ...(classification.sdg_ids || [])])];
    const finalNtee = [...new Set([...inheritedNtee, ...(classification.ntee_codes || [])])];
    const finalAirs = [...new Set([...inheritedAirs, ...(classification.airs_codes || [])])];
    const finalSdoh = classification.sdoh_code || inheritedSdoh;

    const enriched = {
      ...classification,
      sdg_ids: finalSdgs,
      ntee_codes: finalNtee,
      airs_codes: finalAirs,
      sdoh_code: finalSdoh,
      _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({ id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id, sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging })),
      _validation: validation,
      _version: 'v2-full-matrix',
    };

    // Write to pipeline
    const inboxRes = await fetch(`${SUPABASE_URL}/rest/v1/content_inbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=representation' },
      body: JSON.stringify({ source_url: url, source_domain: sourceDomain, title: pageTitle, description: (pageText || '').substring(0, 1000), image_url: imageUrl || null, extracted_text: extractedBody || null, scraped_at: new Date().toISOString(), status: 'needs_review', source_trust_level: 'unknown', content_type: enriched.content_type || null }),
    });
    const inboxData = await inboxRes.json();
    const inboxId = Array.isArray(inboxData) ? inboxData[0]?.id : inboxData?.id;

    if (inboxId) {
      await fetch(`${SUPABASE_URL}/rest/v1/content_review_queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ inbox_id: inboxId, ai_classification: enriched, confidence: enriched.confidence || 0, review_status: 'pending' }),
      });
    }

    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ event_type: 'classify_v2', source: sourceDomain || 'manual', source_url: url, status: validation.invalid.length > 0 ? 'partial' : 'success', message: `v2: ${enrichedFocusAreas.length}FA ${finalSdgs.length}SDG ${finalNtee.length}NTEE | ${validation.invalid.length} invalid`, item_count: 1 }),
    });

    return new Response(JSON.stringify({ success: true, version: 'v2-full-matrix', inbox_id: inboxId, classification: enriched, extracted: { title: pageTitle, domain: sourceDomain, image_url: imageUrl || null }, taxonomy_count: { focus_areas: taxonomy.focusAreas.length, themes: taxonomy.themes.length } }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message, stack: (err as Error).stack }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
