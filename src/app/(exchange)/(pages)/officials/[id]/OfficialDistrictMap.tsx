'use client'

import { InteractiveMap } from '@/components/maps'
import { GEO_LAYERS } from '@/lib/constants'

interface OfficialDistrictMapProps {
  districtType: string | null
  districtId: string | null
}

/** Maps district_type values to GEO_LAYERS keys and their feature ID properties. */
function getLayerConfig(districtType: string | null): { layerKey: string; featureId: string } | null {
  if (!districtType) return null
  const dt = districtType.toLowerCase()
  if (dt.includes('congressional')) return { layerKey: 'congressionalDistricts', featureId: '' }
  if (dt.includes('senate')) return { layerKey: 'stateSenate', featureId: '' }
  if (dt.includes('house')) return { layerKey: 'stateHouse', featureId: '' }
  if (dt.includes('council')) return { layerKey: 'councilDistricts', featureId: '' }
  return null
}

/** Extract the numeric/short district ID for matching against GeoJSON feature properties. */
function extractFeatureId(districtId: string | null, districtType: string | null): string {
  if (!districtId) return ''
  // Congressional districts: "TX-7" → "7", "TX-18" → "18"
  if (districtType?.toLowerCase().includes('congressional')) {
    const match = districtId.match(/(\d+)$/)
    return match ? match[1] : districtId
  }
  // State senate: "SD-15" → "15"
  if (districtType?.toLowerCase().includes('senate')) {
    const match = districtId.match(/(\d+)$/)
    return match ? match[1] : districtId
  }
  // State house: "HD-134" → "134"
  if (districtType?.toLowerCase().includes('house')) {
    const match = districtId.match(/(\d+)$/)
    return match ? match[1] : districtId
  }
  // Council districts: "A", "B", etc. or numbers
  return districtId
}

export function OfficialDistrictMap({ districtType, districtId }: OfficialDistrictMapProps) {
  const layerConfig = getLayerConfig(districtType)
  if (!layerConfig) return null

  const layer = GEO_LAYERS[layerConfig.layerKey]
  if (!layer) return null

  const featureId = extractFeatureId(districtId, districtType)

  return (
    <InteractiveMap
      layers={[layer]}
      defaultVisibleLayers={[layer.id]}
      highlightLayerId={layer.id}
      highlightFeatureId={featureId}
      className="w-full h-[400px] rounded-xl"
    />
  )
}
