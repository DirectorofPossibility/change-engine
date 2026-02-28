'use client'

import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LANGUAGES } from '@/lib/constants'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-brand-bg rounded-full px-1 py-0.5">
      {LANGUAGES.map(function (l) {
        return (
          <button
            key={l.code}
            onClick={function () { setLanguage(l.code) }}
            className={'text-xs px-2 py-1 rounded-full transition-colors ' + (
              language === l.code
                ? 'bg-brand-accent text-white'
                : 'text-brand-muted hover:text-brand-text'
            )}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
