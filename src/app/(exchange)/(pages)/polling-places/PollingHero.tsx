'use client'

import { useTranslation } from '@/lib/use-translation'

export function PollingHero() {
  const { t } = useTranslation()

  return (
    <div className="mb-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-2">
        {t('polling.hook')}
      </p>
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mb-2">
        {t('polling.title')}
      </h1>
      <p className="text-lg font-medium text-brand-text mb-4">
        {t('polling.subhead')}
      </p>
      <p className="text-brand-muted whitespace-pre-line mb-8">
        {t('polling.subtitle')}
      </p>
    </div>
  )
}
