/**
 * Server-side point-in-polygon lookups against local GeoJSON boundary files.
 * Used by /api/geocode to resolve an address's lat/lng into district IDs.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

interface GeoFeature {
  type: string
  properties: Record<string, unknown>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoCollection {
  type: string
  features: GeoFeature[]
}

// In-memory cache — GeoJSON files are loaded once per cold start
const geoCache: Record<string, GeoCollection> = {}

function loadGeoJson(filename: string): GeoCollection {
  if (geoCache[filename]) return geoCache[filename]
  const filePath = join(process.cwd(), 'public', 'geo', filename)
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))
  geoCache[filename] = data
  return data
}

/** Ray-casting algorithm for point-in-polygon on a single ring. */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInGeometry(lng: number, lat: number, geometry: GeoFeature['geometry']): boolean {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][]
    return pointInRing(lng, lat, coords[0])
  }
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][]
    return coords.some(function (polygon) { return pointInRing(lng, lat, polygon[0]) })
  }
  return false
}

function findDistrict(lng: number, lat: number, filename: string, idProperty: string): string | null {
  try {
    const geo = loadGeoJson(filename)
    for (const feature of geo.features) {
      if (pointInGeometry(lng, lat, feature.geometry)) {
        const val = feature.properties[idProperty]
        return val != null ? String(val) : null
      }
    }
  } catch {
    // GeoJSON file missing or malformed — return null
  }
  return null
}

export interface ResolvedDistricts {
  councilDistrict: string | null
  congressionalDistrict: string | null
  stateHouseDistrict: string | null
  stateSenateDistrict: string | null
  superNeighborhood: string | null
  superNeighborhoodName: string | null
  tirzZone: string | null
  tirzZoneName: string | null
}

/** Resolve a lat/lng point against all available boundary layers. */
export function resolveAllDistricts(lng: number, lat: number): ResolvedDistricts {
  // Super neighborhoods — also grab the name
  let superNeighborhood: string | null = null
  let superNeighborhoodName: string | null = null
  try {
    const snGeo = loadGeoJson('super-neighborhoods.geojson')
    for (const feature of snGeo.features) {
      if (pointInGeometry(lng, lat, feature.geometry)) {
        superNeighborhood = String(feature.properties.SN_ID ?? '')
        superNeighborhoodName = String(feature.properties.SN_NAME ?? '')
        break
      }
    }
  } catch {
    // ignore
  }

  // TIRZ zones — also grab the name
  let tirzZone: string | null = null
  let tirzZoneName: string | null = null
  try {
    const tirzGeo = loadGeoJson('tirz-zones.geojson')
    for (const feature of tirzGeo.features) {
      if (pointInGeometry(lng, lat, feature.geometry)) {
        const siteNo = feature.properties.SITENO
        tirzZone = siteNo != null ? String(siteNo) : null
        tirzZoneName = String(feature.properties.NAME ?? '')
        break
      }
    }
  } catch {
    // ignore
  }

  return {
    councilDistrict: findDistrict(lng, lat, 'council-districts.geojson', 'DISTRICT'),
    congressionalDistrict: findDistrict(lng, lat, 'congressional-districts.geojson', 'CD'),
    stateHouseDistrict: findDistrict(lng, lat, 'state-house-districts.geojson', 'HD'),
    stateSenateDistrict: findDistrict(lng, lat, 'state-senate-districts.geojson', 'SD'),
    superNeighborhood,
    superNeighborhoodName,
    tirzZone,
    tirzZoneName,
  }
}
