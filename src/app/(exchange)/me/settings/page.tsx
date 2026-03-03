/**
 * @fileoverview User settings page (client component).
 *
 * Provides a client-side form for managing user preferences:
 *  - Display name
 *  - ZIP code (also stored in a cookie for geo-personalization)
 *  - Preferred language (stored in a cookie for i18n)
 *  - Gamification toggle (badges/points)
 *  - Password change via Supabase Auth
 *
 * On mount, fetches the authenticated user and their `user_profiles` row.
 * On save, updates the `user_profiles` table and syncs `lang`/`zip` cookies.
 *
 * @datasource Supabase tables: user_profiles; Supabase Auth for password
 * @caching Client-side only (no ISR)
 * @route GET /me/settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [language, setLanguage] = useState('en')
  const [gamification, setGamification] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // ── Load profile on mount ──
  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(function ({ data }) {
      if (!data.user) {
        router.push('/login?redirect=/me/settings')
        return
      }
      supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()
        .then(function ({ data: prof }) {
          if (prof) {
            setProfile(prof)
            setDisplayName(prof.display_name || '')
            setZipCode(prof.zip_code || '')
            setLanguage(prof.preferred_language || 'en')
            setGamification(prof.gamification_enabled !== false)
          }
          setLoading(false)
        })
    })
  }, [router])

  // ── Save profile handler ──
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) { setError('Profile not found. Please reload the page.'); return }
    setSaving(true)
    setMessage(null)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name: displayName,
        zip_code: zipCode || null,
        preferred_language: language,
        gamification_enabled: gamification,
        last_active: new Date().toISOString(),
      })
      .eq('auth_id', profile.auth_id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Settings saved.')
      // Update language cookie
      document.cookie = 'lang=' + language + ';path=/;max-age=31536000'
      if (zipCode) {
        document.cookie = 'zip=' + zipCode + ';path=/;max-age=31536000'
      }
    }
    setSaving(false)
  }

  // ── Change password handler ──
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    setMessage(null)
    setError(null)

    const supabase = createClient()
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })

    if (pwError) {
      setError(pwError.message)
    } else {
      setMessage('Password updated.')
      setNewPassword('')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="h-8 w-32 bg-white/60 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map(function (i) {
            return <div key={i} className="h-16 bg-white/60 rounded-lg animate-pulse" />
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-text mb-8">Settings</h1>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* ── Profile Settings ── */}
      <form onSubmit={handleSaveProfile} className="space-y-4 mb-10">
        <h2 className="text-lg font-semibold text-brand-text">Profile</h2>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-brand-text mb-1">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={function (e) { setDisplayName(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-brand-text mb-1">ZIP Code</label>
          <input
            id="zipCode"
            type="text"
            maxLength={5}
            value={zipCode}
            onChange={function (e) { setZipCode(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-brand-text mb-1">Preferred Language</label>
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
        <div className="flex items-center gap-3">
          <input
            id="gamification"
            type="checkbox"
            checked={gamification}
            onChange={function (e) { setGamification(e.target.checked) }}
            className="rounded border-brand-border"
          />
          <label htmlFor="gamification" className="text-sm text-brand-text">Enable badges and points</label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* ── Password Change ── */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-text">Change Password</h2>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-brand-text mb-1">New Password</label>
          <input
            id="newPassword"
            type="password"
            minLength={6}
            value={newPassword}
            onChange={function (e) { setNewPassword(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="At least 6 characters"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-text text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
