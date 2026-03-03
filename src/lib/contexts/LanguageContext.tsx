'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupportedLanguage, TranslationMap } from '@/lib/types/exchange'
import { LANGUAGES } from '@/lib/constants'

interface LanguageContextValue {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  translations: TranslationMap
  loadTranslations: (inboxIds: string[]) => Promise<void>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang?: string
  children: ReactNode
}) {
  let validLang: SupportedLanguage = 'en'
  if (initialLang === 'es' || initialLang === 'vi') validLang = initialLang

  const [language, setLangState] = useState<SupportedLanguage>(validLang)
  const [translations, setTranslations] = useState<TranslationMap>({})
  const [isLoading, setIsLoading] = useState(false)

  const setLanguage = useCallback(function (lang: SupportedLanguage) {
    setLangState(lang)
    document.cookie = 'lang=' + lang + ';path=/;max-age=31536000'
    if (lang === 'en') {
      setTranslations({})
    }
  }, [])

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

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
