'use client'

import { useState } from 'react'
import { Bell, CheckCircle, Loader2 } from 'lucide-react'

const REMINDER_OPTIONS = [
  { key: 'registration', label: 'Registration deadlines' },
  { key: 'early_voting', label: 'Early voting alerts' },
  { key: 'election_day', label: 'Election day reminder' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ElectionReminderSignup() {
  const [email, setEmail] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [types, setTypes] = useState<Set<string>>(
    new Set(['registration', 'early_voting', 'election_day'])
  )
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function toggleType(key: string) {
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!email || !EMAIL_RE.test(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (types.size === 0) {
      setErrorMsg('Please select at least one reminder type.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          zip_code: zipCode || undefined,
          reminder_types: Array.from(types),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-[#E5E0D8] bg-white p-6 sm:p-8 text-center">
        <CheckCircle className="mx-auto mb-3 text-green-600" size={40} />
        <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] mb-2">
          You&apos;re signed up!
        </h3>
        <p className="text-[#2C2C2C]/70 text-sm">
          We&apos;ll remind you before important election dates so you never miss a deadline.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E5E0D8] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C75B2A]/10">
          <Bell className="text-[#C75B2A]" size={20} />
        </div>
        <h3 className="font-serif text-xl font-semibold text-[#2C2C2C]">
          Get Election Reminders
        </h3>
      </div>

      <p className="text-sm text-[#2C2C2C]/70 mb-5">
        Never miss a registration deadline or election day. We&apos;ll send you a heads-up before
        the dates that matter.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="reminder-email" className="block text-sm font-medium text-[#2C2C2C] mb-1">
            Email address <span className="text-[#C75B2A]">*</span>
          </label>
          <input
            id="reminder-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#E5E0D8] bg-[#F5F1EB]/50 px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#2C2C2C]/40 focus:border-[#C75B2A] focus:outline-none focus:ring-1 focus:ring-[#C75B2A]"
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label htmlFor="reminder-zip" className="block text-sm font-medium text-[#2C2C2C] mb-1">
            ZIP code <span className="text-[#2C2C2C]/40 font-normal">(optional)</span>
          </label>
          <input
            id="reminder-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="77001"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full rounded-lg border border-[#E5E0D8] bg-[#F5F1EB]/50 px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#2C2C2C]/40 focus:border-[#C75B2A] focus:outline-none focus:ring-1 focus:ring-[#C75B2A]"
          />
        </div>

        {/* Reminder types */}
        <fieldset>
          <legend className="block text-sm font-medium text-[#2C2C2C] mb-2">
            Remind me about
          </legend>
          <div className="space-y-2">
            {REMINDER_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={types.has(key)}
                  onChange={() => toggleType(key)}
                  className="h-4 w-4 rounded border-[#E5E0D8] text-[#C75B2A] focus:ring-[#C75B2A]"
                />
                <span className="text-sm text-[#2C2C2C] group-hover:text-[#C75B2A] transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-600" role="alert">{errorMsg}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-[#C75B2A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B04E22] focus:outline-none focus:ring-2 focus:ring-[#C75B2A] focus:ring-offset-2 disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Signing up...
            </span>
          ) : (
            'Sign Up for Reminders'
          )}
        </button>
      </form>
    </div>
  )
}
