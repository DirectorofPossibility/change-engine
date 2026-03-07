'use client'

import { InfoBubble } from './InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'

export function WayfinderTooltip({ tipKey }: { tipKey: keyof typeof TOOLTIPS }) {
  const tip = TOOLTIPS[tipKey]
  if (!tip) return null
  return <InfoBubble id={tip.id} text={tip.text} position={tip.section === 'detail' ? 'bottom' : 'bottom'} />
}

/** Variant with explicit position override */
export function WayfinderTooltipPos({
  tipKey,
  position,
}: {
  tipKey: keyof typeof TOOLTIPS
  position: 'top' | 'bottom' | 'left' | 'right'
}) {
  const tip = TOOLTIPS[tipKey]
  if (!tip) return null
  return <InfoBubble id={tip.id} text={tip.text} position={position} />
}
