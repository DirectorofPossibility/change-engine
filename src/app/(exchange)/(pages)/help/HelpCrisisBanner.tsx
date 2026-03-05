/**
 * @fileoverview Translated crisis resource banner for the help page.
 *
 * Client component that renders the emergency hotline banner with
 * translated labels via {@link useTranslation}.
 */
'use client'

import { useTranslation } from '@/lib/use-translation'

/**
 * Crisis resource banner showing emergency phone numbers with translated labels.
 */
export function HelpCrisisBanner() {
  const { t } = useTranslation()

  return (
    <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-8">
      <p className="text-sm text-red-700 font-semibold mb-1">{t('help.emergency')}</p>
      <p className="text-sm text-red-600">
        <a href="tel:911" className="font-bold underline">{t('help.crisis_911')}</a> &bull;{' '}
        <a href="tel:988" className="font-bold underline">{t('help.crisis_988')}</a> &bull;{' '}
        <a href="tel:1-800-799-7233" className="font-bold underline">{t('help.crisis_dv')}</a>
      </p>
    </div>
  )
}
