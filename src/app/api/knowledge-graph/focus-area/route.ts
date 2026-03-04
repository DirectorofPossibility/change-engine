import { NextRequest, NextResponse } from 'next/server'
import { getFocusAreaDrillDown } from '@/lib/data/exchange'

export async function GET(request: NextRequest) {
  const focusId = request.nextUrl.searchParams.get('id')
  if (!focusId) {
    return NextResponse.json({ error: 'Missing focus area ID' }, { status: 400 })
  }

  const data = await getFocusAreaDrillDown(focusId)
  return NextResponse.json(data)
}
