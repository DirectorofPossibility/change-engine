/**
 * @fileoverview Translated section headers and labels for the elections page.
 */
'use client'

import { useTranslation } from '@/lib/use-translation'

/** Translated section heading for election listing sections. */
export function ElectionSectionHeader({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return <h2 className="text-xl font-bold text-brand-text mb-4">{t(titleKey)}</h2>
}

/** Translated turnout label. */
export function TurnoutLabel({ pct }: { pct: number }) {
  const { t } = useTranslation()
  return <p className="text-xs text-brand-muted mt-1">{t('elections.turnout')} {pct}%</p>
}

/** Translated "Results certified" badge. */
export function CertifiedBadge() {
  const { t } = useTranslation()
  return <span className="text-xs text-green-600">{t('elections.results_certified')}</span>
}
