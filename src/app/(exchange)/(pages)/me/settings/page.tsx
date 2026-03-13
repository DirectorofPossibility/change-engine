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
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
      <div style={{ background: PARCHMENT }} className="min-h-screen">
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="h-8 w-32 animate-pulse mb-6" style={{ background: PARCHMENT_WARM }} />
          <div className="space-y-4">
            {[0, 1, 2, 3].map(function (i) {
              return <div key={i} className="h-16 animate-pulse" style={{ background: PARCHMENT_WARM }} />
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Your Settings</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">Language, notifications, saved items, and account info -- all in one place.</p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/me" className="hover:underline">My Account</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Settings</span>
        </nav>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {message && (
          <div className="text-sm p-3 mb-4" style={{ background: '#f0f7f0', border: '1px solid #c3dac3', color: '#2d6a2d' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="text-sm p-3 mb-4" style={{ background: '#fdf0f0', border: '1px solid #e5c3c3', color: '#8b2020' }}>
            {error}
          </div>
        )}

        {/* ── Profile Picture ── */}
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Profile Picture</h2>
          <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" className="w-full h-full object-cover" width={64} height={64} />
              ) : (
                <span className="text-xl font-bold" style={{ fontFamily: SERIF, color: CLAY }}>
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-sm cursor-pointer" style={{ fontFamily: MONO, color: INK, border: '1px solid ' + RULE_COLOR }}>
                {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="sr-only"
                />
              </label>
              <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs mt-1">JPG or PNG, max 2MB.</p>
            </div>
          </div>
        </div>

        {/* ── Profile Settings ── */}
        <form onSubmit={handleSaveProfile} className="space-y-4 mb-10">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Profile</h2>
          <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
          <div>
            <label htmlFor="displayName" style={{ fontFamily: MONO, color: INK }} className="block text-sm mb-1">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={function (e) { setDisplayName(e.target.value) }}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ fontFamily: SERIF, color: INK, border: '1px solid ' + RULE_COLOR, background: 'white' }}
            />
          </div>
          <div>
            <label htmlFor="address" style={{ fontFamily: MONO, color: INK }} className="block text-sm mb-1">Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={function (e) { setAddress(e.target.value) }}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ fontFamily: SERIF, color: INK, border: '1px solid ' + RULE_COLOR, background: 'white' }}
              placeholder="123 Main St, Houston, TX 77001"
            />
            <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs mt-1">Used to find your elected officials and local resources</p>
          </div>
          <div>
            <label htmlFor="zipCode" style={{ fontFamily: MONO, color: INK }} className="block text-sm mb-1">ZIP Code</label>
            <input
              id="zipCode"
              type="text"
              maxLength={5}
              value={zipCode}
              onChange={function (e) { setZipCode(e.target.value) }}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ fontFamily: SERIF, color: INK, border: '1px solid ' + RULE_COLOR, background: 'white' }}
              placeholder="Auto-filled from address"
            />
          </div>
          <div>
            <label htmlFor="language" style={{ fontFamily: MONO, color: INK }} className="block text-sm mb-1">Language</label>
            <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs mb-2">English, Spanish, or Vietnamese. Switch any time.</p>
            <select
              id="language"
              value={language}
              onChange={function (e) { setLanguage(e.target.value) }}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ fontFamily: SERIF, color: INK, border: '1px solid ' + RULE_COLOR, background: 'white' }}
            >
              <option value="en">English</option>
              <option value="es">Espanol</option>
              <option value="vi">Tieng Viet</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="gamification"
              type="checkbox"
              checked={gamification}
              onChange={function (e) { setGamification(e.target.checked) }}
              style={{ accentColor: CLAY }}
            />
            <label htmlFor="gamification" style={{ fontFamily: SERIF, color: INK }} className="text-sm">Enable badges and points</label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-white text-sm disabled:opacity-50"
            style={{ fontFamily: MONO, background: CLAY }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />

        {/* ── Password Change ── */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Account</h2>
          <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs">Update your email or password.</p>
          <div>
            <label htmlFor="newPassword" style={{ fontFamily: MONO, color: INK }} className="block text-sm mb-1">New Password</label>
            <input
              id="newPassword"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={function (e) { setNewPassword(e.target.value) }}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ fontFamily: SERIF, color: INK, border: '1px solid ' + RULE_COLOR, background: 'white' }}
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-white text-sm disabled:opacity-50"
            style={{ fontFamily: MONO, background: INK }}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* ── Footer link ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="mt-10 pt-4">
          <Link href="/me" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">&larr; Back to My Account</Link>
        </div>
      </div>
    </div>
  )
}
