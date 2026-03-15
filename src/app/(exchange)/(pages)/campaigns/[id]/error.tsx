'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-[1080px] mx-auto px-6 py-20">
      <p
        className="font-mono uppercase tracking-[0.2em] mb-3"
        style={{ fontSize: '0.875rem', color: '#5c6474' }}
      >
        {t('error.label')}
      </p>
      <h1
        className="font-display mb-4"
        style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0d1117' }}
      >
        {t('error.heading')}
      </h1>
      <p
        className="font-body mb-8 max-w-lg"
        style={{ fontSize: '0.95rem', color: '#5c6474', lineHeight: 1.65 }}
      >
        {error.message || t('error.description')}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="font-mono uppercase tracking-[0.1em] px-6 py-3 transition-opacity hover:opacity-80"
          style={{ fontSize: '0.875rem', background: '#0d1117', color: '#ffffff' }}
        >
          {t('error.retry')}
        </button>
        <Link
          href="/exchange"
          className="font-mono uppercase tracking-[0.1em] px-6 py-3 transition-colors hover:bg-[#f4f5f7]"
          style={{ fontSize: '0.875rem', color: '#0d1117', border: '1px solid #dde1e8' }}
        >
          {t('error.back')}
        </Link>
      </div>
    </div>
  )
}
