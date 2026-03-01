import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCallerRole, requireRole } from '../_shared/auth.ts';
import { CORS } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function supabaseGet(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function supabasePost(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function supabasePatch(table: string, params: string, body: Record<string, unknown>) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
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
    // Get all auto_approved items from review queue
    const queue = await supabaseGet(
      'content_review_queue',
      'review_status=eq.auto_approved&select=id,inbox_id,ai_classification,confidence'
    );

    if (!Array.isArray(queue) || queue.length === 0) {
      return new Response(JSON.stringify({ message: 'No items ready to publish', count: 0 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Get corresponding inbox items
    const inboxIds = queue.map((q: { inbox_id: string }) => q.inbox_id);
    const inbox = await supabaseGet(
      'content_inbox',
      `id=in.(${inboxIds.join(',')})&select=id,source_url,source_domain,title,description,image_url`
    );

    const inboxMap: Record<string, Record<string, unknown>> = {};
    if (Array.isArray(inbox)) {
      inbox.forEach((item: Record<string, unknown>) => {
        inboxMap[item.id as string] = item;
      });
    }

    // Check which items are already published (avoid duplicates)
    const existingPublished = await supabaseGet(
      'content_published',
      `inbox_id=in.(${inboxIds.join(',')})&select=inbox_id`
    );
    const alreadyPublished = new Set(
      Array.isArray(existingPublished)
        ? existingPublished.map((p: { inbox_id: string }) => p.inbox_id)
        : []
    );

    let published = 0;
    let skipped = 0;
    const results: Array<{ inbox_id: string; title: string; pathway: string }> = [];

    for (const item of queue) {
      if (alreadyPublished.has(item.inbox_id)) {
        skipped++;
        continue;
      }

      const c = item.ai_classification;
      const inboxItem = inboxMap[item.inbox_id] || {};
      const isV2 = c._version === 'v2-full-matrix' || !!c.theme_primary;

      let publishData: Record<string, unknown>;

      if (isV2) {
        // v2 classifications use taxonomy code IDs directly
        const actions = c.action_items || {};
        publishData = {
          inbox_id: item.inbox_id,
          source_url: (inboxItem.source_url as string) || '',
          source_domain: (inboxItem.source_domain as string) || '',
          image_url: (inboxItem.image_url as string) || null,
          resource_type: c.resource_type_id || null,
          pathway_primary: c.theme_primary,
          pathway_secondary: c.theme_secondary || [],
          focus_area_ids: c.focus_area_ids || [],
          center: c.center || 'Resource',
          sdg_ids: c.sdg_ids || [],
          sdoh_domain: c.sdoh_code || null,
          audience_segments: c.audience_segment_ids || [],
          life_situations: c.life_situation_ids || [],
          geographic_scope: c.geographic_scope || 'Houston',
          title_6th_grade: c.title_6th_grade || (inboxItem.title as string) || 'Untitled',
          summary_6th_grade: c.summary_6th_grade || (inboxItem.description as string) || '',
          action_donate: actions.donate_url || null,
          action_volunteer: actions.volunteer_url || null,
          action_signup: actions.signup_url || null,
          action_register: actions.register_url || null,
          action_apply: actions.apply_url || null,
          action_call: actions.phone || null,
          action_attend: actions.attend_url || null,
          confidence: c.confidence ?? item.confidence,
          classification_reasoning: c.reasoning || '',
          is_featured: false,
          is_active: true,
        };
      } else {
        // v1 classifications use human-readable names that need mapping
        const pathwayMap: Record<string, string> = {
          'Our Health': 'T1',
          'Our Families': 'T2',
          'Our Neighborhood': 'T3',
          'Our Voice': 'T4',
          'Our Money': 'T5',
          'Our Planet': 'T6',
          'The Bigger We': 'T7',
        };
        const engagementMap: Record<string, string> = {
          'Learn': 'On the Couch',
          'Act': 'Off the Couch',
          'Lead': 'Use Your Superpower',
        };

        publishData = {
          inbox_id: item.inbox_id,
          source_url: (inboxItem.source_url as string) || '',
          source_domain: (inboxItem.source_domain as string) || '',
          image_url: (inboxItem.image_url as string) || null,
          resource_type: c.resource_type || 'Government Resource',
          pathway_primary: pathwayMap[c.pathway] || 'T3',
          pathway_secondary: (c.pathway_secondary || []).map(
            (p: string) => pathwayMap[p]
          ).filter(Boolean),
          focus_area_ids: c.focus_areas || [],
          center: c.engagement_level === 'Learn' ? 'Learning'
            : c.engagement_level === 'Lead' ? 'Action' : 'Resource',
          engagement_level: engagementMap[c.engagement_level] || 'On the Couch',
          sdg_ids: (c.sdg_ids || []).map((id: string) => `SDG-${id}`),
          sdoh_domain: c.sdoh_domain || null,
          audience_segments: c.audience_segments || [],
          geographic_scope: 'Houston Metro',
          title_6th_grade: c.title_6th_grade || (inboxItem.title as string) || 'Untitled',
          summary_6th_grade: c.summary_6th_grade || (inboxItem.description as string) || '',
          confidence: item.confidence,
          classification_reasoning: c.reasoning || '',
          is_featured: false,
          is_active: true,
        };

        // v1 action fields are flat on the classification
        for (const field of ['action_donate', 'action_volunteer', 'action_signup',
          'action_register', 'action_apply', 'action_call', 'action_attend']) {
          if (c[field]) publishData[field] = c[field];
        }
      }

      try {
        await supabasePost('content_published', publishData);

        // Update inbox status
        await supabasePatch(
          'content_inbox',
          `id=eq.${item.inbox_id}`,
          { status: 'published' }
        );

        // Update review queue status
        await supabasePatch(
          'content_review_queue',
          `id=eq.${item.id}`,
          { review_status: 'published' }
        );

        published++;
        results.push({
          inbox_id: item.inbox_id,
          title: c.title_6th_grade || 'Untitled',
          pathway: isV2 ? c.theme_primary : c.pathway,
        });

        // Fire-and-forget: translate the published item to ES and VI
        try {
          fetch(`${SUPABASE_URL}/functions/v1/translate-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              inbox_id: item.inbox_id,
              languages: ['es', 'vi'],
              mode: 'single',
            }),
          }).catch(function (e) {
            console.error(`Auto-translate fire-and-forget error for ${item.inbox_id}:`, e);
          });
        } catch { /* ignore translation errors — publishing is the priority */ }
      } catch (e) {
        console.error(`Publish error for ${item.inbox_id}:`, e);
      }
    }

    // Log the publish run
    await supabasePost('ingestion_log', {
      event_type: 'publish_batch',
      source: 'publish-content',
      status: 'success',
      message: `Published ${published} items, skipped ${skipped} duplicates.`,
      item_count: published,
    });

    return new Response(JSON.stringify({
      success: true,
      published,
      skipped,
      total_in_queue: queue.length,
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
