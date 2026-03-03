/**
 * @fileoverview Client-side Supabase browser client factory.
 *
 * Creates a Supabase client configured for use in browser (client-component)
 * code. The client uses the public anon key and relies on Supabase RLS
 * policies for data access control.
 */

// ── Imports ──

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// ── Factory ──

/**
 * Creates and returns a typed Supabase client for browser-side usage.
 *
 * Safe to call multiple times -- `@supabase/ssr` internally caches the
 * underlying client instance per origin.
 *
 * @returns A `SupabaseClient<Database>` configured with the project URL and
 *          public anon key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
