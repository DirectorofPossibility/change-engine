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
    <div className="mb-8 space-y-3">
      <div className="bg-red-50 border border-red-300 p-4">
        <p className="text-sm text-red-700 font-semibold mb-1">{t('help.emergency')}</p>
        <p className="text-sm text-red-600">
          <a href="tel:911" className="font-bold underline">{t('help.crisis_911')}</a> &bull;{' '}
          <a href="tel:988" className="font-bold underline">{t('help.crisis_988')}</a> &bull;{' '}
          <a href="tel:1-800-799-7233" className="font-bold underline">{t('help.crisis_dv')}</a>
        </p>
      </div>
      <div className="bg-paper border border-rule p-4 flex flex-wrap gap-6">
        <div>
          <p className="font-mono text-micro uppercase tracking-wider text-faint">City Services</p>
          <a href="tel:311" className="font-display text-lg font-bold text-ink hover:text-blue transition-colors">311</a>
        </div>
        <div>
          <p className="font-mono text-micro uppercase tracking-wider text-faint">Social Services</p>
          <a href="tel:211" className="font-display text-lg font-bold text-ink hover:text-blue transition-colors">211</a>
        </div>
        <div>
          <p className="font-mono text-micro uppercase tracking-wider text-faint">DV Hotline</p>
          <a href="tel:713-528-2121" className="font-display text-lg font-bold text-ink hover:text-blue transition-colors">713-528-2121</a>
        </div>
      </div>
    </div>
  )
}
