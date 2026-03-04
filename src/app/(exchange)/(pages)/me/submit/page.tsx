'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SubmitResourcePage() {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/neighbor-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), note: note.trim() || undefined }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message })
        setUrl('')
        setNote('')
      } else {
        setResult({ error: data.error || 'Something went wrong' })
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <Link href="/me" className="text-sm text-brand-accent hover:underline mb-6 inline-block">
        &larr; Back to My Dashboard
      </Link>

      <div className="bg-white rounded-xl border border-brand-border p-6">
        <h1 className="text-2xl font-bold text-brand-text mb-2 font-serif">Share a Resource</h1>
        <p className="text-sm text-brand-muted mb-6">
          Know a great resource for the Houston community? Share the link and our
          team will review it for inclusion in The Change Engine.
        </p>

        {result?.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm font-medium">{result.message}</p>
            <button
              onClick={() => setResult(null)}
              className="text-sm text-green-700 hover:underline mt-2"
            >
              Submit another resource
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-brand-text mb-1">
                Resource URL
              </label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/resource"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-brand-text mb-1">
                Note <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Why is this resource helpful for the community?"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
              />
            </div>

            {result?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="w-full bg-brand-accent text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Resource'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
