'use client'

import { useEffect } from 'react'
import { logSpiralAction } from '@/lib/spiral'

interface SpiralTrackerProps {
  /** The action to log (e.g. 'read_article', 'view_official') */
  action: string
  /** Optional pathway ID */
  pathway?: string
}

/**
 * Invisible component that logs a spiral action when mounted.
 * Drop it into any page to track that the user visited.
 *
 * Example:
 *   <SpiralTracker action="read_article" pathway="THEME_01" />
 */
export function SpiralTracker({ action, pathway }: SpiralTrackerProps) {
  useEffect(function () {
    logSpiralAction(action, pathway)
  }, [action, pathway])

  return null
}
