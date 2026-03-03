import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are the Change Engine content classifier for The Change Lab in Houston, Texas.

Given a content item (title + description/text), return a JSON object with:
- pathway: one of ["Our Health","Our Families","Our Neighborhood","Our Voice","Our Money","Our Planet","The Bigger We"]
- pathway_secondary: array of 0-2 additional pathways if content bridges themes
- engagement_level: "Learn" (informational), "Act" (calls to action, events, volunteering), or "Lead" (advocacy, organizing, running for office)
- focus_areas: array of 1-3 relevant focus area names from the Houston civic taxonomy
- sdg_ids: array of 1-2 UN SDG numbers as strings ("1" through "17")
- sdoh_domain: one of ["Economic Stability","Education Access and Quality","Health Care Access and Quality","Neighborhood and Built Environment","Social and Community Context"] or null
- resource_type: one of ["News Article","Blog Post","Guide","Event Listing","Organization Profile","Government Resource","Research Report","Video","Podcast","Tool/Calculator","Directory"]
- audience_segments: array of 1-2 from ["The Ready but Lost","The ALICE Neighbor","The Civic Veteran","The Issue Advocate","The New Houstonian","The Community Connector","The Young Adult","The Change Maker"]
- title_6th_grade: a clear, simple rewrite of the title at a 6th-grade reading level (max 80 chars)
- summary_6th_grade: a 1-2 sentence plain-language summary (max 200 chars)
- confidence: 0.0-1.0 reflecting your certainty
- reasoning: brief explanation of classification choices

Respond with JSON only. No markdown, no backticks.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { url, title, description } = await req.json();

    if (!url && !title) {
      return new Response(JSON.stringify({ error: 'Provide url or title+description' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // If URL provided, try to fetch page content
    let pageTitle = title || '';
    let pageText = description || '';
    let sourceDomain = '';

    if (url) {
      try {
        const parsed = new URL(url);
        sourceDomain = parsed.hostname;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TheChangeEngine/1.0 (civic-classifier)' },
        });
        const html = await res.text();

        // Extract title from <title> tag
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && !pageTitle) pageTitle = titleMatch[1].trim();

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch && !pageText) pageText = descMatch[1].trim();

        // Extract og:description as fallback
        if (!pageText) {
          const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          if (ogMatch) pageText = ogMatch[1].trim();
        }

        // Get some body text (strip tags, first 2000 chars)
        const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
        if (bodyMatch) {
          const bodyText = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
          if (bodyText.length > pageText.length) pageText = bodyText;
        }
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        // Continue with whatever we have
      }
    }

    if (!pageTitle && !pageText) {
      return new Response(JSON.stringify({ error: 'Could not extract content from URL' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Call Claude API for classification
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured. Set it via: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Classify this content:\n\nTitle: ${pageTitle}\nURL: ${url || 'N/A'}\nSource: ${sourceDomain || 'N/A'}\nContent: ${pageText.substring(0, 3000)}`,
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const classificationText = claudeData.content?.[0]?.text || '{}';
    let classification;
    try {
      classification = JSON.parse(classificationText);
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse classification', raw: classificationText }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Insert into content_inbox
    const inboxRes = await fetch(`${SUPABASE_URL}/rest/v1/content_inbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        source_url: url || '',
        source_domain: sourceDomain,
        title: pageTitle,
        description: pageText.substring(0, 1000),
        status: classification.confidence >= 0.7 ? 'classified' : 'needs_review',
        source_trust_level: 'unknown',
      }),
    });

    const inboxData = await inboxRes.json();
    const inboxId = Array.isArray(inboxData) ? inboxData[0]?.id : inboxData?.id;

    // Insert into content_review_queue
    if (inboxId) {
      await fetch(`${SUPABASE_URL}/rest/v1/content_review_queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          inbox_id: inboxId,
          ai_classification: classification,
          confidence: classification.confidence || 0,
          review_status: 'pending',
        }),
      });
    }

    // Log the ingestion
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        event_type: 'classify',
        source: sourceDomain || 'manual',
        source_url: url || '',
        status: 'success',
        message: `Classified as ${classification.pathway} (${classification.engagement_level}) with ${(classification.confidence * 100).toFixed(0)}% confidence`,
        item_count: 1,
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      inbox_id: inboxId,
      classification,
      extracted: { title: pageTitle, domain: sourceDomain },
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
