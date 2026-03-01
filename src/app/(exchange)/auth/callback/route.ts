import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  var { searchParams, origin } = new URL(request.url)
  var code = searchParams.get('code')
  var next = searchParams.get('next') ?? '/me'

  if (code) {
    var supabase = await createClient()
    var { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(origin + next)
    }
  }

  return NextResponse.redirect(origin + '/login?error=auth')
}
