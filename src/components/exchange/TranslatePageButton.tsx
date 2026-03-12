'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface TranslatePageButtonProps {
  /** Whether the page has already been translated by the cron job */
  isTranslated: boolean
  /** The content type for the translate API */
  contentType: string
  /** The content ID for translation lookup */
  contentId: string
}

export function TranslatePageButton({ isTranslated, contentType, contentId }: TranslatePageButtonProps) {
  const { t, lang } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(isTranslated ? 'done' : 'idle')

  // Only show for non-English languages
  if (lang === 'en') return null

  // Already translated by cron
  if (status === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5">
        <Globe size={13} />
        {t('wayfinder.translated')}
      </div>
    )
  }

  async function handleTranslate() {
    setStatus('loading')
    try {
      const res = await fetch('/api/translate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, lang }),
      })
      if (res.ok) {
        setStatus('done')
        // Reload to show translated content
        window.location.reload()
      } else {
        setStatus('idle')
      }
    } catch {
      setStatus('idle')
    }
  }

  return (
    <button
      onClick={handleTranslate}
      disabled={status === 'loading'}
      className="flex items-center gap-1.5 text-xs text-brand-accent bg-brand-bg px-3 py-1.5 hover:bg-brand-bg-alt transition-colors disabled:opacity-50"
    >
      <Globe size={13} className={status === 'loading' ? 'animate-spin' : ''} />
      {status === 'loading' ? t('wayfinder.translating') : t('wayfinder.translate_page')}
    </button>
  )
}
