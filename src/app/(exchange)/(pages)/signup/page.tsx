'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import { InfoBubble } from '@/components/exchange/InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'

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
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const allAgreed = agreedTerms && agreedPrivacy && agreedAccessibility

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAgreed) {
      setError('Please review and agree to all policies before creating your account.')
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()

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
        <FlowerOfLifeIcon size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-brand-text mb-4">Check your email</h1>
        <p className="text-brand-muted mb-6">
          We sent a verification link to <strong>{email}</strong>. Click the link to activate your account and start exploring your community.
        </p>
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
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-[0.04]">
            <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
          </div>
          <FlowerOfLifeIcon size={40} className="mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-brand-text mb-1">Join the Community Exchange</h1>
          <p className="text-brand-muted text-sm">Connect with resources, services, and civic opportunities in Houston.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
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
              minLength={6}
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              className="w-full px-3 py-2.5 border-2 border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
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

        {/* Account tiers info */}
        <div className="relative mt-8 grid grid-cols-2 gap-3">
          <InfoBubble id={TOOLTIPS.neighbor_vs_partner.id} text={TOOLTIPS.neighbor_vs_partner.text} position="bottom" />
          <div className="bg-white rounded-xl border-2 border-brand-border p-4 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-voice mb-1">Neighbor</p>
            <p className="text-xl font-serif font-bold text-brand-text">Free</p>
            <p className="text-[11px] text-brand-muted mt-1">Share resources, submit content, and track your civic activity.</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-brand-border p-4 text-center">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent mb-1">Community Partner</p>
            <p className="text-xl font-serif font-bold text-brand-text">$100<span className="text-sm font-normal text-brand-muted">/yr</span></p>
            <p className="text-[11px] text-brand-muted mt-1">Organizational profile, events, guides, and partner dashboard.</p>
          </div>
        </div>
        <p className="text-center text-[11px] text-brand-muted mt-2">
          Upgrade anytime from your account dashboard. Partner tiers from $100 to $5,000/year.
        </p>
      </div>
    </div>
  )
}
