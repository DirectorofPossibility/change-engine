'use client'

import { InfoBubble } from './InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'
import { useTranslation } from '@/lib/use-translation'

export function WayfinderTooltip({ tipKey }: { tipKey: keyof typeof TOOLTIPS }) {
  const tip = TOOLTIPS[tipKey]
  const { t } = useTranslation()
  if (!tip) return null
  return <InfoBubble id={tip.id} text={t(tip.i18nKey)} position={tip.section === 'detail' ? 'bottom' : 'bottom'} />
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
  const { t } = useTranslation()
  if (!tip) return null
  return <InfoBubble id={tip.id} text={t(tip.i18nKey)} position={position} />
}
