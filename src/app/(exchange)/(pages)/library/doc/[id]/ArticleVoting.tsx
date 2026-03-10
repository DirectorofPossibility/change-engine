'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface ArticleVotingProps {
  documentId: string
}

function getOrCreateSessionId(): string {
  const key = 'kb-vote-session'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function ArticleVoting({ documentId }: ArticleVotingProps) {
  const { t } = useTranslation()
  const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(null)
  const [counts, setCounts] = useState<{ helpful: number; not_helpful: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user already voted (stored in localStorage)
  useEffect(function () {
    const stored = localStorage.getItem('kb-vote-' + documentId)
    if (stored === 'helpful' || stored === 'not_helpful') {
      setVoted(stored)
      // Fetch current counts
      fetch('/api/library/vote?documentId=' + documentId)
        .then(function (r) { return r.json() })
        .then(function (data) { setCounts(data) })
        .catch(function () { /* ignore */ })
    }
  }, [documentId])

  async function handleVote(vote: 'helpful' | 'not_helpful') {
    if (voted || isSubmitting) return
    setIsSubmitting(true)

    try {
      const sessionId = getOrCreateSessionId()
      const res = await fetch('/api/library/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, vote, sessionId }),
      })

      if (res.ok) {
        const data = await res.json()
        setVoted(vote)
        setCounts(data)
        localStorage.setItem('kb-vote-' + documentId, vote)
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false)
    }
  }

  if (voted && counts) {
    const total = counts.helpful + counts.not_helpful
    return (
      <div className="bg-white rounded-xl border border-brand-border p-5 text-center">
        <p className="text-sm font-semibold text-brand-text mb-2">
          {t('library.vote_thanks')}
        </p>
        <p className="text-xs text-brand-muted">
          {counts.helpful} of {total} found this helpful
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 text-center">
      <p className="text-sm font-semibold text-brand-text mb-3">
        {t('library.was_helpful')}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={function () { handleVote('helpful') }}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50"
        >
          <ThumbsUp size={14} />
          {t('library.vote_yes')}
        </button>
        <button
          onClick={function () { handleVote('not_helpful') }}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
        >
          <ThumbsDown size={14} />
          {t('library.vote_no')}
        </button>
      </div>
    </div>
  )
}
