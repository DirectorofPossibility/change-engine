'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-text mb-4">Check your inbox.</h1>
        <p className="text-brand-muted mb-6">
          The link expires in 24 hours. We sent it to <strong>{email}</strong>.
        </p>
        <Link href="/login" className="text-brand-accent hover:underline text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Let&apos;s get you back in.</h1>
      <p className="text-brand-muted mb-8">Enter your email. We&apos;ll send you a link. Check your spam if it doesn&apos;t show up in a few minutes.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-1">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={function (e) { setEmail(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Remember your password?{' '}
        <Link href="/login" className="text-brand-accent hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
