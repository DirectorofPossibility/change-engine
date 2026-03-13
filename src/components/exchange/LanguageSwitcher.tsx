'use client'

import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LANGUAGES } from '@/lib/constants'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-paper px-1 py-0.5">
      {LANGUAGES.map(function (l) {
        return (
          <button
            key={l.code}
            onClick={function () { setLanguage(l.code) }}
            aria-label={l.name}
            className={'text-xs px-2 py-1 transition-colors ' + (
              language === l.code
                ? 'bg-blue text-white'
                : 'text-muted hover:text-ink'
            )}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
