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
import { InfoBubble } from '@/components/exchange/InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [address, setAddress] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [language, setLanguage] = useState('en')
  const [gamification, setGamification] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
      setUserId(data.user.id)
      const meta = data.user.user_metadata || {}
      setAvatarUrl(meta.avatar_url || meta.picture || null)
      supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()
        .then(function ({ data: prof }) {
          if (prof) {
            setProfile(prof)
            setDisplayName(prof.display_name || '')
            setAddress((prof as any).address || '')
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
    // Extract ZIP from address if provided
    const extractedZip = address.match(/\b(\d{5})\b/)?.[1]
    const effectiveZip = zipCode || extractedZip || null

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name: displayName,
        address: address || null,
        zip_code: effectiveZip,
        preferred_language: language,
        gamification_enabled: gamification,
        last_active: new Date().toISOString(),
      } as any)
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

  // ── Upload profile picture ──
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB.'); return }

    setUploadingAvatar(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = 'avatars/' + userId + '.' + ext

    const { error: uploadErr } = await supabase.storage
      .from('public')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) {
      setError('Upload failed: ' + uploadErr.message)
      setUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public').getPublicUrl(path)
    const newUrl = urlData.publicUrl + '?t=' + Date.now()

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { avatar_url: newUrl },
    })

    if (metaErr) {
      setError('Failed to update profile: ' + metaErr.message)
    } else {
      setAvatarUrl(newUrl)
      setMessage('Profile picture updated.')
    }
    setUploadingAvatar(false)
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
      <h1 className="text-2xl font-bold text-brand-text mb-2">Settings</h1>
      <p className="text-sm text-brand-muted mb-8">Manage your profile, language, ZIP code, and password. Your ZIP code personalizes content, officials, and services to your area.</p>

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

      {/* ── Profile Picture ── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-brand-text mb-3">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-bg-alt border-2 border-brand-border overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-brand-accent">
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:border-brand-accent transition-colors cursor-pointer">
              {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-brand-muted mt-1">JPG or PNG, max 2MB. Shown in the Knowledge Graph and across the site.</p>
          </div>
        </div>
      </div>

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
          <label htmlFor="address" className="block text-sm font-medium text-brand-text mb-1">Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={function (e) { setAddress(e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:outline-none focus:border-brand-accent"
            placeholder="123 Main St, Houston, TX 77001"
          />
          <p className="text-xs text-brand-muted mt-1">Used to find your elected officials and local resources</p>
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
            placeholder="Auto-filled from address"
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
        <div className="relative flex items-center gap-3">
          <input
            id="gamification"
            type="checkbox"
            checked={gamification}
            onChange={function (e) { setGamification(e.target.checked) }}
            className="rounded border-brand-border"
          />
          <label htmlFor="gamification" className="text-sm text-brand-text">Enable badges and points</label>
          <InfoBubble id={TOOLTIPS.gamification_toggle.id} text={TOOLTIPS.gamification_toggle.text} position="bottom" />
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
