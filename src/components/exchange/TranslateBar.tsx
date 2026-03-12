'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LANGUAGES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface TranslateBarProps {
  contentType?: string
  contentId?: string
  isTranslated?: boolean
}

export function TranslateBar({ contentType, contentId, isTranslated }: TranslateBarProps) {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  if (language === 'en') return null

  const langName = LANGUAGES.find(function (l) { return l.code === language })?.name || language

  return (
    <div className="w-full bg-brand-bg-alt border-b border-brand-border">
      <div className="max-w-[1080px] mx-auto px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            {t('translate.viewing_in')} {langName}
          </span>
          {contentType && contentId && !isTranslated && (
            <TranslateNowButton contentType={contentType} contentId={contentId} lang={language} t={t} />
          )}
          {isTranslated && (
            <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-brand-success/10 text-brand-success">
              {t('translate.translated')}
            </span>
          )}
        </div>
        <button
          onClick={function () { setLanguage('en') }}
          className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-accent transition-colors"
        >
          {t('translate.back_to_english')}
        </button>
      </div>
    </div>
  )
}

function TranslateNowButton({ contentType, contentId, lang, t }: { contentType: string; contentId: string; lang: string; t: (key: string) => string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleTranslate() {
    setStatus('loading')
    try {
      const res = await fetch('/api/translate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, lang }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('done')
      window.location.reload()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') return null

  return (
    <button
      onClick={handleTranslate}
      disabled={status === 'loading'}
      className="inline-block font-mono text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? t('translate.translating') : status === 'error' ? t('translate.retry') : t('translate.translate_now')}
    </button>
  )
}
