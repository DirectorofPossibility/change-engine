/**
 * Server-side point-in-polygon lookups against local GeoJSON boundary files.
 * Used by /api/geocode to resolve an address's lat/lng into district IDs.
 *
 * City-aware: GeoJSON files are organized under /public/geo/{citySlug}/.
 * Defaults to 'houston' when no city is specified for backward compatibility.
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

function loadGeoJson(filename: string, citySlug: string = 'houston'): GeoCollection {
  const cacheKey = `${citySlug}/${filename}`
  if (geoCache[cacheKey]) return geoCache[cacheKey]
  const filePath = join(process.cwd(), 'public', 'geo', citySlug, filename)
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))
  geoCache[cacheKey] = data
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

function findDistrict(lng: number, lat: number, filename: string, idProperty: string, citySlug: string = 'houston'): string | null {
  try {
    const geo = loadGeoJson(filename, citySlug)
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

/**
 * Resolve a lat/lng point against all available boundary layers.
 * @param lng - Longitude
 * @param lat - Latitude
 * @param citySlug - City subfolder under /public/geo/ (default: 'houston')
 */
export function resolveAllDistricts(lng: number, lat: number, citySlug: string = 'houston'): ResolvedDistricts {
  // Super neighborhoods — also grab the name
  let superNeighborhood: string | null = null
  let superNeighborhoodName: string | null = null
  try {
    const snGeo = loadGeoJson('super-neighborhoods.geojson', citySlug)
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
    const tirzGeo = loadGeoJson('tirz-zones.geojson', citySlug)
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
    councilDistrict: findDistrict(lng, lat, 'council-districts.geojson', 'DISTRICT', citySlug),
    congressionalDistrict: findDistrict(lng, lat, 'congressional-districts.geojson', 'CD', citySlug),
    stateHouseDistrict: findDistrict(lng, lat, 'state-house-districts.geojson', 'HD', citySlug),
    stateSenateDistrict: findDistrict(lng, lat, 'state-senate-districts.geojson', 'SD', citySlug),
    superNeighborhood,
    superNeighborhoodName,
    tirzZone,
    tirzZoneName,
  }
}
