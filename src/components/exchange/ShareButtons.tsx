'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  url?: string
  title?: string
  compact?: boolean
}

export function ShareButtons({ url, title, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : '')

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(function () {
      setCopied(true)
      setTimeout(function () { setCopied(false) }, 2000)
    })
  }

  const btnClass = compact
    ? 'w-8 h-8 rounded-lg flex items-center justify-center border-2 border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text transition-colors'
    : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-brand-border text-[12px] font-medium text-brand-muted hover:text-brand-text hover:border-brand-text transition-colors'

  return (
    <div className="flex items-center gap-1.5">
      {/* X / Twitter */}
      <a
        href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareTitle) + '&url=' + encodeURIComponent(shareUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Share on X"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        {!compact && <span>Share</span>}
      </a>

      {/* Facebook */}
      <a
        href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Share on Facebook"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        {!compact && <span>Share</span>}
      </a>

      {/* Copy link */}
      <button
        onClick={copyLink}
        className={btnClass}
        aria-label="Copy link"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        )}
        {!compact && <span>{copied ? 'Copied' : 'Copy'}</span>}
      </button>
    </div>
  )
}
