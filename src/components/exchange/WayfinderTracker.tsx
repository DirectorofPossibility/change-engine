'use client'

import { useEffect } from 'react'
import { trackWayfinderEvent } from '@/lib/wayfinder-analytics'

interface WayfinderTrackerProps {
  entityType: string
  entityId: string
}

/**
 * Drop-in component for detail pages that fires a single `detail_view` event on mount.
 * Renders nothing visible.
 */
export function WayfinderTracker({ entityType, entityId }: WayfinderTrackerProps) {
  useEffect(function () {
    trackWayfinderEvent('detail_view', { entity_type: entityType, entity_id: entityId })
  }, [entityType, entityId])

  return null
}
