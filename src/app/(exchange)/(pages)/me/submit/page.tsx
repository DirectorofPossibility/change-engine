'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'


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
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">Share a Resource</h1>
          <p style={{ color: "#5c6474" }} className="text-base mt-2">
            Know a great resource for the Houston community? Share the link and our
            team will review it for inclusion in the Change Engine.
          </p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/me" className="hover:underline">My Account</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Submit</span>
        </nav>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {result?.success ? (
          <div className="p-4 mb-6" style={{ background: '#f0f7f0', border: '1px solid #c3dac3' }}>
            <p style={{ color: '#2d6a2d' }} className="text-sm">{result.message}</p>
            <button
              onClick={() => setResult(null)}
              style={{ color: '#2d6a2d' }}
              className="text-sm hover:underline mt-2"
            >
              Submit another resource
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" style={{  }} className="block text-sm mb-1">
                Resource URL
              </label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/resource"
                className="w-full px-3 py-2 text-sm focus:outline-none"
                style={{ border: '1px solid #dde1e8', background: 'white' }}
              />
            </div>

            <div>
              <label htmlFor="note" style={{  }} className="block text-sm mb-1">
                Note <span style={{ color: "#5c6474" }}>(optional)</span>
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Why is this resource helpful for the community?"
                className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ border: '1px solid #dde1e8', background: 'white' }}
              />
            </div>

            {result?.error && (
              <div className="p-3" style={{ background: '#fdf0f0', border: '1px solid #e5c3c3' }}>
                <p style={{ color: '#8b2020' }} className="text-sm">{result.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="w-full py-2 text-white text-sm disabled:opacity-50"
              style={{ background: '#1b5e8a' }}
            >
              {submitting ? 'Submitting...' : 'Submit Resource'}
            </button>
          </form>
        )}

        {/* ── Footer link ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="mt-10 pt-4">
          <Link href="/me" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to My Account</Link>
        </div>
      </div>
    </div>
  )
}
