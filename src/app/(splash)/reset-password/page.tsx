'use client'

/**
 * @fileoverview Password reset page — culture guide editorial aesthetic.
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const PARCHMENT = '#F5F0E8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback?next=/me/settings',
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6" style={{ background: PARCHMENT }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={400} height={400} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 w-full max-w-[400px] text-center">
          <h1 style={{ fontFamily: SERIF, fontSize: 28, color: INK, marginBottom: 12 }}>
            Check your inbox.
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 8 }}>
            The link expires in 24 hours. We sent it to <strong style={{ color: INK }}>{email}</strong>.
          </p>
          <div className="mt-8">
            <Link href="/login" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: PARCHMENT }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <Link href="/" className="mb-12 hover:opacity-80 transition-opacity">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
        </Link>

        <div className="w-full max-w-[400px]">
          <h1 style={{ fontFamily: SERIF, fontSize: 32, color: INK, lineHeight: 1.15, marginBottom: 8 }}>
            Let&apos;s get you back in.
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, marginBottom: 32 }}>
            Enter your email. We&apos;ll send you a link. Check spam if it doesn&apos;t show up in a few minutes.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3"
              style={{ background: '#FDF2F2', border: '1px solid rgba(197,48,48,0.2)', fontFamily: SERIF, fontSize: 14, color: '#C53030' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
              >
                Email
              </label>
              <input
                id="email" type="email" required value={email}
                onChange={function (e) { setEmail(e.target.value) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{ fontFamily: SERIF, fontSize: 15, color: INK, background: '#ffffff', border: `1px solid ${RULE_COLOR}` }}
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.04em', background: CLAY }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="my-8" style={{ height: 1, background: RULE_COLOR }} />

          <p className="text-center" style={{ fontFamily: SERIF, fontSize: 14, color: MUTED }}>
            Remember your password?{' '}
            <Link href="/login" className="hover:underline" style={{ color: CLAY }}>Sign in</Link>
          </p>
        </div>

        <div className="mt-16">
          <Link href="/exchange" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
            &larr; Back to The Community Exchange
          </Link>
        </div>
      </div>
    </div>
  )
}
