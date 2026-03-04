/**
 * Three-tier auth helper for Supabase Edge Functions.
 *
 * Roles (highest → lowest):
 *   service_role  — internal calls using SUPABASE_SERVICE_ROLE_KEY or sb_secret_* keys
 *   partner       — authenticated users with profiles.role = 'partner'
 *   neighbor      — authenticated users (default role)
 *   anon          — no valid token
 */

export type CallerRole = 'service_role' | 'partner' | 'neighbor' | 'anon';

export interface AuthResult {
  role: CallerRole;
  userId: string | null;
}

/**
 * Determine the caller's role from the request's Authorization header.
 *
 * 1. If the Bearer token matches SUPABASE_SERVICE_ROLE_KEY → service_role
 * 2. If the token is a new-format secret key (sb_secret_*) → verify via PostgREST RPC
 * 3. If it's a valid JWT → look up profiles.role for partner/neighbor
 * 4. Otherwise → anon
 */
export async function getCallerRole(req: Request): Promise<AuthResult> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  // No token → anonymous
  if (!token) return { role: 'anon', userId: null };

  // Legacy JWT service role key → full access
  if (token === SERVICE_KEY) return { role: 'service_role', userId: null };

  // Also check CUSTOM_SERVICE_KEY (set via Supabase Secrets dashboard)
  const customKey = Deno.env.get('CUSTOM_SERVICE_KEY');
  if (customKey && token === customKey) return { role: 'service_role', userId: null };

  // New-format secret key (sb_secret_*) → verify role via PostgREST RPC.
  // Kong translates sb_secret_* keys to the appropriate JWT before reaching PostgREST,
  // so the verify_caller_role() function returns the effective role.
  if (token.startsWith('sb_secret_')) {
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_caller_role`, {
        method: 'POST',
        headers: {
          'apikey': token,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (rpcRes.ok) {
        const role = await rpcRes.json();
        if (role === 'service_role') return { role: 'service_role', userId: null };
      }
    } catch {
      // Fall through to JWT verification
    }
  }

  // JWT → verify with Supabase Auth
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SERVICE_KEY,
      },
    });

    if (!userRes.ok) return { role: 'anon', userId: null };

    const user = await userRes.json();
    if (!user?.id) return { role: 'anon', userId: null };

    // Look up role from profiles table
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=role&user_id=eq.${user.id}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
        },
      }
    );

    if (!profileRes.ok) return { role: 'neighbor', userId: user.id };

    const profiles = await profileRes.json();
    const role = profiles?.[0]?.role === 'partner' ? 'partner' : 'neighbor';

    return { role, userId: user.id };
  } catch {
    return { role: 'anon', userId: null };
  }
}

/**
 * Returns a 403 Response if the caller does not have one of the allowed roles.
 * Returns null if authorized.
 */
export function requireRole(
  caller: AuthResult,
  allowed: CallerRole[]
): Response | null {
  if (allowed.includes(caller.role)) return null;

  return new Response(
    JSON.stringify({
      error: 'Forbidden',
      message: `This endpoint requires one of: ${allowed.join(', ')}. Your role: ${caller.role}`,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
