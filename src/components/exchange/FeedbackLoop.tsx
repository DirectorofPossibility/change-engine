'use client'

import { useState } from 'react'
import { FlowerOfLifeIcon } from './FlowerIcons'

interface FeedbackLoopProps {
  entityType: string
  entityId: string
  entityName: string
}

type FeedbackKind = 'correction' | 'outdated' | 'missing' | 'other'

const FEEDBACK_KINDS: Array<{ value: FeedbackKind; label: string; prompt: string }> = [
  { value: 'correction', label: 'Something is wrong', prompt: 'What needs correcting?' },
  { value: 'outdated', label: 'Info is outdated', prompt: 'What has changed?' },
  { value: 'missing', label: 'Something is missing', prompt: 'What should be added?' },
  { value: 'other', label: 'Other feedback', prompt: 'What would you like us to know?' },
]

export function FeedbackLoop({ entityType, entityId, entityName }: FeedbackLoopProps) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<FeedbackKind | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function reset() {
    setOpen(false)
    setKind(null)
    setMessage('')
    setEmail('')
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kind || !message.trim()) return

    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          field_name: kind,
          reason: message.trim(),
          submitter_email: email.trim() || null,
        }),
      })

      if (res.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-brand-border p-5 text-center">
        <FlowerOfLifeIcon size={28} color="#38a169" className="mx-auto mb-2" />
        <p className="text-sm font-semibold text-brand-text">Thank you for your feedback</p>
        <p className="text-xs text-brand-muted mt-1">Our team will review this and update the record if needed.</p>
        <button
          onClick={reset}
          className="mt-3 text-xs text-brand-accent hover:underline"
        >
          Close
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="border border-brand-border p-4 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-2">Feedback Loop</p>
        <button
          onClick={function () { setOpen(true) }}
          className="text-sm text-brand-accent hover:underline font-semibold"
        >
          See something that needs updating?
        </button>
        <p className="text-xs text-brand-muted mt-1">Community members help keep this accurate</p>
      </div>
    )
  }

  const selectedKind = FEEDBACK_KINDS.find(function (k) { return k.value === kind })

  return (
    <div className="border border-brand-border overflow-hidden">
      <div className="px-4 py-3 bg-brand-bg border-b border-brand-border flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light">Feedback Loop</p>
        <button onClick={reset} className="text-xs text-brand-muted hover:text-brand-accent">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Kind selector */}
        {!kind ? (
          <div className="space-y-1.5">
            <p className="text-xs text-brand-muted mb-2">What type of feedback?</p>
            {FEEDBACK_KINDS.map(function (k) {
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={function () { setKind(k.value) }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-brand-text border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors"
                >
                  {k.label}
                </button>
              )
            })}
          </div>
        ) : (
          <>
            {/* Back to kind selection */}
            <button
              type="button"
              onClick={function () { setKind(null); setMessage('') }}
              className="text-xs text-brand-muted hover:text-brand-accent"
            >
              &larr; {selectedKind?.label}
            </button>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">{selectedKind?.prompt}</label>
              <textarea
                value={message}
                onChange={function (e) { setMessage(e.target.value) }}
                rows={3}
                maxLength={1000}
                required
                className="w-full text-sm border border-brand-border px-3 py-2 bg-white text-brand-text placeholder:text-brand-muted-light focus:outline-none focus:border-brand-accent resize-none"
                placeholder="Be as specific as you can..."
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Your email (optional — if you want a reply)</label>
              <input
                type="email"
                value={email}
                onChange={function (e) { setEmail(e.target.value) }}
                className="w-full text-sm border border-brand-border px-3 py-2 bg-white text-brand-text placeholder:text-brand-muted-light focus:outline-none focus:border-brand-accent"
                placeholder="you@example.com"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!message.trim() || status === 'sending'}
              className="w-full px-4 py-2 bg-brand-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-brand-accent-hover transition-colors"
            >
              {status === 'sending' ? 'Sending...' : 'Submit Feedback'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
