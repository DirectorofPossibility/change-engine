/**
 * @fileoverview Translatable page header for listing pages.
 *
 * Replaces hardcoded `<h1>` + `<p>` patterns on listing pages with a
 * client component that reads UI strings from the i18n dictionary via
 * {@link useTranslation}.
 */
'use client'

import { useTranslation } from '@/lib/i18n'

interface PageHeaderProps {
  titleKey: string
  subtitleKey?: string
  /** Optional dynamic subtitle (overrides subtitleKey when provided). */
  subtitle?: string
}

/**
 * Renders a translated page heading and optional subtitle.
 *
 * @param props.titleKey - i18n dictionary key for the `<h1>` text.
 * @param props.subtitleKey - Optional i18n key for the `<p>` subtitle.
 * @param props.subtitle - Optional pre-built subtitle string (takes priority over subtitleKey).
 */
export function PageHeader({ titleKey, subtitleKey, subtitle }: PageHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="text-3xl font-bold text-brand-text mb-2">{t(titleKey)}</h1>
      {(subtitle || subtitleKey) && (
        <p className="text-brand-muted mb-8">
          {subtitle ?? t(subtitleKey!)}
        </p>
      )}
    </>
  )
}
