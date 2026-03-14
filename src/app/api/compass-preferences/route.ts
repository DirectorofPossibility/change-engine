import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { themes, archetype } = body as { themes?: string[]; archetype?: string }

  const res = NextResponse.json({ ok: true })

  if (themes && themes.length > 0) {
    res.cookies.set('compass_themes', themes.join(','), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  if (archetype) {
    res.cookies.set('archetype', archetype, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return res
}
