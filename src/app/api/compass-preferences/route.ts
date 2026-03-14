import { NextRequest, NextResponse } from 'next/server'

const VALID_THEMES = ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_04', 'THEME_05', 'THEME_06', 'THEME_07']
const VALID_ARCHETYPES = ['connector', 'advocate', 'helper', 'learner', 'builder']

export async function POST(req: NextRequest) {
  let body: { themes?: string[]; archetype?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { themes, archetype } = body

  // Validate themes
  if (themes && (!Array.isArray(themes) || themes.some(t => !VALID_THEMES.includes(t)))) {
    return NextResponse.json({ error: 'Invalid themes' }, { status: 400 })
  }

  // Validate archetype
  if (archetype && !VALID_ARCHETYPES.includes(archetype)) {
    return NextResponse.json({ error: 'Invalid archetype' }, { status: 400 })
  }

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
