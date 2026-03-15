/**
 * @fileoverview Sidebar newsletter signup — prominent email capture.
 *
 * Inspired by Greater Good Magazine's sidebar newsletter widget.
 * Collects email for weekly digest / community updates.
 */

'use client'

import { useState } from 'react'

interface SidebarNewsletterBoxProps {
  title?: string
  description?: string
  accentColor?: string
}

export function SidebarNewsletterBox({
  title = 'Stay Connected',
  description = 'Get the latest resources, stories, and civic updates delivered to your inbox.',
  accentColor = '#1b5e8a',
}: SidebarNewsletterBoxProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // TODO: wire up to newsletter API
    setSubmitted(true)
  }

  return (
    <div className="border border-rule bg-white overflow-hidden">
      <div className="h-1" style={{ background: accentColor }} />

      <div className="p-5">
        <h3 className="font-display text-base font-bold text-ink mb-2">{title}</h3>
        <p className="text-[13px] leading-relaxed text-muted mb-4">{description}</p>

        {submitted ? (
          <p className="text-sm font-semibold" style={{ color: accentColor }}>
            Thanks! You&apos;re signed up.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-3 py-2 text-sm border border-rule bg-white text-ink placeholder:text-faint focus:outline-none focus:border-blue"
              required
            />
            <button
              type="submit"
              className="w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              style={{ background: accentColor }}
            >
              Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
