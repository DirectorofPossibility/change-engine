import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

async function upsertSite(site: any) {
  return db('distribution_sites?on_conflict=site_id', 'POST', site);
}

async function logSync(orgId: string, source: string, status: string, message: string, count: number) {
  return db('ingestion_log', 'POST', {
    event_type: 'site_sync',
    source: `${orgId}:${source}`,
    status,
    message,
    item_count: count,
  });
}

// ============================================
// TAXONOMY LOADER (for AI classification of sites)
// ============================================
async function loadTaxonomy() {
  const [focusAreas, audiences, situations] = await Promise.all([
    db('focus_areas?select=focus_area_id,name,theme_id&limit=200'),
    db('audience_segments?select=segment_id,name&limit=50'),
    db('life_situations?select=situation_id,situation_label&limit=50'),
  ]);

  const faList = (focusAreas || []).map((f: any) => `${f.focus_area_id}: ${f.name}`).join('\n');
  const audList = (audiences || []).map((a: any) => `${a.segment_id}: ${a.name}`).join('\n');
  const sitList = (situations || []).map((s: any) => `${s.situation_id}: ${s.situation_label}`).join('\n');

  return { faList, audList, sitList };
}

// ============================================
// AI SITE CLASSIFIER
// Classifies a distribution site against the matrix
// ============================================
async function classifySite(site: { name: string; type: string; description: string; requirements?: string }, taxonomy: any): Promise<any> {
  const prompt = `You are a social services classifier for The Change Engine platform in Houston, TX.

Classify this food distribution site against our taxonomy. Return ONLY a JSON object.

SITE:
Name: ${site.name}
Type: ${site.type}
Description: ${site.description}
${site.requirements ? `Requirements: ${site.requirements}` : ''}

FOCUS AREAS (pick 1-5 most relevant):
${taxonomy.faList}

AUDIENCE SEGMENTS (pick 1-4):
${taxonomy.audList}

LIFE SITUATIONS (pick 1-4):
${taxonomy.sitList}

RETURN JSON:
{
  "focus_area_ids": ["FA_XXX"],
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["LS_XXX"],
  "resource_type_id": "RTYPE_21"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    // Strip markdown fences
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('AI classify error:', err);
    return null;
  }
}

// ============================================
// SOURCE ADAPTERS
// Each adapter fetches sites from a specific data source
// and returns normalized site objects
// ============================================

interface RawSite {
  source_id: string;
  name: string;
  site_type: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  hours_of_operation?: any;
  requirements?: string;
  languages?: string[];
}

// ---- ADAPTER: HFB Map App (map.houstonfoodbank.org) ----
async function fetchHfbMapSites(): Promise<RawSite[]> {
  const sites: RawSite[] = [];

  try {
    const res = await fetch('https://map.houstonfoodbank.org/', {
      headers: { 'User-Agent': 'TheChangeEngine/2.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const jsonMatch = html.match(/(?:locations|markers|sites|data)\s*[:=]\s*(\[[\s\S]*?\])/i);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          for (const item of data) {
            sites.push({
              source_id: item.id || item.site_id || `hfb_${sites.length}`,
              name: item.name || item.title || item.organization || '',
              site_type: (item.type || item.site_type || item.category || 'pantry').toLowerCase(),
              description: item.description || item.services || '',
              address: item.address || item.street || '',
              city: item.city || 'Houston',
              state: item.state || 'TX',
              zip_code: item.zip || item.zip_code || item.postal || '',
              latitude: parseFloat(item.lat || item.latitude || 0),
              longitude: parseFloat(item.lng || item.lon || item.longitude || 0),
              phone: item.phone || item.telephone || '',
              hours_of_operation: item.hours || item.schedule || null,
              requirements: item.requirements || item.eligibility || '',
              languages: item.languages || ['en'],
            });
          }
        } catch { /* parse error */ }
      }

      const ajaxUrls = html.match(/["'](https?:\/\/[^"']*(?:api|json|data|locations|partners|sites)[^"']*)["']/gi);
      if (ajaxUrls && sites.length === 0) {
        for (const urlMatch of ajaxUrls.slice(0, 3)) {
          const url = urlMatch.replace(/["']/g, '');
          try {
            const apiRes = await fetch(url, {
              headers: { 'User-Agent': 'TheChangeEngine/2.0' },
              signal: AbortSignal.timeout(8000),
            });
            if (apiRes.ok) {
              const ct = apiRes.headers.get('content-type') || '';
              if (ct.includes('json')) {
                const apiData = await apiRes.json();
                const items = Array.isArray(apiData) ? apiData : apiData.data || apiData.locations || apiData.results || [];
                for (const item of items) {
                  sites.push({
                    source_id: String(item.id || item.site_id || `hfb_ajax_${sites.length}`),
                    name: item.name || item.title || '',
                    site_type: (item.type || item.category || 'pantry').toLowerCase(),
                    description: item.description || '',
                    address: item.address || '',
                    city: item.city || 'Houston',
                    state: item.state || 'TX',
                    zip_code: item.zip || item.zip_code || '',
                    latitude: parseFloat(item.lat || item.latitude || 0),
                    longitude: parseFloat(item.lng || item.longitude || 0),
                    phone: item.phone || '',
                    hours_of_operation: item.hours || null,
                    requirements: item.requirements || '',
                    languages: ['en'],
                  });
                }
              }
            }
          } catch { /* skip failed endpoints */ }
        }
      }
    }
  } catch (err) {
    console.log('HFB map fetch failed:', (err as Error).message);
  }

  if (sites.length === 0) {
    try {
      const findFoodRes = await fetch('https://www.houstonfoodbank.org/find-help/find-food/', {
        headers: { 'User-Agent': 'TheChangeEngine/2.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (findFoodRes.ok) {
        const html = await findFoodRes.text();
        const mapIdMatch = html.match(/data-map=["']([^"']+)["']/);
        if (mapIdMatch) {
          const actions = ['hfb_maps_get_data', 'hfb_maps_get_locations', 'hfb_maps_locations', 'get_map_data'];
          for (const action of actions) {
            try {
              const ajaxRes = await fetch('https://www.houstonfoodbank.org/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=${action}&map_id=${mapIdMatch[1]}`,
                signal: AbortSignal.timeout(8000),
              });
              const text = await ajaxRes.text();
              if (text && text !== '0' && text.length > 10) {
                try {
                  const data = JSON.parse(text);
                  const items = Array.isArray(data) ? data : data.data || data.locations || [];
                  for (const item of items) {
                    sites.push({
                      source_id: String(item.id || `hfb_wp_${sites.length}`),
                      name: item.name || item.title || '',
                      site_type: (item.type || 'pantry').toLowerCase(),
                      description: item.description || '',
                      address: item.address || '',
                      city: item.city || 'Houston',
                      state: 'TX',
                      zip_code: item.zip || '',
                      latitude: parseFloat(item.lat || 0),
                      longitude: parseFloat(item.lng || 0),
                      phone: item.phone || '',
                      hours_of_operation: item.hours || null,
                      requirements: item.requirements || '',
                      languages: ['en'],
                    });
                  }
                  if (sites.length > 0) break;
                } catch { /* not JSON */ }
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.log('WP AJAX fetch failed:', (err as Error).message);
    }
  }

  return sites;
}

// ---- ADAPTER: Generic JSON Feed ----
async function fetchJsonFeed(url: string, fieldMap?: Record<string, string>): Promise<RawSite[]> {
  const sites: RawSite[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheChangeEngine/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return sites;
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.data || data.locations || data.results || data.features || [];

    const isGeoJson = items[0]?.type === 'Feature' || items[0]?.geometry;

    for (const raw of items) {
      const item = isGeoJson ? { ...raw.properties, latitude: raw.geometry?.coordinates?.[1], longitude: raw.geometry?.coordinates?.[0] } : raw;
      const fm = fieldMap || {};

      sites.push({
        source_id: String(item[fm.id || 'id'] || item.site_id || `json_${sites.length}`),
        name: item[fm.name || 'name'] || item.title || item.organization || '',
        site_type: (item[fm.type || 'type'] || item.category || item.site_type || 'pantry').toLowerCase(),
        description: item[fm.description || 'description'] || item.services || '',
        address: item[fm.address || 'address'] || item.street || item.street_address || '',
        city: item[fm.city || 'city'] || '',
        state: item[fm.state || 'state'] || 'TX',
        zip_code: String(item[fm.zip || 'zip'] || item.zip_code || item.postal_code || ''),
        latitude: parseFloat(item[fm.lat || 'latitude'] || item.lat || 0),
        longitude: parseFloat(item[fm.lng || 'longitude'] || item.lng || item.lon || 0),
        phone: item[fm.phone || 'phone'] || item.telephone || '',
        hours_of_operation: item[fm.hours || 'hours'] || item.schedule || item.hours_of_operation || null,
        requirements: item[fm.requirements || 'requirements'] || item.eligibility || '',
        languages: item.languages || ['en'],
      });
    }
  } catch (err) {
    console.error('JSON feed error:', err);
  }
  return sites;
}

// ---- ADAPTER: CSV/Spreadsheet ----
function parseCsvSites(csvText: string, fieldMap: Record<string, number>): RawSite[] {
  const sites: RawSite[] = [];
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return sites;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    sites.push({
      source_id: cols[fieldMap.id ?? 0] || `csv_${i}`,
      name: cols[fieldMap.name ?? 1] || '',
      site_type: (cols[fieldMap.type ?? 2] || 'pantry').toLowerCase(),
      description: cols[fieldMap.description ?? 3] || '',
      address: cols[fieldMap.address ?? 4] || '',
      city: cols[fieldMap.city ?? 5] || '',
      state: cols[fieldMap.state ?? 6] || 'TX',
      zip_code: cols[fieldMap.zip ?? 7] || '',
      latitude: parseFloat(cols[fieldMap.lat ?? 8] || '0'),
      longitude: parseFloat(cols[fieldMap.lng ?? 9] || '0'),
      phone: cols[fieldMap.phone ?? 10] || '',
      requirements: cols[fieldMap.requirements ?? 11] || '',
      languages: ['en'],
    });
  }
  return sites;
}

// ---- ADAPTER: WordPress Events (Tribe Events API) ----
async function fetchWpEvents(baseUrl: string): Promise<RawSite[]> {
  const sites: RawSite[] = [];
  try {
    const res = await fetch(`${baseUrl}/wp-json/tribe/events/v1/events?per_page=50&start_date=now`, {
      headers: { 'User-Agent': 'TheChangeEngine/2.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return sites;
    const data = await res.json();
    for (const ev of (data.events || [])) {
      if (!ev.venue?.address) continue;
      sites.push({
        source_id: `event_${ev.id}`,
        name: ev.title || '',
        site_type: 'event',
        description: (ev.description || '').replace(/<[^>]+>/g, '').substring(0, 500),
        address: ev.venue?.address || '',
        city: ev.venue?.city || '',
        state: ev.venue?.state || 'TX',
        zip_code: ev.venue?.zip || '',
        latitude: parseFloat(ev.venue?.geo_lat || 0),
        longitude: parseFloat(ev.venue?.geo_lng || 0),
        phone: '',
        hours_of_operation: { event_date: ev.start_date, end_date: ev.end_date },
        requirements: ev.cost || '',
        languages: ['en'],
      });
    }
  } catch (err) {
    console.error('WP events error:', err);
  }
  return sites;
}

// ============================================
// MAIN SYNC HANDLER
// ============================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    const orgId: string = body.org_id;
    const source: string = body.source || 'auto';
    const classifyWithAi: boolean = body.classify !== false;
    const dryRun: boolean = body.dry_run === true;

    const feedUrl: string = body.feed_url || '';
    const fieldMap: any = body.field_map || {};
    const csvData: string = body.csv_data || '';
    const manualSites: any[] = body.sites || [];

    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const orgs = await db(`organizations?org_id=eq.${orgId}&select=org_id,org_name,website`);
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ error: `Org ${orgId} not found` }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const org = orgs[0];

    let rawSites: RawSite[] = [];
    let sourceLabel = source;

    switch (source) {
      case 'hfb_map':
        rawSites = await fetchHfbMapSites();
        sourceLabel = 'hfb_map';
        break;

      case 'json_feed':
        if (!feedUrl) return new Response(JSON.stringify({ error: 'feed_url required for json_feed source' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
        rawSites = await fetchJsonFeed(feedUrl, fieldMap);
        sourceLabel = 'json_feed';
        break;

      case 'csv':
        if (!csvData) return new Response(JSON.stringify({ error: 'csv_data required for csv source' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
        rawSites = parseCsvSites(csvData, fieldMap);
        sourceLabel = 'csv';
        break;

      case 'wp_events':
        rawSites = await fetchWpEvents(org.website || feedUrl);
        sourceLabel = 'wp_events';
        break;

      case 'manual':
        rawSites = manualSites.map((s: any, i: number) => ({
          source_id: s.source_id || `manual_${i}`,
          name: s.name || '',
          site_type: s.site_type || 'pantry',
          description: s.description || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || 'TX',
          zip_code: s.zip_code || '',
          latitude: s.latitude || 0,
          longitude: s.longitude || 0,
          phone: s.phone || '',
          hours_of_operation: s.hours_of_operation || null,
          requirements: s.requirements || '',
          languages: s.languages || ['en'],
        }));
        sourceLabel = 'manual';
        break;

      case 'auto':
      default:
        const dataFeeds = (await db(`organizations?org_id=eq.${orgId}&select=data_feeds`))?.[0]?.data_feeds || {};

        if (orgId === 'ORG_001' || org.website?.includes('houstonfoodbank')) {
          rawSites = await fetchHfbMapSites();
          sourceLabel = 'hfb_map';
        }

        if (rawSites.length === 0 && dataFeeds.locations_json) {
          rawSites = await fetchJsonFeed(dataFeeds.locations_json);
          sourceLabel = 'json_feed';
        }

        if (rawSites.length === 0 && org.website) {
          rawSites = await fetchWpEvents(org.website);
          sourceLabel = 'wp_events';
        }
        break;
    }

    rawSites = rawSites.filter(s => s.name && (s.address || (s.latitude && s.longitude)));

    let taxonomy: any = null;
    if (classifyWithAi && rawSites.length > 0) {
      taxonomy = await loadTaxonomy();
    }

    const results: any[] = [];
    let created = 0;
    let updated = 0;
    let classified = 0;
    let errors = 0;

    for (let i = 0; i < rawSites.length; i++) {
      const raw = rawSites[i];
      const siteId = `${orgId}_${sourceLabel}_${raw.source_id}`.substring(0, 100);

      let aiTags: any = null;
      if (taxonomy && classifyWithAi) {
        aiTags = await classifySite({
          name: raw.name,
          type: raw.site_type,
          description: raw.description,
          requirements: raw.requirements,
        }, taxonomy);
        if (aiTags) classified++;

        if (i < rawSites.length - 1) await sleep(3000);
      }

      const siteRecord = {
        site_id: siteId,
        org_id: orgId,
        site_name: raw.name,
        site_type: raw.site_type,
        description: raw.description,
        address: raw.address,
        city: raw.city,
        state: raw.state,
        zip_code: raw.zip_code,
        latitude: raw.latitude || null,
        longitude: raw.longitude || null,
        phone: raw.phone || null,
        hours_of_operation: typeof raw.hours_of_operation === 'string'
          ? JSON.parse(raw.hours_of_operation)
          : raw.hours_of_operation,
        requirements: raw.requirements || null,
        languages: raw.languages || ['en'],
        focus_area_ids: aiTags?.focus_area_ids || null,
        audience_segment_ids: aiTags?.audience_segment_ids || null,
        life_situation_ids: aiTags?.life_situation_ids || null,
        resource_type_id: aiTags?.resource_type_id || 'RTYPE_21',
        data_source: sourceLabel,
        source_id: raw.source_id,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      };

      if (dryRun) {
        results.push({ action: 'preview', site: siteRecord });
      } else {
        const existing = await db(`distribution_sites?site_id=eq.${encodeURIComponent(siteId)}&select=site_id`);
        if (existing && existing.length > 0) {
          const upd = await db(`distribution_sites?site_id=eq.${encodeURIComponent(siteId)}`, 'PATCH', siteRecord);
          if (upd) { updated++; results.push({ action: 'updated', site_id: siteId, name: raw.name }); }
          else { errors++; results.push({ action: 'error', site_id: siteId, name: raw.name }); }
        } else {
          const ins = await upsertSite(siteRecord);
          if (ins) { created++; results.push({ action: 'created', site_id: siteId, name: raw.name }); }
          else { errors++; results.push({ action: 'error', site_id: siteId, name: raw.name }); }
        }
      }
    }

    await logSync(orgId, sourceLabel, rawSites.length > 0 ? 'success' : 'no_data',
      `Sync: ${created} created, ${updated} updated, ${classified} AI-classified, ${errors} errors from ${sourceLabel}`,
      rawSites.length
    );

    return new Response(JSON.stringify({
      success: true,
      org_id: orgId,
      org_name: org.org_name,
      source: sourceLabel,
      dry_run: dryRun,
      total_fetched: rawSites.length,
      created,
      updated,
      ai_classified: classified,
      errors,
      results,
      message: rawSites.length === 0
        ? `No sites found from ${sourceLabel}. The data source may be unavailable or require different access. Try: json_feed with a direct URL, csv with inline data, manual with site objects, or wp_events.`
        : `Synced ${rawSites.length} sites for ${org.org_name}`,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
