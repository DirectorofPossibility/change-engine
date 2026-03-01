const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ValidateResult {
  valid: boolean;
  keyId?: string;
  orgId?: string | null;
  label?: string;
  error?: string;
  status?: number;
}

export async function validateApiKey(
  req: Request,
  itemCount: number,
): Promise<ValidateResult> {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return { valid: false, error: 'Missing X-API-Key header', status: 401 };
  }

  // SHA-256 hash the key
  const encoded = new TextEncoder().encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Look up key by hash
  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${keyHash}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  const keys = await lookupRes.json();
  if (!keys.length) {
    return { valid: false, error: 'Invalid API key', status: 401 };
  }

  const key = keys[0];

  // Check active
  if (!key.is_active) {
    return { valid: false, error: 'API key has been revoked', status: 403 };
  }

  // Check expiration
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired', status: 403 };
  }

  // Check daily usage
  const now = new Date();
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();

  const usageRes = await fetch(
    `${SUPABASE_URL}/rest/v1/api_key_usage?api_key_id=eq.${key.id}&window_start=eq.${windowStart}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  const usageRows = await usageRes.json();
  const currentCount = usageRows.length ? usageRows[0].request_count : 0;

  if (currentCount >= key.rate_limit_per_day) {
    return {
      valid: false,
      error: `Daily rate limit exceeded (${key.rate_limit_per_day}/day)`,
      status: 429,
    };
  }

  // Upsert usage row
  if (usageRows.length) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/api_key_usage?id=eq.${usageRows[0].id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          request_count: currentCount + 1,
          item_count: (usageRows[0].item_count || 0) + itemCount,
        }),
      },
    );
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/api_key_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        api_key_id: key.id,
        window_start: windowStart,
        request_count: 1,
        item_count: itemCount,
      }),
    });
  }

  // Update api_keys counters
  await fetch(`${SUPABASE_URL}/rest/v1/api_keys?id=eq.${key.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      last_used_at: now.toISOString(),
      total_requests: (key.total_requests || 0) + 1,
      total_items: (key.total_items || 0) + itemCount,
    }),
  });

  return {
    valid: true,
    keyId: key.id,
    orgId: key.org_id,
    label: key.label,
  };
}
