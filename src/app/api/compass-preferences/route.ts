import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { themes, archetype } = body as { themes?: string[]; archetype?: string }

  const cookieStore = await cookies()

  if (themes && themes.length > 0) {
    cookieStore.set('compass_themes', themes.join(','), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  if (archetype) {
    cookieStore.set('archetype', archetype, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return NextResponse.json({ ok: true })
}
