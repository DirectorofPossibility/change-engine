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

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect user profile routes
  if (request.nextUrl.pathname.startsWith('/me') && !user) {
    const meLoginUrl = request.nextUrl.clone()
    meLoginUrl.pathname = '/login'
    meLoginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(meLoginUrl)
  }

  // Protect library routes (require login)
  if (request.nextUrl.pathname.startsWith('/library') && !user) {
    const libraryLoginUrl = request.nextUrl.clone()
    libraryLoginUrl.pathname = '/login'
    libraryLoginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(libraryLoginUrl)
  }

  // Check account status for authenticated users (skip for /account-locked itself)
  if (user && !request.nextUrl.pathname.startsWith('/account-locked')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_status')
      .eq('auth_id', user.id)
      .single()

    if ((profile as any)?.account_status === 'locked') {
      const lockedUrl = request.nextUrl.clone()
      lockedUrl.pathname = '/account-locked'
      lockedUrl.search = ''
      return NextResponse.redirect(lockedUrl)
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
  matcher: ['/dashboard/:path*', '/me/:path*', '/library/:path*', '/account-locked'],
}
