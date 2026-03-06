import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * sync-federal-spending — Pulls federal grants, contracts, and loans flowing
 * into Houston / Harris County from USAspending.gov API.
 *
 * NO API KEY REQUIRED — fully public API.
 *
 * Creates content_published entries tagged to geography + focus areas so
 * spending data shows up in maps, shelves, and Wayfinder.
 *
 * Request body:
 *   { mode: 'recent'|'full', fiscal_year?: number }
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const USA_SPENDING_BASE = 'https://api.usaspending.gov/api/v2';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── DB helper ─────────────────────────────────────────────────────────

async function db(path: string, method = 'GET', body?: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST'
        ? 'return=representation,resolution=merge-duplicates'
        : method === 'GET' ? '' : 'return=representation',
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

// ── SHA-256 helper ────────────────────────────────────────────────────

async function sha256Short(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 12);
}

// ── Fetch spending by agency for Harris County ────────────────────────

interface SpendingResult {
  agency: string;
  amount: number;
  awardCount: number;
  category: string;
}

async function fetchSpendingByGeography(fiscalYear: number): Promise<SpendingResult[]> {
  const results: SpendingResult[] = [];

  // Spending by agency in Harris County
  for (const awardType of ['contracts', 'grants', 'loans']) {
    try {
      const res = await fetch(`${USA_SPENDING_BASE}/search/spending_by_award/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            time_period: [{ start_date: `${fiscalYear}-10-01`, end_date: `${fiscalYear + 1}-09-30` }],
            recipient_locations: [{ country: 'USA', state: 'TX', county: '201' }], // Harris County FIPS 201
            award_type_codes: awardType === 'contracts' ? ['A', 'B', 'C', 'D']
              : awardType === 'grants' ? ['02', '03', '04', '05']
              : ['06', '07', '08', '09', '10', '11'],
          },
          fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Description', 'Start Date'],
          limit: 25,
          page: 1,
          sort: 'Award Amount',
          order: 'desc',
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        console.error(`USAspending ${awardType}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const awards = data.results || [];

      // Aggregate by agency
      const agencyTotals = new Map<string, { amount: number; count: number }>();
      for (const award of awards) {
        const agency = award['Awarding Agency'] || 'Other';
        const amount = parseFloat(award['Award Amount']) || 0;
        const existing = agencyTotals.get(agency) || { amount: 0, count: 0 };
        existing.amount += amount;
        existing.count++;
        agencyTotals.set(agency, existing);
      }

      for (const [agency, totals] of agencyTotals) {
        results.push({
          agency,
          amount: totals.amount,
          awardCount: totals.count,
          category: awardType,
        });
      }

      await sleep(1000);
    } catch (err) {
      console.error(`USAspending ${awardType} error:`, (err as Error).message);
    }
  }

  return results;
}

// ── Format currency ───────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

// ── Main handler ──────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const currentYear = new Date().getFullYear();
    const fiscalYear: number = body.fiscal_year || (new Date().getMonth() >= 9 ? currentYear : currentYear - 1);

    const stats = { records_upserted: 0, geo_bindings: 0, errors: 0 };

    const spendingData = await fetchSpendingByGeography(fiscalYear);

    // Upsert each agency-category combo as a policy record
    // This makes federal spending visible in the same pipeline as legislation
    for (const item of spendingData) {
      const policyId = `POL_SPEND_${fiscalYear}_${await sha256Short(item.agency + '|' + item.category)}`;

      const categoryLabel = item.category === 'contracts' ? 'Federal Contracts'
        : item.category === 'grants' ? 'Federal Grants'
        : 'Federal Loans';

      const record = {
        policy_id: policyId,
        policy_name: `${categoryLabel}: ${item.agency} — ${formatAmount(item.amount)} to Harris County (FY${fiscalYear})`,
        bill_number: `FY${fiscalYear}-${item.category.toUpperCase()}`,
        level: 'Federal',
        status: 'Enacted',
        policy_type: `Federal Spending - ${categoryLabel}`,
        impact_statement: `${item.agency} directed ${formatAmount(item.amount)} in ${item.category} (${item.awardCount} awards) to Harris County organizations in fiscal year ${fiscalYear}.`,
        source_url: `https://www.usaspending.gov/search/?hash=harris-county-${item.category}`,
        data_source: 'usaspending',
        is_published: false,
        last_updated: new Date().toISOString(),
      };

      const res = await db('policies?on_conflict=policy_id', 'POST', [record]);
      if (res) {
        stats.records_upserted++;
        // Bind to Harris County geography for maps
        await db('policy_geography?on_conflict=policy_id,geo_type,geo_id', 'POST', [{
          policy_id: policyId,
          geo_id: 'harris-county',
          geo_type: 'county',
        }]);
        stats.geo_bindings++;
      } else {
        stats.errors++;
      }
    }

    // Log
    await db('ingestion_log', 'POST', {
      event_type: 'sync_federal_spending',
      source: 'usaspending',
      status: stats.errors === 0 ? 'success' : 'partial',
      message: `FY${fiscalYear}: ${stats.records_upserted} spending records, ${stats.geo_bindings} geo bindings`,
      item_count: stats.records_upserted,
    });

    return new Response(JSON.stringify({
      success: true,
      fiscal_year: fiscalYear,
      ...stats,
      spending_data: spendingData.length,
      message: `Federal spending sync: ${stats.records_upserted} records for FY${fiscalYear}`,
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
