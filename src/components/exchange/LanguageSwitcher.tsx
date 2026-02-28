'use client'

import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'vi', label: 'VI' },
]

export function LanguageSwitcher() {
  const [lang, setLang] = useState('en')

  function handleSwitch(code: string) {
    setLang(code)
    document.cookie = `lang=${code};path=/;max-age=31536000`
  }

  return (
    <div className="flex items-center gap-1 bg-brand-bg rounded-full px-1 py-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleSwitch(l.code)}
          className={`text-xs px-2 py-1 rounded-full transition-colors ${
            lang === l.code
              ? 'bg-brand-accent text-white'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
