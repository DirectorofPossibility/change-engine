/**
 * @fileoverview Next.js middleware for auth + feature-flag gating.
 *
 * Performance-optimised: feature flags are checked BEFORE any Supabase
 * call.  The expensive auth round-trip only runs on protected routes
 * (/dashboard/*, /me/*).  Public pages that pass the feature-flag check
 * return immediately with zero network overhead.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRouteEnabled } from '@/lib/feature-flags'

/** Routes that require an authenticated Supabase session. */
const AUTH_PREFIXES = ['/dashboard', '/me']

function needsAuth(pathname: string): boolean {
  return AUTH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Feature-flag gate (no Supabase call needed for non-admins) ──
  // If the route is disabled and this isn't already /coming-soon, check
  // whether the user might be an admin before redirecting.  For visitors
  // without an auth cookie we can redirect immediately.
  if (!isRouteEnabled(pathname) && pathname !== '/coming-soon') {
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

    if (!hasAuthCookie) {
      // No auth cookie → definitely not an admin → redirect fast
      const comingSoonUrl = request.nextUrl.clone()
      comingSoonUrl.pathname = '/coming-soon'
      comingSoonUrl.search = ''
      return NextResponse.redirect(comingSoonUrl)
    }

    // Has auth cookie — need to check if admin (fall through to auth block below)
  }

  // ── Public routes that passed feature-flag check: return immediately ──
  if (!needsAuth(pathname)) {
    // For disabled routes with an auth cookie, we still need to check admin status
    if (isRouteEnabled(pathname)) {
      return NextResponse.next({ request })
    }
  }

  // ── Auth session refresh (only for protected routes or admin bypass check) ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(function ({ name, value }) {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(function ({ name, value, options }) {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Look up profile for authenticated users (role checks + feature flag bypass)
  let profileData: { account_status?: string; role?: string } | null = null
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('account_status, role')
        .eq('auth_id', user.id)
        .single()
      profileData = profile as { account_status?: string; role?: string } | null
    } catch {
      profileData = null
    }
  }

  const isAdmin = profileData?.role === 'admin'

  // Feature flag gate — admins bypass, others redirect to /coming-soon
  if (!isAdmin && !isRouteEnabled(pathname) && pathname !== '/coming-soon') {
    const comingSoonUrl = request.nextUrl.clone()
    comingSoonUrl.pathname = '/coming-soon'
    comingSoonUrl.search = ''
    return NextResponse.redirect(comingSoonUrl)
  }

  // Check account status and role for authenticated users
  if (user && !pathname.startsWith('/account-locked')) {
    if (profileData?.account_status === 'locked') {
      const lockedUrl = request.nextUrl.clone()
      lockedUrl.pathname = '/account-locked'
      lockedUrl.search = ''
      return NextResponse.redirect(lockedUrl)
    }

    if (pathname.startsWith('/dashboard')) {
      const role = profileData?.role || 'neighbor'
      if (role !== 'admin' && role !== 'partner' && role !== 'neighbor') {
        const meUrl = request.nextUrl.clone()
        meUrl.pathname = '/me'
        meUrl.search = ''
        return NextResponse.redirect(meUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all routes except static assets and API routes.
     * Feature-flag checks run first (no network call).
     * Supabase auth only fires for /dashboard/* and /me/* routes.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/|images/|geo/).*)',
  ],
}
