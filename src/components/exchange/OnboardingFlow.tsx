'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { isOnboarded, completeOnboarding } from '@/lib/spiral'
import { THEMES } from '@/lib/constants'

const PERSONAS = [
  { slug: 'seeker', label: 'Find Help', desc: 'I need services or resources.', icon: '↗' },
  { slug: 'learner', label: 'Learn', desc: 'I want to understand what\'s happening.', icon: '↗' },
  { slug: 'builder', label: 'Take Action', desc: 'I want to volunteer or contribute.', icon: '↗' },
  { slug: 'watchdog', label: 'Hold Accountable', desc: 'I want to follow who makes decisions.', icon: '↗' },
]

const PATHWAY_OPTIONS = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: t.name, color: t.color, slug: t.slug }
})

type Step = 'address' | 'intent' | 'interests'

export function OnboardingFlow() {
  const router = useRouter()
  const { zip, neighborhood, lookupZip, lookupAddress, isLoading } = useNeighborhood()
  const [step, setStep] = useState<Step>('address')
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [show, setShow] = useState(false)

  useEffect(function () {
    // Only show if not onboarded and no ZIP set
    if (!isOnboarded() && !zip) {
      const timer = setTimeout(function () { setShow(true) }, 800)
      return function () { clearTimeout(timer) }
    }
  }, [zip])

  // Auto-advance when ZIP resolves
  useEffect(function () {
    if (zip && neighborhood && step === 'address') {
      setStep('intent')
    }
  }, [zip, neighborhood, step])

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    if (/^\d{5}$/.test(trimmed)) {
      lookupZip(trimmed)
    } else if (trimmed.length >= 5) {
      lookupAddress(trimmed)
    }
  }

  function handlePersonaSelect(slug: string) {
    setPersona(slug)
    setStep('interests')
  }

  function handleFinish() {
    completeOnboarding(persona, interests)
    setShow(false)
    // Navigate to personalized view
    if (persona) {
      router.push('/for/' + persona)
    } else {
      router.push('/compass')
    }
  }

  function handleSkip() {
    completeOnboarding('explorer', [])
    setShow(false)
  }

  function toggleInterest(id: string) {
    setInterests(function (prev) {
      if (prev.includes(id)) return prev.filter(function (x) { return x !== id })
      return [...prev, id]
    })
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-up">
      <div
        className="relative bg-white rounded-2xl border-2 border-brand-border w-full max-w-lg mx-4 overflow-hidden"
        style={{ boxShadow: '6px 6px 0 #D5D0C8' }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5">
          {(['address', 'intent', 'interests'] as Step[]).map(function (s, i) {
            const active = s === step
            const done = (['address', 'intent', 'interests'] as Step[]).indexOf(step) > i
            return (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: active ? '32px' : '12px',
                  backgroundColor: active ? '#C75B2A' : done ? '#38a169' : '#E2DDD5',
                }}
              />
            )
          })}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-xs text-brand-muted hover:text-brand-accent transition-colors"
        >
          Skip
        </button>

        <div className="p-6 pt-4">
          {/* ── Step 1: Address ── */}
          {step === 'address' && (
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
                Where are you?
              </h2>
              <p className="text-sm text-brand-muted mb-6 max-w-sm mx-auto">
                Your address helps us show you your officials, nearby services, and what&apos;s happening in your area.
              </p>
              <form onSubmit={handleAddressSubmit} className="max-w-sm mx-auto">
                <div
                  className="flex items-center gap-2 border-2 border-brand-text rounded-xl px-4 py-3 bg-white mb-3"
                  style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <input
                    type="text"
                    value={input}
                    onChange={function (e) { setInput(e.target.value) }}
                    placeholder="Enter your address or ZIP code"
                    autoFocus
                    disabled={isLoading}
                    className="flex-1 text-sm bg-transparent text-brand-text placeholder:text-brand-muted focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={input.trim().length < 5 || isLoading}
                  className="w-full py-3 bg-brand-text text-white font-semibold text-sm rounded-xl disabled:opacity-30 hover:bg-brand-accent transition-colors"
                  style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
                >
                  {isLoading ? 'Looking up...' : 'Find my community'}
                </button>
              </form>
              <button
                onClick={function () { setStep('intent') }}
                className="mt-4 text-xs text-brand-muted hover:text-brand-accent transition-colors"
              >
                I&apos;ll do this later
              </button>
            </div>
          )}

          {/* ── Step 2: Intent ── */}
          {step === 'intent' && (
            <div className="text-center">
              {neighborhood && (
                <p className="text-xs font-mono uppercase tracking-widest text-brand-accent mb-1">
                  {neighborhood.neighborhood_name || zip}
                </p>
              )}
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
                What brings you here?
              </h2>
              <p className="text-sm text-brand-muted mb-5">
                This helps us show you the right things first. You can always explore everything.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PERSONAS.map(function (p) {
                  return (
                    <button
                      key={p.slug}
                      onClick={function () { handlePersonaSelect(p.slug) }}
                      className="text-left border-2 border-brand-border rounded-xl p-4 hover:border-brand-accent hover:-translate-y-0.5 transition-all group"
                      style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
                    >
                      <span className="block text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                        {p.label}
                      </span>
                      <span className="block text-xs text-brand-muted mt-1">{p.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Interests ── */}
          {step === 'interests' && (
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
                What do you care about?
              </h2>
              <p className="text-sm text-brand-muted mb-5">
                Pick as many as you want. This helps us connect the dots for you.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {PATHWAY_OPTIONS.map(function (pw) {
                  const selected = interests.includes(pw.id)
                  return (
                    <button
                      key={pw.id}
                      onClick={function () { toggleInterest(pw.id) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium"
                      style={{
                        borderColor: selected ? pw.color : '#E2DDD5',
                        backgroundColor: selected ? pw.color + '12' : 'white',
                        color: selected ? pw.color : '#6B6560',
                        boxShadow: selected ? '2px 2px 0 ' + pw.color + '30' : 'none',
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pw.color }}
                      />
                      {pw.name}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleFinish}
                className="w-full max-w-xs mx-auto py-3 bg-brand-text text-white font-semibold text-sm rounded-xl hover:bg-brand-accent transition-colors"
                style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
              >
                Show me my community
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
