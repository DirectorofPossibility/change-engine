/**
 * @fileoverview Translated urgency section header for the help page.
 *
 * Client component that renders urgency-level headings with translated
 * labels via {@link useTranslation}.
 */
'use client'

import { useTranslation } from '@/lib/i18n'

/** Maps urgency levels to their i18n key and Tailwind color classes. */
const URGENCY_CONFIG: Record<string, { key: string; color: string }> = {
  Critical: { key: 'help.urgency_critical', color: 'text-red-700 border-red-300 bg-red-50' },
  High:     { key: 'help.urgency_high', color: 'text-orange-700 border-orange-300 bg-orange-50' },
  Medium:   { key: 'help.urgency_medium', color: 'text-yellow-700 border-yellow-300 bg-yellow-50' },
  Low:      { key: 'help.urgency_low', color: 'text-green-700 border-green-300 bg-green-50' },
}

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
