import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateApiKey } from '../_shared/api-key-auth.ts';
import { CORS } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLASSIFY_URL = `${SUPABASE_URL}/functions/v1/classify-content-v2`;
const MAX_URLS = 25;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const urls: { url: string; title?: string; description?: string }[] = body.urls || [];

    if (!urls.length) {
      return new Response(JSON.stringify({ error: 'Provide urls: [{url, title?, description?}, ...]' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (urls.length > MAX_URLS) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_URLS} URLs per request` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Auth via API key
    const auth = await validateApiKey(req, urls.length);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status || 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Batch dedup: check which URLs already exist in content_inbox
    const urlList = urls.map(u => u.url).filter(Boolean);
    const dedupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/content_inbox?source_url=in.(${urlList.map(u => `"${u}"`).join(',')})&select=id,source_url`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    const existingItems = await dedupRes.json();
    const existingMap = new Map<string, string>();
    if (Array.isArray(existingItems)) {
      for (const item of existingItems) {
        existingMap.set(item.source_url, item.id);
      }
    }

    const results: {
      url: string;
      success: boolean;
      inbox_id?: string;
      existing_inbox_id?: string;
      skipped?: boolean;
      confidence?: number;
      error?: string;
    }[] = [];
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < urls.length; i++) {
      const item = urls[i];
      if (!item.url) {
        results.push({ url: '', success: false, error: 'Missing url' });
        failed++;
        continue;
      }

      // Skip duplicates
      const existingId = existingMap.get(item.url);
      if (existingId) {
        results.push({ url: item.url, success: true, skipped: true, existing_inbox_id: existingId });
        skipped++;
        continue;
      }

      try {
        const classifyRes = await fetch(CLASSIFY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            url: item.url,
            title: item.title || '',
            description: item.description || '',
          }),
        });

        const data = await classifyRes.json();

        if (classifyRes.ok && data.success) {
          const inboxId = data.inbox_id;

          // If org_id from API key, patch content_inbox
          if (auth.orgId && inboxId) {
            await fetch(
              `${SUPABASE_URL}/rest/v1/content_inbox?id=eq.${inboxId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: SUPABASE_KEY,
                  Authorization: `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({ org_id: auth.orgId }),
              },
            );
          }

          results.push({
            url: item.url,
            success: true,
            inbox_id: inboxId,
            confidence: data.classification?.confidence,
          });
          succeeded++;
        } else {
          results.push({ url: item.url, success: false, error: data.error || `HTTP ${classifyRes.status}` });
          failed++;
        }
      } catch (err) {
        results.push({ url: item.url, success: false, error: (err as Error).message });
        failed++;
      }

      // Rate limit: 1 second between classify calls
      if (i < urls.length - 1) {
        await sleep(1000);
      }
    }

    // Log the batch
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        event_type: 'api_ingest',
        source: `api-key:${auth.label}`,
        status: failed === 0 ? 'success' : 'partial',
        message: `API ingest: ${succeeded} new, ${skipped} skipped, ${failed} failed of ${urls.length}`,
        item_count: urls.length,
      }),
    });

    const durationMs = Date.now() - startTime;

    return new Response(JSON.stringify({
      processed: urls.length,
      succeeded,
      failed,
      skipped,
      results,
      duration_ms: durationMs,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
