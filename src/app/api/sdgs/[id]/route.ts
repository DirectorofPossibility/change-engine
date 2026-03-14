import { NextRequest, NextResponse } from 'next/server'
import { getSDGEntities } from '@/lib/data/taxonomy'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const entities = await getSDGEntities(params.id)
  return NextResponse.json(entities)
}
