'use client'

/**
 * @fileoverview Login page — culture guide editorial aesthetic.
 *
 * Parchment background, Georgia serif, Courier New mono,
 * seed-of-life watermark, zero border-radius.
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const initialError = urlError === 'confirmation' ? 'Email verification failed or link expired. Please try signing up again or resend the verification email.'
    : urlError === 'auth' ? 'Authentication failed. Please try signing in again.'
    : null
  const [error, setError] = useState<string | null>(initialError)
  const [loading, setLoading] = useState(false)
  let redirect = searchParams.get('redirect') || '/compass'
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    redirect = '/compass'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Incorrect email or password. Double-check and try again.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Please check your email and click the verification link before signing in.')
      } else if (msg.includes('rate') || msg.includes('too many')) {
        setError('Too many login attempts. Please wait a minute and try again.')
      } else {
        setError(msg)
      }
      setLoading(false)
      return
    }

    if (redirect === '/compass') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('auth_id', user.id)
          .single()
        if (profile?.role === 'admin' || profile?.role === 'partner' || profile?.role === 'neighbor') {
          router.push('/dashboard')
          router.refresh()
          return
        }
      }
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen relative" style={{ background: PARCHMENT }}>
      {/* Sacred geometry watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Header */}
        <Link href="/" className="mb-12 hover:opacity-80 transition-opacity">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
        </Link>

        <div className="w-full max-w-[400px]">
          {/* Title */}
          <h1 style={{ fontFamily: SERIF, fontSize: 32, color: INK, lineHeight: 1.15, marginBottom: 8 }}>
            Good to have you back.
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, marginBottom: 32 }}>
            Sign in to pick up where you left off.
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3"
              style={{ background: '#FDF2F2', border: '1px solid rgba(197,48,48,0.2)', fontFamily: SERIF, fontSize: 14, color: '#C53030' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={function (e) { setEmail(e.target.value) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{
                  fontFamily: SERIF,
                  fontSize: 15,
                  color: INK,
                  background: '#ffffff',
                  border: `1px solid ${RULE_COLOR}`,
                }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={function (e) { setPassword(e.target.value) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{
                  fontFamily: SERIF,
                  fontSize: 15,
                  color: INK,
                  background: '#ffffff',
                  border: `1px solid ${RULE_COLOR}`,
                }}
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.04em', background: CLAY }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Rule */}
          <div className="my-8" style={{ height: 1, background: RULE_COLOR }} />

          {/* Links */}
          <div className="text-center space-y-3">
            <Link
              href="/reset-password"
              className="block hover:underline"
              style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
            >
              Forgot your password? No stress.
            </Link>
            <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED }}>
              No account? You don&apos;t need one to look around. But if you want to save things and get updates —{' '}
              <Link href="/signup" className="hover:underline" style={{ color: CLAY }}>
                join free
              </Link>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16">
          <Link
            href="/exchange"
            className="hover:underline"
            style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}
          >
            &larr; Back to The Community Exchange
          </Link>
        </div>
      </div>
    </div>
  )
}
