import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCallerRole, requireRole } from '../_shared/auth.ts';
import { CORS } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLASSIFY_URL = `${SUPABASE_URL}/functions/v1/classify-content-v2`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
    const rows: { url: string; title?: string; description?: string }[] = body.rows || [];

    if (!rows.length) {
      return new Response(JSON.stringify({ error: 'Provide rows: [{url, title?, description?}, ...]' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const results: { url: string; success: boolean; inbox_id?: string; error?: string; confidence?: number }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.url) {
        results.push({ url: '', success: false, error: 'Missing url' });
        failed++;
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
            url: row.url,
            title: row.title || '',
            description: row.description || '',
          }),
        });

        const data = await classifyRes.json();

        if (classifyRes.ok && data.success) {
          results.push({ url: row.url, success: true, inbox_id: data.inbox_id, confidence: data.classification?.confidence });
          succeeded++;
        } else {
          results.push({ url: row.url, success: false, error: data.error || `HTTP ${classifyRes.status}` });
          failed++;
        }
      } catch (err) {
        results.push({ url: row.url, success: false, error: (err as Error).message });
        failed++;
      }

      // Rate limit: 1 second between calls
      if (i < rows.length - 1) {
        await sleep(1000);
      }
    }

    // Log the batch
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ event_type: 'csv_upload', source: 'csv-upload', status: failed === 0 ? 'success' : 'partial', message: `CSV batch: ${succeeded}/${rows.length} succeeded`, item_count: rows.length }),
    });

    return new Response(JSON.stringify({
      processed: rows.length,
      succeeded,
      failed,
      results,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
