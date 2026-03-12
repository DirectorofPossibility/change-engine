/**
 * @fileoverview Next.js middleware for Supabase auth session management.
 *
 * Runs on every request that matches the `config.matcher` patterns
 * (`/dashboard/*` and `/me/*`). The middleware:
 *
 * 1. Creates a Supabase server client backed by request cookies so that the
 *    auth session is refreshed transparently on each navigation.
 * 2. Calls `supabase.auth.getUser()` to verify the session.
 * 3. Redirects unauthenticated users to `/login` with a `redirect` search
 *    param so they can be returned to the originally requested page.
 */

// ── Imports ──

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRouteEnabled } from '@/lib/feature-flags'

// ── Middleware ──

/**
 * Next.js middleware function that refreshes Supabase auth sessions and
 * protects authenticated routes.
 *
 * @param request - The incoming Next.js request object.
 * @returns The (possibly cookie-updated) response, or a redirect to `/login`.
 */
export async function middleware(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname

  // Look up profile for authenticated users (needed for role checks + feature flag bypass)
  let profileData: { account_status?: string; role?: string } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_status, role')
      .eq('auth_id', user.id)
      .single()
    profileData = profile as { account_status?: string; role?: string } | null
  }

  const isAdmin = profileData?.role === 'admin'

  // Feature flag gate — admins bypass, others redirect to /coming-soon
  if (!isAdmin && !isRouteEnabled(pathname) && pathname !== '/coming-soon') {
    const comingSoonUrl = request.nextUrl.clone()
    comingSoonUrl.pathname = '/coming-soon'
    comingSoonUrl.search = ''
    return NextResponse.redirect(comingSoonUrl)
  }

  // Logged-in users hitting splash → send to exchange editorial home
  if (pathname === '/' && user) {
    const exchangeUrl = request.nextUrl.clone()
    exchangeUrl.pathname = '/exchange'
    return NextResponse.redirect(exchangeUrl)
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect user profile routes
  if (pathname.startsWith('/me') && !user) {
    const meLoginUrl = request.nextUrl.clone()
    meLoginUrl.pathname = '/login'
    meLoginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(meLoginUrl)
  }

  // Check account status and role for authenticated users
  if (user && !pathname.startsWith('/account-locked')) {
    if (profileData?.account_status === 'locked') {
      const lockedUrl = request.nextUrl.clone()
      lockedUrl.pathname = '/account-locked'
      lockedUrl.search = ''
      return NextResponse.redirect(lockedUrl)
    }

    // Enforce role-based access for /dashboard routes
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

// ── Route Matcher ──

/**
 * Next.js middleware configuration. Only requests whose pathnames match
 * these patterns will invoke the {@link middleware} function.
 */
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /api/* (API routes handle their own auth)
     * - Static assets (images, geo, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/|images/|geo/).*)',
  ],
}
