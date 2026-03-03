/**
 * @fileoverview Server-side Supabase client factory.
 *
 * Creates a Supabase client intended for use in Server Components, Server
 * Actions, and Route Handlers. Authentication state is derived from the
 * Next.js cookie store so that RLS policies apply to the current user.
 */

// ── Imports ──

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// ── Factory ──

/**
 * Creates and returns a typed Supabase client for server-side usage.
 *
 * The client reads and writes auth tokens via the Next.js `cookies()`
 * helper, keeping the session in sync with the browser. The `setAll`
 * callback is wrapped in a try/catch because it may be called from a
 * Server Component where cookies are read-only.
 *
 * @returns A `SupabaseClient<Database>` bound to the current request cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
