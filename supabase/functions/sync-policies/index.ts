import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CONGRESS_API_KEY = Deno.env.get('CONGRESS_API_KEY')!;
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ============================================
// DB HELPERS
// ============================================
async function db(path: string, method = 'GET', body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation,resolution=merge-duplicates' : method === 'GET' ? '' : 'return=representation',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error(`DB ${method} ${path}: ${res.status} ${err}`);
    return null;
  }
  return res.json();
}

// ============================================
// STATUS MAPPING
// ============================================
function mapStatus(latestActionText: string): string {
  const t = (latestActionText || '').toLowerCase();
  if (t.includes('became public law') || t.includes('signed by president')) return 'Enacted';
  if (t.includes('passed house') || t.includes('passed senate')) return 'Passed';
  if (t.includes('introduced') || t.includes('referred to')) return 'Introduced';
  if (t.includes('failed') || t.includes('vetoed')) return 'Failed';
  return 'Pending';
}

// ============================================
// BILL TYPE FORMATTING
// ============================================
function formatBillNumber(type: string, number: string | number): string {
  const typeMap: Record<string, string> = {
    hr: 'HR', s: 'S', hjres: 'HJRES', sjres: 'SJRES',
    hconres: 'HCONRES', sconres: 'SCONRES', hres: 'HRES', sres: 'SRES',
  };
  return `${typeMap[type.toLowerCase()] || type.toUpperCase()} ${number}`;
}

function buildSourceUrl(congress: number, type: string, number: string | number): string {
  return `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase().replace('hr', 'house-bill').replace('sjres', 'senate-joint-resolution').replace('hjres', 'house-joint-resolution').replace('sconres', 'senate-concurrent-resolution').replace('hconres', 'house-concurrent-resolution').replace('hres', 'house-resolution').replace('sres', 'senate-resolution')}/${number}`;
}

function buildReadableSourceUrl(congress: number, type: string, number: string | number): string {
  const typeSlugMap: Record<string, string> = {
    hr: 'house-bill',
    s: 'senate-bill',
    hjres: 'house-joint-resolution',
    sjres: 'senate-joint-resolution',
    hconres: 'house-concurrent-resolution',
    sconres: 'senate-concurrent-resolution',
    hres: 'house-resolution',
    sres: 'senate-resolution',
  };
  const slug = typeSlugMap[type.toLowerCase()] || type.toLowerCase();
  return `https://www.congress.gov/bill/${congress}th-congress/${slug}/${number}`;
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'recent';
    const congress: number = body.congress || 119;
    const triggerClassify: boolean = body.trigger_classify === true;

    if (!CONGRESS_API_KEY) {
      return new Response(JSON.stringify({ error: 'CONGRESS_API_KEY not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch existing officials for sponsor matching
    const officials = await db('elected_officials?select=official_id,official_name&level=eq.Federal&limit=1000') || [];
    const officialNameMap = new Map<string, string>();
    for (const o of officials) {
      // Index by lowercase last name for fuzzy matching
      const parts = (o.official_name || '').split(' ');
      const lastName = parts[parts.length - 1]?.toLowerCase();
      if (lastName) officialNameMap.set(lastName, o.official_id);
      // Also index by full name
      officialNameMap.set((o.official_name || '').toLowerCase(), o.official_id);
    }

    // Determine date range
    const now = new Date();
    const fromDate = mode === 'recent'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    // Fetch bill list
    const listUrl = `https://api.congress.gov/v3/bill?api_key=${CONGRESS_API_KEY}&limit=50&sort=updateDate+desc&fromDateTime=${fromDateStr}T00:00:00Z`;
    const listRes = await fetch(listUrl, { signal: AbortSignal.timeout(15000) });

    if (!listRes.ok) {
      const errText = await listRes.text();
      return new Response(JSON.stringify({ error: 'Congress API error', status: listRes.status, detail: errText }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const listData = await listRes.json();
    const bills = listData.bills || [];

    let upserted = 0;
    let upsertErrors = 0;
    let detailErrors = 0;
    const results: any[] = [];

    for (const bill of bills) {
      const billType = bill.type?.toLowerCase() || 'hr';
      const billNumber = bill.number || '';
      const billCongress = bill.congress || congress;

      const policyId = `POL_${billCongress}_${billType}_${billNumber}`;

      // Fetch bill detail for more info
      try {
        const detailUrl = `https://api.congress.gov/v3/bill/${billCongress}/${billType}/${billNumber}?api_key=${CONGRESS_API_KEY}`;
        const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(10000) });

        if (!detailRes.ok) {
          console.error(`Detail fetch failed for ${policyId}: ${detailRes.status}`);
          detailErrors++;

          // Still upsert with list-level data
          const record = {
            policy_id: policyId,
            policy_name: bill.title || `${formatBillNumber(billType, billNumber)}`,
            bill_number: formatBillNumber(billType, billNumber),
            level: 'Federal',
            status: mapStatus(bill.latestAction?.text || ''),
            last_action: bill.latestAction?.text || null,
            last_action_date: bill.latestAction?.actionDate || null,
            source_url: buildReadableSourceUrl(billCongress, billType, billNumber),
            data_source: 'congress_gov',
            last_updated: new Date().toISOString(),
          };

          const res = await db('policies?on_conflict=policy_id', 'POST', [record]);
          if (res) { upserted++; results.push({ action: 'upserted', policy_id: policyId, name: record.policy_name }); }
          else { upsertErrors++; results.push({ action: 'error', policy_id: policyId }); }

          await sleep(1000);
          continue;
        }

        const detail = await detailRes.json();
        const billDetail = detail.bill || {};

        // Match sponsors to existing officials
        const matchedOfficialIds: string[] = [];
        const sponsors = billDetail.sponsors || [];
        for (const sponsor of sponsors) {
          const name = (sponsor.fullName || sponsor.firstName + ' ' + sponsor.lastName || '').toLowerCase();
          const parts = name.split(' ');
          const lastName = parts[parts.length - 1];

          // Try full name match first, then last name
          const match = officialNameMap.get(name) || officialNameMap.get(lastName);
          if (match) matchedOfficialIds.push(match);
        }

        const record = {
          policy_id: policyId,
          policy_name: billDetail.title || bill.title || formatBillNumber(billType, billNumber),
          bill_number: formatBillNumber(billType, billNumber),
          level: 'Federal',
          status: mapStatus(billDetail.latestAction?.text || bill.latestAction?.text || ''),
          policy_type: billDetail.policyArea?.name || null,
          introduced_date: billDetail.introducedDate || null,
          last_action: billDetail.latestAction?.text || bill.latestAction?.text || null,
          last_action_date: billDetail.latestAction?.actionDate || bill.latestAction?.actionDate || null,
          source_url: buildReadableSourceUrl(billCongress, billType, billNumber),
          official_ids: matchedOfficialIds.length > 0 ? matchedOfficialIds.join(',') : null,
          data_source: 'congress_gov',
          last_updated: new Date().toISOString(),
        };

        const res = await db('policies?on_conflict=policy_id', 'POST', [record]);
        if (res) {
          upserted++;
          results.push({ action: 'upserted', policy_id: policyId, name: record.policy_name, sponsors_matched: matchedOfficialIds.length });
        } else {
          upsertErrors++;
          results.push({ action: 'error', policy_id: policyId });
        }
      } catch (err) {
        console.error(`Error processing bill ${policyId}:`, (err as Error).message);
        detailErrors++;
        results.push({ action: 'error', policy_id: policyId, error: (err as Error).message });
      }

      // Rate limiting: 1s between detail calls
      await sleep(1000);
    }

    // Log to ingestion_log
    await db('ingestion_log', 'POST', {
      event_type: 'sync_policies',
      source: 'congress_gov',
      status: upsertErrors === 0 ? 'success' : 'partial',
      message: `Synced ${upserted} policies (${mode} mode, congress ${congress}). ${detailErrors} detail errors, ${upsertErrors} upsert errors.`,
      item_count: upserted,
    });

    // Optionally trigger backfill-v2
    if (triggerClassify && upserted > 0) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/backfill-v2`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ table: 'policies', batch_size: 3 }),
        });
      } catch (err) {
        console.error('Failed to trigger backfill-v2:', (err as Error).message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      congress,
      bills_found: bills.length,
      upserted,
      upsert_errors: upsertErrors,
      detail_errors: detailErrors,
      message: `Synced ${upserted} policies from Congress.gov (${mode} mode)`,
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
