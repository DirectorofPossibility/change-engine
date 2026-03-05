/**
 * @fileoverview Circular stats badge component for The Change Engine.
 *
 * Displays a single statistic (number + label) inside a circular badge
 * with ring/border treatment using brand colors. Used in the homepage
 * stats bar section to showcase platform-wide metrics with a circle motif.
 */

'use client'

import { useTranslation } from '@/lib/use-translation'

interface StatsCircleProps {
  /** The numeric value to display prominently inside the circle. */
  value: number
  /** i18n key for the label (e.g., 'home.stats_resources'). */
  labelKey: string
  /** Optional accent color for the ring. Defaults to brand accent. */
  accentColor?: string
}

/**
 * Circular badge displaying a formatted stat number with a label.
 *
 * Features a double-ring treatment: an outer colored ring and an inner
 * white-on-dark circle. Numbers are locale-formatted for readability.
 *
 * @param props - {@link StatsCircleProps}
 */
export function StatsCircle({ value, labelKey, accentColor }: StatsCircleProps) {
  const { t } = useTranslation()
  const ringColor = accentColor || '#C75B2A'

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center
                   border-4 shadow-lg"
        style={{ borderColor: ringColor, backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <span className="text-2xl sm:text-3xl font-bold text-white leading-none">
          {value.toLocaleString()}
        </span>
      </div>
      <span className="text-sm text-gray-300 font-medium">{t(labelKey)}</span>
    </div>
  )
}
