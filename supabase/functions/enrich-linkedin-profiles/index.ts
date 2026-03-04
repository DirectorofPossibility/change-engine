import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/*
 * enrich-linkedin-profiles
 *
 * Google Custom Search fallback for finding LinkedIn profiles of foundation
 * people and elected officials who don't have LinkedIn URLs yet.
 * Processes 20 people per run to stay within API rate limits.
 *
 * Endpoints:
 *   POST /  { limit?: number }  — enrich up to N people (default 20)
 *   GET  /                      — returns pending counts
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CSE_API_KEY = Deno.env.get('GOOGLE_CSE_API_KEY') || '';
const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID') || '';
const HD = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

/* ── Supabase REST helpers ── */
async function sbGet(table: string, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HD });
  if (!res.ok) return [];
  return res.json();
}

async function sbPost(table: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HD, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
}

async function sbPatch(table: string, query: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { ...HD, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  });
}

/* ── Google Custom Search for LinkedIn profiles ── */
async function searchLinkedIn(name: string, organization: string): Promise<string | null> {
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) return null;

  const query = `site:linkedin.com/in/ "${name}" "${organization}"`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(GOOGLE_CSE_API_KEY)}&cx=${encodeURIComponent(GOOGLE_CSE_ID)}&q=${encodeURIComponent(query)}&num=3`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Google CSE error:', res.status);
      return null;
    }
    const data = await res.json();
    const items = data.items || [];

    // Find the first result that's actually a LinkedIn profile
    for (const item of items) {
      const link: string = item.link || '';
      if (link.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/)) {
        return link.replace(/\/$/, '');
      }
    }
    return null;
  } catch (err) {
    console.error('Google CSE fetch failed:', (err as Error).message);
    return null;
  }
}

/* ── Main handler ── */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // GET — return counts of people needing enrichment
  if (req.method === 'GET') {
    const fpNone = await sbGet('foundation_people', 'linkedin_status=eq.none&is_current=eq.true&select=id&limit=1000');
    const opNone = await sbGet('official_profiles', 'linkedin_status=eq.none&select=id&limit=1000');
    const fpCandidate = await sbGet('foundation_people', 'linkedin_status=eq.candidate&select=id&limit=1000');
    const opCandidate = await sbGet('official_profiles', 'linkedin_status=eq.candidate&select=id&limit=1000');

    return new Response(JSON.stringify({
      foundation_people_needing_search: fpNone.length,
      officials_needing_search: opNone.length,
      foundation_people_pending_review: fpCandidate.length,
      officials_pending_review: opCandidate.length,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // POST — run enrichment
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID) {
    return new Response(JSON.stringify({
      error: 'GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables are required',
    }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    let limit = 20;
    try {
      const body = await req.json();
      if (body.limit && typeof body.limit === 'number') limit = Math.min(body.limit, 50);
    } catch { /* use default */ }

    const results: Array<{ type: string; name: string; org: string; linkedin_url: string | null; status: string }> = [];

    // Fetch foundation people without LinkedIn
    const fpPeople: any[] = await sbGet(
      'foundation_people',
      `linkedin_status=eq.none&is_current=eq.true&select=id,name,foundation_id&limit=${limit}`
    );

    // Get foundation names for context
    const foundationIds = [...new Set(fpPeople.map(p => p.foundation_id))];
    let foundationMap: Record<string, string> = {};
    if (foundationIds.length > 0) {
      const foundations: any[] = await sbGet(
        'foundations',
        `id=in.(${foundationIds.map(id => `"${id}"`).join(',')})&select=id,name`
      );
      foundationMap = Object.fromEntries(foundations.map(f => [f.id, f.name]));
    }

    // Process foundation people
    for (const person of fpPeople) {
      const orgName = foundationMap[person.foundation_id] || '';
      console.log(`Searching LinkedIn for: ${person.name} (${orgName})`);

      const linkedinUrl = await searchLinkedIn(person.name, orgName);
      if (linkedinUrl) {
        await sbPatch('foundation_people', `id=eq.${person.id}`, {
          linkedin_url: linkedinUrl,
          linkedin_status: 'candidate',
        });
        results.push({ type: 'foundation', name: person.name, org: orgName, linkedin_url: linkedinUrl, status: 'candidate' });
      } else {
        // Mark as searched so we don't re-process
        await sbPatch('foundation_people', `id=eq.${person.id}`, {
          linkedin_status: 'none_searched',
        });
        results.push({ type: 'foundation', name: person.name, org: orgName, linkedin_url: null, status: 'not_found' });
      }
    }

    // If we have remaining capacity, process officials
    const remaining = limit - fpPeople.length;
    if (remaining > 0) {
      const officials: any[] = await sbGet(
        'official_profiles',
        `linkedin_status=eq.none&select=id,name,title,level&limit=${remaining}`
      );

      for (const official of officials) {
        const orgContext = official.level ? `${official.level} government` : 'government official';
        console.log(`Searching LinkedIn for official: ${official.name} (${orgContext})`);

        const linkedinUrl = await searchLinkedIn(official.name, orgContext);
        if (linkedinUrl) {
          await sbPatch('official_profiles', `id=eq.${official.id}`, {
            social_linkedin: linkedinUrl,
            linkedin_status: 'candidate',
          });
          results.push({ type: 'official', name: official.name, org: orgContext, linkedin_url: linkedinUrl, status: 'candidate' });
        } else {
          await sbPatch('official_profiles', `id=eq.${official.id}`, {
            linkedin_status: 'none_searched',
          });
          results.push({ type: 'official', name: official.name, org: orgContext, linkedin_url: null, status: 'not_found' });
        }
      }
    }

    // Log to ingestion_log
    const found = results.filter(r => r.linkedin_url).length;
    await sbPost('ingestion_log', {
      event_type: 'linkedin_enrichment',
      source: 'enrich-linkedin-profiles',
      status: 'success',
      message: `Searched ${results.length} people, found ${found} LinkedIn candidates`,
      item_count: results.length,
    });

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      found,
      not_found: results.length - found,
      results,
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
