import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BATCH_CLASSIFY_URL = `${SUPABASE_URL}/functions/v1/batch-classify`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function dbPost(path: string, body: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 5, 15); // max 15 per call
    const delayBetweenOrgs = Math.max(body.delay_ms || 15000, 10000); // min 10s
    const mode = body.mode || 'homepage'; // 'homepage' = just homepage, 'discover' = find subpages
    const startFrom = body.start_from || null; // org_id to start from (for pagination)

    // Find orgs that don't have content yet
    let query = 'organizations?select=org_id,org_name,website&order=org_id.asc';
    if (startFrom) {
      query += `&org_id=gte.${startFrom}`;
    }
    query += `&limit=${batchSize * 2}`; // fetch extra in case some already have content

    const allOrgs = await dbFetch(query);

    // Filter to orgs without content
    const orgsWithContent = await dbFetch('content_inbox?select=org_id&org_id=not.is.null');
    const orgsWithContentSet = new Set((orgsWithContent || []).map((r: any) => r.org_id));

    const orgsToProcess = (allOrgs || [])
      .filter((o: any) => !orgsWithContentSet.has(o.org_id) && o.website)
      .slice(0, batchSize);

    if (orgsToProcess.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All orgs have content! Nothing to backfill.',
        total_orgs: allOrgs?.length || 0,
        orgs_with_content: orgsWithContentSet.size,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Count totals for progress
    const totalOrgs = await dbFetch('organizations?select=org_id&limit=1000');
    const totalCount = totalOrgs?.length || 0;
    const doneCount = orgsWithContentSet.size;
    const remainingCount = totalCount - doneCount;

    const results: any[] = [];

    for (let i = 0; i < orgsToProcess.length; i++) {
      const org = orgsToProcess[i];
      console.log(`[${i+1}/${orgsToProcess.length}] Processing ${org.org_name} (${org.org_id})...`);

      try {
        if (mode === 'discover') {
          // Use batch-classify in discover mode - finds subpages
          const res = await fetch(BATCH_CLASSIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'discover',
              homepage: org.website,
              delay_ms: delayBetweenOrgs,
              max_items: 10,
            }),
          });
          const data = await res.json();
          results.push({
            org_id: org.org_id,
            org_name: org.org_name,
            website: org.website,
            status: res.ok ? 'done' : 'error',
            classified: data.classified || 0,
            errors: data.errors || 0,
            pages_found: data.processed || 0,
          });
        } else {
          // Homepage-only mode - just classify the homepage URL
          const res = await fetch(BATCH_CLASSIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'urls',
              urls: [org.website],
              delay_ms: 5000,
              max_items: 1,
            }),
          });
          const data = await res.json();
          results.push({
            org_id: org.org_id,
            org_name: org.org_name,
            website: org.website,
            status: res.ok ? 'done' : 'error',
            classified: data.classified || 0,
            detail: data.results?.[0] || null,
          });
        }
      } catch (err) {
        results.push({
          org_id: org.org_id,
          org_name: org.org_name,
          website: org.website,
          status: 'error',
          error: (err as Error).message,
        });
      }

      // Delay between orgs
      if (i < orgsToProcess.length - 1) {
        await sleep(delayBetweenOrgs);
      }
    }

    // Log the batch run
    const classified = results.filter(r => r.status === 'done').length;
    const errors = results.filter(r => r.status === 'error').length;
    await dbPost('ingestion_log', {
      event_type: 'backfill_batch',
      source: 'backfill-orgs',
      status: errors > 0 ? 'partial' : 'success',
      message: `Backfill batch: ${classified}/${orgsToProcess.length} orgs processed. Progress: ${doneCount + classified}/${totalCount}`,
      item_count: classified,
    });

    // Next org to start from
    const lastOrgId = orgsToProcess[orgsToProcess.length - 1]?.org_id;
    const nextOrgQuery = `organizations?select=org_id&org_id=gt.${lastOrgId}&order=org_id.asc&limit=1`;
    const nextOrg = await dbFetch(nextOrgQuery);
    const nextStartFrom = nextOrg?.[0]?.org_id || null;

    return new Response(JSON.stringify({
      success: true,
      batch_processed: orgsToProcess.length,
      classified,
      errors,
      progress: {
        done: doneCount + classified,
        total: totalCount,
        remaining: remainingCount - classified,
        percent: Math.round(((doneCount + classified) / totalCount) * 100),
      },
      next_start_from: nextStartFrom,
      next_call: nextStartFrom
        ? `curl -X POST .../backfill-orgs -d '{"batch_size":${batchSize},"start_from":"${nextStartFrom}"}'`
        : 'DONE - all orgs processed!',
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
