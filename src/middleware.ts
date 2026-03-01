import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  var supabaseResponse = NextResponse.next({ request })

  var supabase = createServerClient(
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

  var { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    var loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect user profile routes
  if (request.nextUrl.pathname.startsWith('/me') && !user) {
    var meLoginUrl = request.nextUrl.clone()
    meLoginUrl.pathname = '/login'
    meLoginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(meLoginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/me/:path*'],
}
