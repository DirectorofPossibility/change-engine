'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'

/** Validate password complexity: 8+ chars, 1 uppercase, 1 number */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number.'
  return null
}

/** Map Supabase auth errors to user-friendly messages */
function friendlyError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (msg.includes('valid email')) return 'Please enter a valid email address.'
  if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a minute and try again.'
  if (msg.includes('weak password') || msg.includes('should be at least')) return 'Password is too weak. Use at least 8 characters with a number and uppercase letter.'
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
    const { error } = await supabase.auth.resend({ type: 'signup', email })
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

    // Client-side password validation
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }

    // Rate limit: 10 second cooldown between attempts
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
      },
    })

    if (authError) {
      setError(friendlyError(authError.message))
      setLoading(false)
      return
    }

    // Supabase returns a user with a fake session when email already exists (security measure).
    // Detect this: if identities array is empty, the email is taken.
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      setError('An account with this email already exists. Try signing in instead.')
      setLoading(false)
      return
    }

    // Profile is auto-created by DB trigger; update with extra fields
    if (authData.user) {
      await supabase.from('user_profiles').update({
        zip_code: zipCode || null,
        preferred_language: language,
        gamification_enabled: true,
      }).eq('auth_id', authData.user.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <FlowerOfLifeIcon size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-brand-text mb-4">Check your email</h1>
        <p className="text-brand-muted mb-6">
          We sent a verification link to <strong>{email}</strong>. Click the link to activate your account and start exploring your community.
        </p>
        <p className="text-brand-muted text-xs mb-4">
          Check your spam folder if you don&apos;t see it in a few minutes.
        </p>
        {resent ? (
          <p className="text-sm text-green-600 mb-4">Verification email resent!</p>
        ) : (
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="text-sm text-brand-accent hover:underline disabled:opacity-50 mb-4 block mx-auto"
          >
            {resending ? 'Resending...' : 'Didn\u2019t get it? Resend verification email'}
          </button>
        )}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}
        <Link href="/login" className="text-brand-accent hover:underline text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-[0.04] pointer-events-none">
            <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
          </div>
          <FlowerOfLifeIcon size={40} className="mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-brand-text mb-1">Join the Community Exchange</h1>
          <p className="text-brand-muted text-sm">Connect with resources, services, and civic opportunities in Houston.</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-brand-border p-6 space-y-4" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-brand-text mb-1">Display Name</label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              maxLength={50}
              onChange={function (e) { setDisplayName(e.target.value) }}
              className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-text mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={function (e) {
                setPassword(e.target.value)
                setPasswordHint(validatePassword(e.target.value))
              }}
              className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
              placeholder="8+ characters, uppercase + number"
            />
            {password && passwordHint && (
              <p className="text-xs text-amber-600 mt-1">{passwordHint}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-brand-text mb-1">ZIP Code <span className="text-brand-muted">(optional)</span></label>
              <input
                id="zipCode"
                type="text"
                maxLength={5}
                value={zipCode}
                onChange={function (e) { setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
                placeholder="77001"
              />
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-brand-text mb-1">Language</label>
              <select
                id="language"
                value={language}
                onChange={function (e) { setLanguage(e.target.value) }}
                className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent bg-white"
              >
                <option value="en">English</option>
                <option value="es">Espanol</option>
                <option value="vi">Tieng Viet</option>
              </select>
            </div>
          </div>

          {/* Policy agreements */}
          <div className="pt-3 border-t border-brand-border space-y-3">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">Review & Agree</p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={function () { setAgreedPrivacy(!agreedPrivacy) }}
                className="mt-0.5 w-4 h-4 rounded border-2 border-brand-border text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-text">
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" className="text-brand-accent hover:underline font-medium">Privacy Policy</Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedAccessibility}
                onChange={function () { setAgreedAccessibility(!agreedAccessibility) }}
                className="mt-0.5 w-4 h-4 rounded border-2 border-brand-border text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-text">
                I have read the{' '}
                <Link href="/accessibility" target="_blank" className="text-brand-accent hover:underline font-medium">Accessibility Statement</Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={function () { setAgreedTerms(!agreedTerms) }}
                className="mt-0.5 w-4 h-4 rounded border-2 border-brand-border text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-text">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-brand-accent hover:underline font-medium">Terms of Service</Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !allAgreed}
            className="w-full py-3 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-accent hover:underline font-medium">Sign in</Link>
        </p>

        {/* Account info */}
        <div className="relative mt-8">
          <div className="bg-white rounded-xl border-2 border-brand-border p-4 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-voice mb-1">Neighbor Account</p>
            <p className="text-xl font-serif font-bold text-brand-text">Free</p>
            <p className="text-[11px] text-brand-muted mt-1">Share resources, submit content, track your civic activity, and earn impact points.</p>
          </div>
        </div>
        <p className="text-center text-[11px] text-brand-muted mt-2">
          Organizations can upgrade to Community Partner from the account dashboard.
        </p>
      </div>
    </div>
  )
}
