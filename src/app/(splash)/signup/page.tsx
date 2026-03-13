'use client'

/**
 * @fileoverview Signup page — culture guide editorial aesthetic.
 *
 * Parchment background, Georgia serif, Courier New mono,
 * flower-of-life watermark, zero border-radius.
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'


function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.'
  if (!/[0-9]/.test(pw)) return 'Include at least one number.'
  return null
}

function friendlyError(raw: unknown): string {
  const msg = typeof raw === 'string' ? raw : (raw && typeof raw === 'object' ? JSON.stringify(raw) : String(raw || ''))
  if (!msg || msg === '{}' || msg === 'undefined') return 'Something went wrong. Please try again in a moment.'
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (msg.includes('valid email')) return 'Please enter a valid email address.'
  if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a minute and try again.'
  if (msg.includes('weak password') || msg.includes('should be at least')) return 'Password is too weak. Use at least 8 characters with a number and uppercase letter.'
  if (msg.includes('sending') && msg.includes('email')) return 'We had trouble sending the confirmation email. Please try again.'
  if (msg.includes('smtp') || msg.includes('SMTP') || msg.includes('dial tcp')) return 'Email service is temporarily unavailable. Please try again shortly.'
  return msg
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [language, setLanguage] = useState('en')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedAccessibility, setAgreedAccessibility] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordHint, setPasswordHint] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [lastSubmit, setLastSubmit] = useState(0)
  const allAgreed = agreedTerms && agreedPrivacy && agreedAccessibility

  async function handleResendVerification() {
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin + '/auth/callback?next=/exchange' } })
    if (error) {
      setError(friendlyError(error.message))
    } else {
      setResent(true)
    }
    setResending(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAgreed) {
      setError('Please review and agree to all policies before creating your account.')
      return
    }

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }

    const now = Date.now()
    if (now - lastSubmit < 10000) {
      setError('Please wait a moment before trying again.')
      return
    }

    setError(null)
    setLoading(true)
    setLastSubmit(now)

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin + '/auth/callback?next=/exchange',
      },
    })

    if (authError) {
      console.error('[signup] auth error:', authError)
      setError(friendlyError(authError.message))
      setLoading(false)
      return
    }

    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      setError('An account with this email already exists. Try signing in instead.')
      setLoading(false)
      return
    }

    if (!authData.user) {
      console.error('[signup] no user returned:', authData)
      setError('Something went wrong creating your account. Please try again.')
      setLoading(false)
      return
    }

    try {
      await supabase.from('user_profiles').update({
        zip_code: zipCode || null,
        preferred_language: language,
        gamification_enabled: true,
      }).eq('auth_id', authData.user.id)
    } catch (profileErr) {
      console.error('[signup] profile update error:', profileErr)
    }

    setSuccess(true)
    setLoading(false)
  }

  // ── Success state ──

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6 bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={400} height={400} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 w-full max-w-[440px] text-center">
          <Image src="/images/fol/flower-full.svg" alt="" width={60} height={60} className="mx-auto mb-6 opacity-30" />
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            Check your email.
          </h1>
          <p style={{ fontSize: 15, color: "#5c6474", lineHeight: 1.7, marginBottom: 24 }}>
            We sent a verification link to <strong style={{  }}>{email}</strong>.
            Click the link to activate your account and start exploring.
          </p>
          <p style={{ fontSize: 11, color: "#5c6474", marginBottom: 20 }}>
            Check spam if you don&apos;t see it in a few minutes.
          </p>
          {resent ? (
            <p style={{ fontSize: 12, color: '#16a34a', marginBottom: 16 }}>Verification email resent.</p>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="hover:underline disabled:opacity-50 mb-4 block mx-auto"
              style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}
            >
              {resending ? 'Resending...' : 'Didn\u2019t get it? Resend.'}
            </button>
          )}
          {error && (
            <p style={{ fontSize: 13, color: '#C53030', marginBottom: 16 }}>{error}</p>
          )}
          <Link href="/login" className="hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ──

  return (
    <div className="min-h-screen relative bg-paper">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image src="/images/fol/flower-full.svg" alt="" width={600} height={600} className="opacity-[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center py-12 px-6">
        {/* Header */}
        <Link href="/" className="mb-10 hover:opacity-80 transition-opacity">
          <p style={{ fontSize: 11, letterSpacing: '0.12em', color: "#1b5e8a", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
        </Link>

        <div className="w-full max-w-[460px]">
          {/* Title */}
          <h1 style={{ fontSize: 32, lineHeight: 1.15, marginBottom: 8 }}>
            Join the Exchange.
          </h1>
          <p style={{ fontSize: 15, color: "#5c6474", marginBottom: 32 }}>
            Connect with resources, services, and civic opportunities in Houston.
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3"
              style={{ background: '#FDF2F2', border: '1px solid rgba(197,48,48,0.2)', fontSize: 14, color: '#C53030' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
            style={{ background: '#ffffff', border: '1px solid #dde1e8' }}
          >
            <div>
              <label htmlFor="displayName" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Display Name
              </label>
              <input
                id="displayName" type="text" required value={displayName} maxLength={50}
                onChange={function (e) { setDisplayName(e.target.value) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
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

            <div>
              <label htmlFor="password" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="password" type="password" required minLength={8} value={password}
                onChange={function (e) { setPassword(e.target.value); setPasswordHint(validatePassword(e.target.value)) }}
                className="w-full px-4 py-3 focus:outline-none"
                style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
                placeholder="8+ characters, uppercase + number"
              />
              {password && passwordHint && (
                <p style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>{passwordHint}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="zipCode" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  ZIP Code <span style={{ color: '#dde1e8' }}>(optional)</span>
                </label>
                <input
                  id="zipCode" type="text" maxLength={5} value={zipCode}
                  onChange={function (e) { setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                  className="w-full px-4 py-3 focus:outline-none"
                  style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
                  placeholder="77001"
                />
              </div>
              <div>
                <label htmlFor="language" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Language
                </label>
                <select
                  id="language" value={language}
                  onChange={function (e) { setLanguage(e.target.value) }}
                  className="w-full px-4 py-3 focus:outline-none"
                  style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
                >
                  <option value="en">English</option>
                  <option value="es">Espanol</option>
                  <option value="vi">Tieng Viet</option>
                </select>
              </div>
            </div>

            {/* Policy agreements */}
            <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${'#dde1e8'}` }}>
              <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#5c6474", textTransform: 'uppercase' }}>
                Review &amp; Agree
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={agreedPrivacy}
                  onChange={function () { setAgreedPrivacy(!agreedPrivacy) }}
                  className="mt-0.5 w-4 h-4"
                  style={{ accentColor: '#1b5e8a' }}
                />
                <span style={{ fontSize: 14,  }}>
                  I have read and agree to the{' '}
                  <Link href="/privacy" target="_blank" className="hover:underline" style={{ color: "#1b5e8a" }}>Privacy Policy</Link>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={agreedAccessibility}
                  onChange={function () { setAgreedAccessibility(!agreedAccessibility) }}
                  className="mt-0.5 w-4 h-4"
                  style={{ accentColor: '#1b5e8a' }}
                />
                <span style={{ fontSize: 14,  }}>
                  I have read the{' '}
                  <Link href="/accessibility" target="_blank" className="hover:underline" style={{ color: "#1b5e8a" }}>Accessibility Statement</Link>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={agreedTerms}
                  onChange={function () { setAgreedTerms(!agreedTerms) }}
                  className="mt-0.5 w-4 h-4"
                  style={{ accentColor: '#1b5e8a' }}
                />
                <span style={{ fontSize: 14,  }}>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="hover:underline" style={{ color: "#1b5e8a" }}>Terms of Service</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !allAgreed}
              className="w-full py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 13, letterSpacing: '0.04em', background: '#1b5e8a' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center" style={{ fontSize: 14, color: "#5c6474" }}>
            Already have an account?{' '}
            <Link href="/login" className="hover:underline" style={{ color: "#1b5e8a" }}>Sign in</Link>
          </p>

          {/* Account tier */}
          <div className="mt-8 p-5 text-center" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#1b5e8a", textTransform: 'uppercase', marginBottom: 4 }}>
              Neighbor Account
            </p>
            <p style={{ fontSize: 24,  }}>Free</p>
            <p style={{ fontSize: 13, color: "#5c6474", marginTop: 6 }}>
              Share resources, submit content, track your civic activity, and earn impact points.
            </p>
          </div>
          <p className="text-center mt-2" style={{ fontSize: 11, color: "#5c6474" }}>
            Organizations can upgrade to Community Partner from the account dashboard.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12">
          <Link href="/exchange" className="hover:underline" style={{ fontSize: 13, fontStyle: 'italic', color: "#5c6474" }}>
            &larr; Back to The Community Exchange
          </Link>
        </div>
      </div>
    </div>
  )
}
