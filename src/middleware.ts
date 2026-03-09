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

  const pathname = request.nextUrl.pathname

  // Logged-in users hitting splash → send to exchange
  if (pathname === '/' && user) {
    const exchangeUrl = request.nextUrl.clone()
    exchangeUrl.pathname = '/compass'
    return NextResponse.redirect(exchangeUrl)
  }

  // Non-logged-in users hitting exchange pages → send to splash
  // Allow: /, /login, /signup, /reset-password, /goodthings, /api/*, /auth/*, static assets
  const publicPaths = ['/', '/login', '/signup', '/reset-password', '/goodthings', '/account-locked', '/accessibility', '/privacy', '/terms', '/about']
  const isPublicPath = publicPaths.some(function (p) { return pathname === p })
  const isPublicPrefix = pathname.startsWith('/api/') || pathname.startsWith('/auth/') || pathname.startsWith('/_next/') || pathname.startsWith('/goodthings/')
  if (!user && !isPublicPath && !isPublicPrefix && !pathname.startsWith('/dashboard') && !pathname.startsWith('/me')) {
    const splashUrl = request.nextUrl.clone()
    splashUrl.pathname = '/'
    splashUrl.search = ''
    return NextResponse.redirect(splashUrl)
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_status, role')
      .eq('auth_id', user.id)
      .single()

    if ((profile as any)?.account_status === 'locked') {
      const lockedUrl = request.nextUrl.clone()
      lockedUrl.pathname = '/account-locked'
      lockedUrl.search = ''
      return NextResponse.redirect(lockedUrl)
    }

    // Enforce role-based access for /dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const role = (profile as any)?.role || 'neighbor'
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
