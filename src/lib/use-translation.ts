'use client'

import { useLanguage } from '@/lib/contexts/LanguageContext'
import { dictionaries } from '@/lib/i18n'

/**
 * React hook returning a `t()` function that resolves UI string keys
 * against the current language from LanguageContext.
 */
export function useTranslation() {
  const { language } = useLanguage()
  function t(key: string): string {
    return dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key
  }
  return { t }
}
