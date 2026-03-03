/**
 * @fileoverview Client-side language and translation context provider.
 *
 * Manages the active language (en / es / vi), fetches translations from the
 * Supabase `translations` table on demand, and exposes them to the component
 * tree via React context. Wrap any page that needs i18n support in
 * `<LanguageProvider>`.
 */

'use client'

// ── Imports ──

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupportedLanguage, TranslationMap } from '@/lib/types/exchange'
import { LANGUAGES } from '@/lib/constants'

// ── Types ──

interface LanguageContextValue {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  translations: TranslationMap
  loadTranslations: (inboxIds: string[]) => Promise<void>
  isLoading: boolean
}

// ── Context ──

const LanguageContext = createContext<LanguageContextValue | null>(null)

// ── Provider ──

/**
 * Provides language state and translation data to child components.
 *
 * On mount the active language is derived from `initialLang` (falling back to
 * `'en'`). When the language is changed via `setLanguage`, a cookie is set so
 * the preference persists across page loads. Translations are loaded lazily
 * through `loadTranslations` and are *merged* into the existing map -- they
 * are never replaced wholesale.
 *
 * @param props.initialLang - Optional initial language code read from cookies or URL.
 * @param props.children    - React children that may consume the context.
 */
export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang?: string
  children: ReactNode
}) {
  let validLang: SupportedLanguage = 'en'
  if (initialLang === 'es' || initialLang === 'vi') validLang = initialLang

  const router = useRouter()
  const [language, setLangState] = useState<SupportedLanguage>(validLang)
  const [translations, setTranslations] = useState<TranslationMap>({})
  const [isLoading, setIsLoading] = useState(false)

  const setLanguage = useCallback(function (lang: SupportedLanguage) {
    setLangState(lang)
    document.cookie = 'lang=' + lang + ';path=/;max-age=31536000'
    if (lang === 'en') {
      setTranslations({})
    }
    router.refresh()
  }, [router])

  const loadTranslations = useCallback(async function (inboxIds: string[]) {
    if (language === 'en' || inboxIds.length === 0) {
      return
    }
    const langConfig = LANGUAGES.find(function (l) { return l.code === language })
    if (!langConfig || !langConfig.langId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('translations')
        .select('*')
        .in('content_id', inboxIds)
        .eq('language_id', langConfig.langId)

      const map: TranslationMap = {}
      if (data) {
        data.forEach(function (t) {
          if (!t.content_id) return
          if (!map[t.content_id]) map[t.content_id] = {}
          if (t.field_name === 'title' || t.field_name === 'title_6th_grade') map[t.content_id].title = t.translated_text ?? undefined
          if (t.field_name === 'summary' || t.field_name === 'summary_6th_grade') map[t.content_id].summary = t.translated_text ?? undefined
        })
      }
      setTranslations(function (prev) { return Object.assign({}, prev, map) })
    } finally {
      setIsLoading(false)
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, loadTranslations, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ── Hook ──

/**
 * Convenience hook to consume the {@link LanguageContext}.
 *
 * Must be called inside a `<LanguageProvider>` -- throws if the context is
 * missing.
 *
 * @returns The current language, translation map, and helper functions.
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
