'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        auth_id: authData.user.id,
        display_name: displayName,
        email: email,
        zip_code: zipCode || null,
        preferred_language: language,
        gamification_enabled: true,
        role: 'user',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-text mb-4">Check your email</h1>
        <p className="text-brand-muted mb-6">
          We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
        <Link href="/login" className="text-brand-accent hover:underline text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Create Account</h1>
      <p className="text-brand-muted mb-8">Join the Community Exchange.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-brand-text mb-1">Display Name</label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={function (e) { setDisplayName(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
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
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text mb-1">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={function (e) { setPassword(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="At least 6 characters"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-brand-text mb-1">ZIP Code <span className="text-brand-muted">(optional)</span></label>
            <input
              id="zipCode"
              type="text"
              maxLength={5}
              value={zipCode}
              onChange={function (e) { setZipCode(e.target.value) }}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
              placeholder="77001"
            />
          </div>
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-brand-text mb-1">Language</label>
            <select
              id="language"
              value={language}
              onChange={function (e) { setLanguage(e.target.value) }}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent bg-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-accent hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
