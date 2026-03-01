import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LANGUAGE_MAP: Record<string, { name: string; id: string }> = {
  es: { name: 'Spanish', id: 'LANG-ES' },
  vi: { name: 'Vietnamese', id: 'LANG-VI' },
};

// Table configs: which columns to read and what field_name to store
const TABLE_CONFIGS: Record<string, {
  idCol: string;
  nameCol: string;
  descCol: string;
  contentType: string;
  selectCols: string;
  activeFilter?: { col: string; val: string };
}> = {
  content_published: {
    idCol: 'inbox_id',
    nameCol: 'title_6th_grade',
    descCol: 'summary_6th_grade',
    contentType: 'content_published',
    selectCols: 'inbox_id,title_6th_grade,summary_6th_grade',
    activeFilter: { col: 'is_active', val: 'true' },
  },
  services_211: {
    idCol: 'service_id',
    nameCol: 'service_name',
    descCol: 'description_5th_grade',
    contentType: 'services_211',
    selectCols: 'service_id,service_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  policies: {
    idCol: 'policy_id',
    nameCol: 'policy_name',
    descCol: 'summary_5th_grade',
    contentType: 'policies',
    selectCols: 'policy_id,policy_name,summary_5th_grade',
  },
  opportunities: {
    idCol: 'opportunity_id',
    nameCol: 'opportunity_name',
    descCol: 'description_5th_grade',
    contentType: 'opportunities',
    selectCols: 'opportunity_id,opportunity_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  organizations: {
    idCol: 'org_id',
    nameCol: 'org_name',
    descCol: 'description_5th_grade',
    contentType: 'organizations',
    selectCols: 'org_id,org_name,description_5th_grade',
  },
  elected_officials: {
    idCol: 'official_id',
    nameCol: 'official_name',
    descCol: 'title',
    contentType: 'elected_officials',
    selectCols: 'official_id,official_name,title',
  },
  learning_paths: {
    idCol: 'path_id',
    nameCol: 'path_name',
    descCol: 'description_5th_grade',
    contentType: 'learning_paths',
    selectCols: 'path_id,path_name,description_5th_grade',
  },
  life_situations: {
    idCol: 'situation_id',
    nameCol: 'situation_name',
    descCol: 'description_5th_grade',
    contentType: 'life_situations',
    selectCols: 'situation_id,situation_name,description_5th_grade',
  },
};

const SYSTEM_PROMPT = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.

Your job is to translate civic content that has already been simplified to a 5th/6th-grade reading level in English.

CRITICAL RULES:
1. Maintain the reading level in the target language — use simple, everyday words.
2. Keep the same tone: warm, helpful, community-focused.
3. Do NOT add or remove information. Translate what's there.
4. For civic/government terms, use commonly understood terms in the Houston community.
5. Keep proper nouns (organization names, place names, people names) in their original form.
6. For Vietnamese, use standard Southern Vietnamese dialect common in Houston.

Respond with JSON only. No markdown, no backticks.`;

async function translateText(
  title: string,
  summary: string,
  langCode: string
): Promise<{ title: string; summary: string }> {
  const lang = LANGUAGE_MAP[langCode];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Translate the following to ${lang.name}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
      }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  return JSON.parse(text);
}

async function supabaseGet(path: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function supabasePost(table: string, body: Record<string, unknown>) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=translation_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const {
      tables = Object.keys(TABLE_CONFIGS),
      languages = ['es', 'vi'],
      limit = 50,
      offset = 0,
      dry_run = false,
    } = await req.json();

    let totalTranslated = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    const details: Record<string, { translated: number; skipped: number; errors: number }> = {};

    for (const tableName of tables) {
      const config = TABLE_CONFIGS[tableName];
      if (!config) {
        details[tableName] = { translated: 0, skipped: 0, errors: 0 };
        continue;
      }

      let queryParams = `select=${config.selectCols}&limit=${limit}&offset=${offset}`;
      if (config.activeFilter) {
        queryParams += `&${config.activeFilter.col}=eq.${config.activeFilter.val}`;
      }

      const rows = await supabaseGet(tableName, queryParams);
      if (!Array.isArray(rows)) {
        details[tableName] = { translated: 0, skipped: 0, errors: 0 };
        continue;
      }

      let translated = 0;
      let skipped = 0;
      let errors = 0;

      for (const row of rows) {
        const contentId = row[config.idCol];
        const titleText = row[config.nameCol] || '';
        const descText = row[config.descCol] || '';
        if (!contentId || !titleText) { skipped++; continue; }

        for (const langCode of languages) {
          const langInfo = LANGUAGE_MAP[langCode];
          if (!langInfo) continue;

          // Check if translation already exists
          const existing = await supabaseGet(
            'translations',
            `content_type=eq.${config.contentType}&content_id=eq.${contentId}&language_id=eq.${langInfo.id}&field_name=eq.title`
          );
          if (Array.isArray(existing) && existing.length > 0) {
            skipped++;
            continue;
          }

          if (dry_run) { translated++; continue; }

          try {
            const result = await translateText(titleText, descText, langCode);
            const idPrefix = String(contentId).substring(0, 8);

            // Store title
            await supabasePost('translations', {
              translation_id: `TR-${idPrefix}-${langCode}-title`,
              content_type: config.contentType,
              content_id: contentId,
              field_name: 'title',
              language_id: langInfo.id,
              translated_text: result.title,
              is_verified: 'No',
              machine_translated: 'Yes',
              data_source: 'Claude API',
              last_updated: new Date().toISOString(),
            });

            // Store summary
            if (result.summary) {
              await supabasePost('translations', {
                translation_id: `TR-${idPrefix}-${langCode}-summary`,
                content_type: config.contentType,
                content_id: contentId,
                field_name: 'summary',
                language_id: langInfo.id,
                translated_text: result.summary,
                is_verified: 'No',
                machine_translated: 'Yes',
                data_source: 'Claude API',
                last_updated: new Date().toISOString(),
              });
            }

            translated++;

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (e) {
            console.error(`Translation error for ${tableName}/${contentId} (${langCode}):`, e);
            errors++;
            if (errors === 1) {
              (details as any)._firstError = `${tableName}/${contentId}/${langCode}: ${(e as Error).message}`;
            }
          }
        }
      }

      details[tableName] = { translated, skipped, errors };
      totalTranslated += translated;
      totalSkipped += skipped;
      totalErrors += errors;
    }

    // Log the run
    if (!dry_run) {
      await supabasePost('ingestion_log', {
        event_type: 'translate_all',
        source: 'translate-all',
        status: totalErrors > 0 ? 'partial' : 'success',
        message: `Translated ${totalTranslated} items across ${tables.join(',')}. Skipped ${totalSkipped}. ${totalErrors} errors.`,
        item_count: totalTranslated,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      dry_run,
      total_translated: totalTranslated,
      total_skipped: totalSkipped,
      total_errors: totalErrors,
      languages,
      details,
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
