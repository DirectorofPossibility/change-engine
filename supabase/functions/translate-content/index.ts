import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LANGUAGE_MAP: Record<string, { name: string; code: string; id: string }> = {
  es: { name: 'Spanish', code: 'es', id: 'LANG-ES' },
  vi: { name: 'Vietnamese', code: 'vi', id: 'LANG-VI' },
};

const SYSTEM_PROMPT = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.

Your job is to translate civic content that has already been simplified to a 6th-grade reading level in English.

CRITICAL RULES:
1. Maintain the 6th-grade reading level in the target language — use simple, everyday words.
2. Keep the same tone: warm, helpful, community-focused.
3. Do NOT add or remove information. Translate what's there.
4. For civic/government terms, use the commonly understood terms in the Houston community (e.g., "condado" not "municipio" for county in Spanish for Houston).
5. Keep proper nouns (organization names, place names) in their original form.
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

async function supabaseGet(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { inbox_id, languages = ['es', 'vi'], mode = 'single' } = await req.json();

    // MODE: 'batch' — translate all auto_approved items not yet translated
    if (mode === 'batch') {
      const queue = await supabaseGet(
        'content_review_queue',
        'review_status=eq.auto_approved&select=inbox_id,ai_classification'
      );

      if (!Array.isArray(queue) || queue.length === 0) {
        return new Response(JSON.stringify({ message: 'No items to translate', count: 0 }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      let translated = 0;
      let errors = 0;

      for (const item of queue) {
        const classification = item.ai_classification;
        if (!classification?.title_6th_grade) continue;

        for (const langCode of languages) {
          // Check if translation already exists
          const existing = await supabaseGet(
            'translations',
            `content_id=eq.${item.inbox_id}&language_id=eq.${LANGUAGE_MAP[langCode].id}&field_name=eq.title_6th_grade`
          );

          if (Array.isArray(existing) && existing.length > 0) continue;

          try {
            const result = await translateText(
              classification.title_6th_grade,
              classification.summary_6th_grade || '',
              langCode
            );

            // Store title translation
            await supabasePost('translations', {
              translation_id: `TR-${item.inbox_id.substring(0, 8)}-${langCode}-title`,
              content_type: 'content_published',
              content_id: item.inbox_id,
              field_name: 'title_6th_grade',
              language_id: LANGUAGE_MAP[langCode].id,
              translated_text: result.title,
              is_verified: 'No',
              machine_translated: 'Yes',
              data_source: 'Claude API',
              last_updated: new Date().toISOString(),
            });

            // Store summary translation
            await supabasePost('translations', {
              translation_id: `TR-${item.inbox_id.substring(0, 8)}-${langCode}-summary`,
              content_type: 'content_published',
              content_id: item.inbox_id,
              field_name: 'summary_6th_grade',
              language_id: LANGUAGE_MAP[langCode].id,
              translated_text: result.summary,
              is_verified: 'No',
              machine_translated: 'Yes',
              data_source: 'Claude API',
              last_updated: new Date().toISOString(),
            });

            translated++;
          } catch (e) {
            console.error(`Translation error for ${item.inbox_id} (${langCode}):`, e);
            errors++;
          }
        }
      }

      // Log the batch
      await supabasePost('ingestion_log', {
        event_type: 'translate_batch',
        source: 'translate-content',
        status: errors > 0 ? 'partial' : 'success',
        message: `Translated ${translated} items across ${languages.join(',')}. ${errors} errors.`,
        item_count: translated,
      });

      return new Response(JSON.stringify({
        success: true,
        translated,
        errors,
        languages,
        items_processed: queue.length,
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // MODE: 'single' — translate one specific item
    if (!inbox_id) {
      return new Response(JSON.stringify({ error: 'Provide inbox_id or use mode=batch' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Get the classification for this item
    const queueItems = await supabaseGet(
      'content_review_queue',
      `inbox_id=eq.${inbox_id}&select=ai_classification`
    );

    if (!Array.isArray(queueItems) || queueItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Item not found in review queue' }), {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const classification = queueItems[0].ai_classification;
    const results: Record<string, { title: string; summary: string }> = {};

    for (const langCode of languages) {
      const result = await translateText(
        classification.title_6th_grade,
        classification.summary_6th_grade || '',
        langCode
      );

      results[langCode] = result;

      // Store translations
      await supabasePost('translations', {
        translation_id: `TR-${inbox_id.substring(0, 8)}-${langCode}-title`,
        content_type: 'content_published',
        content_id: inbox_id,
        field_name: 'title_6th_grade',
        language_id: LANGUAGE_MAP[langCode].id,
        translated_text: result.title,
        is_verified: 'No',
        machine_translated: 'Yes',
        data_source: 'Claude API',
        last_updated: new Date().toISOString(),
      });

      await supabasePost('translations', {
        translation_id: `TR-${inbox_id.substring(0, 8)}-${langCode}-summary`,
        content_type: 'content_published',
        content_id: inbox_id,
        field_name: 'summary_6th_grade',
        language_id: LANGUAGE_MAP[langCode].id,
        translated_text: result.summary,
        is_verified: 'No',
        machine_translated: 'Yes',
        data_source: 'Claude API',
        last_updated: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      inbox_id,
      translations: results,
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
