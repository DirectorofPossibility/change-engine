'use client'

/**
 * @fileoverview Password reset page — culture guide editorial aesthetic.
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'


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
      <div className="min-h-screen relative flex items-center justify-center px-6 bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={400} height={400} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 w-full max-w-[400px] text-center">
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            Check your inbox.
          </h1>
          <p style={{ fontSize: 15, color: "#5c6474", lineHeight: 1.7, marginBottom: 8 }}>
            The link expires in 24 hours. We sent it to <strong style={{  }}>{email}</strong>.
          </p>
          <div className="mt-8">
            <Link href="/login" className="hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-paper">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <Link href="/" className="mb-12 hover:opacity-80 transition-opacity">
          <p style={{ fontSize: 11, letterSpacing: '0.12em', color: "#1b5e8a", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
        </Link>

        <div className="w-full max-w-[400px]">
          <h1 style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 8 }}>
            Let&apos;s get you back in.
          </h1>
          <p style={{ fontSize: 15, color: "#5c6474", marginBottom: 32 }}>
            Enter your email. We&apos;ll send you a link. Check spam if it doesn&apos;t show up in a few minutes.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3"
              style={{ background: '#FDF2F2', border: '1px solid rgba(197,48,48,0.2)', fontSize: 14, color: '#C53030' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
              >
                Email
              </label>
              <input
                id="email" type="email" required value={email}
                onChange={function (e) { setEmail(e.target.value) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 13, letterSpacing: '0.04em', background: '#1b5e8a' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="my-8" style={{ height: 1, background: '#dde1e8' }} />

          <p className="text-center" style={{ fontSize: 14, color: "#5c6474" }}>
            Remember your password?{' '}
            <Link href="/login" className="hover:underline" style={{ color: "#1b5e8a" }}>Sign in</Link>
          </p>
        </div>

        <div className="mt-16">
          <Link href="/exchange" className="hover:underline" style={{ fontSize: 13, fontStyle: 'italic', color: "#5c6474" }}>
            &larr; Back to The Community Exchange
          </Link>
        </div>
      </div>
    </div>
  )
}
