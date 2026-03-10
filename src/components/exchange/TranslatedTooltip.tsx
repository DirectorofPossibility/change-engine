'use client'

import { InfoBubble } from './InfoBubble'
import { useTranslation } from '@/lib/use-translation'
import type { TooltipDef } from '@/lib/tooltips'

/**
 * InfoBubble that resolves tooltip text via i18n.
 * Drop-in replacement for `<InfoBubble id={tip.id} text={tip.text} />`.
 */
export function TranslatedTooltip({
  tip,
  position = 'bottom',
  align,
}: {
  tip: TooltipDef
  position?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'center' | 'start' | 'end'
}) {
  const { t } = useTranslation()
  return <InfoBubble id={tip.id} text={t(tip.i18nKey)} position={position} align={align} />
}
