'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Prevent open redirect: only allow relative paths, block protocol-relative URLs
  let redirect = searchParams.get('redirect') || '/me'
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    redirect = '/me'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // If no explicit redirect was set, check role and send admin/partner/neighbor to dashboard
    if (redirect === '/me') {
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
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Good to have you back.</h1>
      <p className="text-brand-muted mb-8">Sign in to pick up where you left off.</p>

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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text mb-1">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={function (e) { setPassword(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="Your password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link href="/reset-password" className="block text-sm text-brand-accent hover:underline">
          Forgot your password? No stress — we&apos;ll sort it.
        </Link>
        <p className="text-sm text-brand-muted">
          Don&apos;t have an account? You don&apos;t need one to look around. But if you want to save things and get updates —{' '}
          <Link href="/signup" className="text-brand-accent hover:underline">it&apos;s free</Link>.
        </p>
      </div>
    </div>
  )
}
