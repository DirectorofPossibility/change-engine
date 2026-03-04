/**
 * @fileoverview Entity detail endpoint for the Map View drawer.
 *
 * Fetches full classification data (pathways, focus areas, SDGs) for a single
 * entity. Called when a user clicks a map marker to open the detail drawer.
 *
 * GET /api/map-markers/detail?type=organization&id=ORG_123
 * GET /api/map-markers/detail?type=service&id=SVC_456
 * GET /api/map-markers/detail?type=official&id=OFF_789
 */

import { NextResponse } from 'next/server'

const VALID_ENTITY_TYPES = ['organization', 'service', 'official'] as const
type EntityType = (typeof VALID_ENTITY_TYPES)[number]

/** Junction table config keyed by entity type. */
const JUNCTION_CONFIG: Record<EntityType, {
  pathwayTable: string; pathwayIdCol: string
  focusAreaTable: string; focusAreaIdCol: string
}> = {
  organization: {
    pathwayTable: 'organization_pathways', pathwayIdCol: 'org_id',
    focusAreaTable: 'organization_focus_areas', focusAreaIdCol: 'org_id',
  },
  service: {
    pathwayTable: 'service_pathways', pathwayIdCol: 'service_id',
    focusAreaTable: 'service_focus_areas', focusAreaIdCol: 'service_id',
  },
  official: {
    pathwayTable: 'official_pathways', pathwayIdCol: 'official_id',
    focusAreaTable: 'official_focus_areas', focusAreaIdCol: 'official_id',
  },
}

async function restQuery(table: string, params: string): Promise<unknown[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const res = await fetch(url + '/rest/v1/' + table + '?' + params, {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
  })
  return res.ok ? res.json() : []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('type') as EntityType | null
  const entityId = searchParams.get('id')

  if (!entityType || !entityId || !VALID_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json(
      { error: 'Missing or invalid type/id. Valid types: ' + VALID_ENTITY_TYPES.join(', ') },
      { status: 400 }
    )
  }

  const config = JUNCTION_CONFIG[entityType]

  // Fetch pathways and focus area IDs in parallel
  const [pathwayRows, focusAreaRows] = await Promise.all([
    restQuery(
      config.pathwayTable,
      config.pathwayIdCol + '=eq.' + entityId + '&select=theme_id,is_primary'
    ) as Promise<Array<{ theme_id: string; is_primary: boolean }>>,
    restQuery(
      config.focusAreaTable,
      config.focusAreaIdCol + '=eq.' + entityId + '&select=focus_area_id'
    ) as Promise<Array<{ focus_area_id: string }>>,
  ])

  // Build pathways list
  const pathways: Array<{ themeId: string; isPrimary: boolean }> = pathwayRows.map(function (r) {
    return { themeId: r.theme_id, isPrimary: r.is_primary === true }
  })

  // Fetch focus area names
  const focusAreaIds = focusAreaRows.map(function (r) { return r.focus_area_id })
  let focusAreas: Array<{ id: string; name: string }> = []

  if (focusAreaIds.length > 0) {
    const faData = await restQuery(
      'focus_areas',
      'focus_area_id=in.(' + focusAreaIds.join(',') + ')&select=focus_area_id,name'
    ) as Array<{ focus_area_id: string; name: string }>
    focusAreas = faData.map(function (fa) {
      return { id: fa.focus_area_id, name: fa.name }
    })
  }

  return NextResponse.json({
    pathways,
    focusAreas,
  })
}
