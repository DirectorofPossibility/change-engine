/**
 * @fileoverview Translated urgency section header for the help page.
 *
 * Client component that renders urgency-level headings with translated
 * labels via {@link useTranslation}.
 */
'use client'

import { useTranslation } from '@/lib/use-translation'
import { URGENCY_CONFIG } from '@/lib/constants'

interface HelpUrgencyHeaderProps {
  level: string
}

/**
 * Renders a colored urgency-level heading with a translated label.
 *
 * @param props.level - Urgency level key (Critical, High, Medium, Low).
 */
export function HelpUrgencyHeader({ level }: HelpUrgencyHeaderProps) {
  const { t } = useTranslation()
  const config = URGENCY_CONFIG[level]
  if (!config) return null

  return (
    <div className={`border rounded-lg px-4 py-2 mb-4 ${config.color}`}>
      <h2 className="font-semibold">{t(config.key)}</h2>
    </div>
  )
}
