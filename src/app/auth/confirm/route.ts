/**
 * Handles Supabase email confirmation links (PKCE flow).
 *
 * Supabase sends confirmation emails with links like:
 *   {SITE_URL}/auth/confirm?token_hash=...&type=signup
 *
 * This route verifies the OTP token and redirects the user.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  let next = searchParams.get('next') ?? '/exchange'

  // Prevent open redirect
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/exchange'
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Verification failed — send to login with error
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
}
