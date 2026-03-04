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
  TABLE_CONFIGS,
  type EntityType,
} from '../_shared/classifier.ts';

const SB = Deno.env.get('SUPABASE_URL')!;
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AK = Deno.env.get('ANTHROPIC_API_KEY')!;

async function db(p: string) {
  const r = await fetch(`${SB}/rest/v1/${p}`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } });
  return r.json();
}

async function patch(t: string, m: string, b: any) {
  await fetch(`${SB}/rest/v1/${t}?${m}`, {
    method: 'PATCH',
    headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(b),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Auth: require service_role or partner
  const caller = await getCallerRole(req);
  const denied = requireRole(caller, ['service_role', 'partner']);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));
    const table = body.table || 'organizations';
    const batch = Math.min(body.batch_size || 1, 5);
    const force = body.force === true;

    const cfg = TABLE_CONFIGS[table];
    if (!cfg) {
      return new Response(JSON.stringify({ error: `Unknown table: ${table}. Supported: ${Object.keys(TABLE_CONFIGS).join(', ')}` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch full 16-dimension taxonomy
    const taxonomy = await fetchFullTaxonomy(SB, SK);
    const systemPrompt = buildPromptForEntity(taxonomy, cfg.entityType);

    // Get unclassified entities
    const cols = [cfg.pk, cfg.nm, cfg.desc, ...cfg.extra, 'focus_area_ids', 'classification_v2'].join(',');
    let q = `${table}?select=${cols}&order=${cfg.pk}.asc&limit=${batch}`;
    if (!force) {
      q += '&classification_v2=is.null';
    }
    if (body.start_from) q += `&${cfg.pk}=gte.${encodeURIComponent(body.start_from)}`;
    if (body.ids && Array.isArray(body.ids)) q += `&${cfg.pk}=in.(${body.ids.map((id: string) => encodeURIComponent(id)).join(',')})`;

    const items = await db(q);
    if (!items || !items.length) {
      return new Response(JSON.stringify({ success: true, message: `All ${table} classified!` }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const item of items) {
      const id = item[cfg.pk];
      const name = item[cfg.nm] || '?';

      // Skip if already v4-unified unless force
      if (!force && item.classification_v2?._version === 'v4-unified') {
        results.push({ id, name, status: 'skipped', reason: 'already v4' });
        continue;
      }

      try {
        // Build context from all available columns
        const parts = [`Name: ${name}`];
        if (item[cfg.desc]) parts.push(`Description: ${item[cfg.desc]}`);
        for (const c of cfg.extra) {
          if (item[c]) parts.push(`${c}: ${String(item[c]).substring(0, 200)}`);
        }
        if (item.focus_area_ids) parts.push(`Current focus areas: ${item.focus_area_ids}`);

        // Entity-type-specific instructions
        if (cfg.entityType === 'policy') {
          parts.push('IMPORTANT: Write title_6th_grade and summary_6th_grade at 6th-grade level. Write impact_statement (2-3 sentences) in asset-based language about how this connects to daily life.');
        }

        const userContent = parts.join('\n') + `\nReturn JSON with all classification fields: theme_primary, theme_secondary, focus_area_ids, sdg_ids, sdoh_code, ntee_codes, airs_codes, center, resource_type_id, audience_segment_ids, life_situation_ids, service_cat_ids, skill_ids, action_type_ids, gov_level_id, keywords, geographic_scope, title_6th_grade, summary_6th_grade, confidence, reasoning`;

        const maxTokens = cfg.entityType === 'policy' ? 1200 : 1000;
        const rawText = await callClaude(systemPrompt, userContent, AK, maxTokens);
        const raw = parseClaudeJson(rawText);
        const enriched = validateAndEnrich(raw, taxonomy);

        // Patch the entity row
        const patchBody: any = {
          classification_v2: enriched,
          focus_area_ids: (enriched.focus_area_ids || []).join(','),
        };
        if (enriched.title_6th_grade) patchBody.title_6th_grade = enriched.title_6th_grade;
        if (enriched.summary_6th_grade) patchBody.summary_6th_grade = enriched.summary_6th_grade;
        if (enriched.theme_primary) patchBody.theme_id = enriched.theme_primary;
        if (enriched.center) patchBody.engagement_level = enriched.center;
        if (cfg.entityType === 'policy' && enriched.impact_statement) {
          patchBody.impact_statement = enriched.impact_statement;
        }

        await patch(table, `${cfg.pk}=eq.${id}`, patchBody);

        // Populate ALL junction tables (SDGs, audiences, situations, pathways, etc.)
        await populateAllJunctions(cfg.entityType, id, enriched, SB, SK);

        results.push({
          id, name, status: 'done',
          confidence: enriched.confidence,
          focus_areas: enriched.focus_area_ids.length,
          sdgs: enriched.sdg_ids.length,
          audiences: (enriched.audience_segment_ids || []).length,
        });
      } catch (err) {
        results.push({ id, name, status: 'error', error: (err as Error).message });
      }

      // Rate limit between API calls
      await new Promise(r => setTimeout(r, 1000));
    }

    // Progress stats
    const tot = await db(`${table}?select=${cfg.pk}&limit=1000`);
    const dn = await db(`${table}?select=${cfg.pk}&classification_v2=not.is.null&limit=1000`);
    const v4 = await db(`${table}?select=${cfg.pk}&classification_v2->>_version=eq.v4-unified&limit=1000`);

    return new Response(JSON.stringify({
      success: true,
      table,
      version: 'v4-unified',
      model: 'claude-sonnet-4',
      classified: results.filter(r => r.status === 'done').length,
      errors: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      progress: {
        done: dn?.length || 0,
        v4_done: v4?.length || 0,
        total: tot?.length || 0,
        remaining: (tot?.length || 0) - (dn?.length || 0),
        percent: Math.round(((dn?.length || 0) / (tot?.length || 0)) * 100),
      },
      results,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
