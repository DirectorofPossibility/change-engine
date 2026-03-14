'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { isOnboarded, completeOnboarding } from '@/lib/spiral'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'
import { GradientFOL } from './GradientFOL'

const PERSONAS = [
  { slug: 'seeker', label: 'Explore Resources', desc: 'I want to see what\u2019s available.', color: '#4a2870', fol: '/images/fol/seed-of-life.svg' },
  { slug: 'learner', label: 'Learn', desc: 'I want to understand what\'s happening.', color: '#1b5e8a', fol: '/images/fol/vesica-piscis.svg' },
  { slug: 'builder', label: 'Take Action', desc: 'I want to volunteer or contribute.', color: '#1a6b56', fol: '/images/fol/tripod-of-life.svg' },
  { slug: 'watchdog', label: 'Hold Accountable', desc: 'I want to follow who makes decisions.', color: '#4a2870', fol: '/images/fol/metatrons-cube.svg' },
]

const PATHWAY_OPTIONS = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: t.name, color: t.color, slug: t.slug }
})

type Step = 'welcome' | 'address' | 'intent' | 'interests'

export function OnboardingFlow() {
  const router = useRouter()
  const { zip, neighborhood, lookupZip, lookupAddress, isLoading } = useNeighborhood()
  const [step, setStep] = useState<Step>('welcome')
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [lookupAttempted, setLookupAttempted] = useState(false)

  useEffect(function () {
    // Don't show on auth pages (signup, login, reset-password)
    const path = window.location.pathname
    if (path === '/signup' || path === '/login' || path === '/reset-password') return

    // Show if not onboarded — regardless of ZIP
    if (!isOnboarded()) {
      const timer = setTimeout(function () { setShow(true) }, 1200)
      return function () { clearTimeout(timer) }
    }
  }, [])

  // Auto-advance when ZIP resolves after a lookup attempt
  useEffect(function () {
    if (lookupAttempted && zip && step === 'address') {
      setError('')
      setStep('intent')
    }
  }, [zip, lookupAttempted, step])

  // If user already has a ZIP, skip address step
  const handleGetStarted = useCallback(function () {
    if (zip) {
      setStep('intent')
    } else {
      setStep('address')
    }
  }, [zip])

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setError('')
    setLookupAttempted(true)

    if (/^\d{5}$/.test(trimmed)) {
      lookupZip(trimmed)
      // Set a timeout to catch failures
      setTimeout(function () {
        setLookupAttempted(function (prev) {
          // If still on address step after 5s, show error
          return prev
        })
      }, 5000)
    } else if (trimmed.length >= 5) {
      lookupAddress(trimmed)
    } else {
      setError('Enter a 5-digit ZIP code or a full address.')
    }
  }

  function handlePersonaSelect(slug: string) {
    setPersona(slug)
    setStep('interests')
  }

  function handleFinish() {
    completeOnboarding(persona || 'explorer', interests)
    setShow(false)
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

  const steps: Step[] = ['welcome', 'address', 'intent', 'interests']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg mx-4 overflow-hidden border border-brand-border animate-fade-up"
       
      >
        {/* ── Branded header ── */}
        <div className="relative overflow-hidden" style={{ background: '#f4f5f7' }}>
          {/* Animated gradient FOL watermarks */}
          <div className="absolute pointer-events-none" style={{ width: '300px', height: '300px', top: '-80px', right: '-60px', opacity: 0.08 }}>
            <GradientFOL variant="full" spinDur={90} colorDur={12} />
          </div>
          <div className="absolute pointer-events-none" style={{ width: '150px', height: '150px', bottom: '-40px', left: '-30px', opacity: 0.05 }}>
            <GradientFOL variant="seed" spinDur={120} colorDur={16} />
          </div>

          {/* Spectrum bar at top */}
          <div className="flex h-1">
            <div className="flex-1" style={{ background: '#7a2018' }} />
            <div className="flex-1" style={{ background: '#1e4d7a' }} />
            <div className="flex-1" style={{ background: '#4a2870' }} />
            <div className="flex-1" style={{ background: '#1a6b56' }} />
            <div className="flex-1" style={{ background: '#1b5e8a' }} />
            <div className="flex-1" style={{ background: '#1a5030' }} />
            <div className="flex-1" style={{ background: '#4a2870' }} />
          </div>

          <div className="relative z-10 px-6 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <Image src="/images/fol/flower-full.svg" alt="" className="w-8 h-8" style={{ filter: 'hue-rotate(-10deg) saturate(0.6)' }}  width={200} height={32} />
              <div>
                <span className="block font-display text-lg font-bold text-brand-text leading-tight">Change Engine</span>
                <span className="block font-mono text-[8px] font-bold uppercase tracking-widest text-brand-muted-light">A project of The Change Lab</span>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-3">
              {steps.map(function (s, i) {
                const active = i === stepIndex
                const done = i < stepIndex
                return (
                  <div
                    key={s}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: active ? '40px' : '16px',
                      backgroundColor: active ? '#1b5e8a' : done ? '#1a6b56' : '#E2DDD5',
                    }}
                  />
                )
              })}
              <span className="ml-auto text-[10px] font-mono text-brand-muted-light">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="bg-white px-6 py-5">
          {/* Skip */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-4 text-[11px] text-brand-muted hover:text-brand-accent transition-colors z-20"
          >
            Skip
          </button>

          {/* ── Step 0: Welcome ── */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-full h-full" style={{ opacity: 0.2 }}>
                  <GradientFOL variant="full" spinDur={30} colorDur={8} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b5e8a" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
                Welcome to Change Engine
              </h2>
              <p className="text-sm text-brand-muted mb-1 max-w-xs mx-auto">
                Houston&apos;s civic life — officials, services, organizations, opportunities — all in one place.
              </p>
              <p className="text-sm text-brand-muted mb-6 max-w-xs mx-auto">
                Three quick questions to personalize your experience.
              </p>
              <button
                onClick={handleGetStarted}
                className="w-full max-w-xs mx-auto py-3 bg-brand-accent text-white font-semibold text-sm hover:brightness-110 transition-all"
              >
                Get started
              </button>
            </div>
          )}

          {/* ── Step 1: Address ── */}
          {step === 'address' && (
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
                Where are you?
              </h2>
              <p className="text-sm text-brand-muted mb-5 max-w-sm mx-auto">
                Your address helps us show you your officials, nearby services, and what&apos;s happening in your area.
              </p>
              <form onSubmit={handleAddressSubmit} className="max-w-sm mx-auto">
                <div
                  className="flex items-center gap-2 border-2 px-4 py-3 bg-white mb-2 transition-colors"
                  style={{
                    borderColor: error ? '#C53030' : '#0d1117',
                    
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b5e8a" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <input
                    type="text"
                    value={input}
                    onChange={function (e) { setInput(e.target.value); setError('') }}
                    placeholder="ZIP code or street address"
                    autoFocus
                    disabled={isLoading}
                    className="flex-1 text-sm bg-transparent text-brand-text placeholder:text-brand-muted focus:outline-none"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs text-[#C53030] mb-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={input.trim().length < 3 || isLoading}
                  className="w-full py-3 bg-brand-text text-white font-semibold text-sm disabled:opacity-30 hover:bg-brand-accent transition-colors"
                 
                >
                  {isLoading ? 'Looking up...' : 'Find my community'}
                </button>
              </form>
              <button
                onClick={function () { setStep('intent') }}
                className="mt-3 text-xs text-brand-muted hover:text-brand-accent transition-colors"
              >
                I&apos;ll add my location later
              </button>
            </div>
          )}

          {/* ── Step 2: Intent ── */}
          {step === 'intent' && (
            <div className="text-center">
              {(neighborhood || zip) && (
                <p className="text-[11px] font-mono uppercase tracking-widest text-brand-accent mb-1">
                  {neighborhood?.neighborhood_name || ('ZIP ' + zip)}
                </p>
              )}
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
                What brings you here?
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                Pick one. You can always explore everything.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONAS.map(function (p) {
                  return (
                    <button
                      key={p.slug}
                      onClick={function () { handlePersonaSelect(p.slug) }}
                      className="relative text-left border border-brand-border p-4 overflow-hidden hover:border-brand-accent hover:-translate-y-0.5 transition-all group"
                     
                    >
                      {/* FOL watermark per card */}
                      <Image
                        src={p.fol}
                        alt="" aria-hidden="true"
                        className="absolute pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
                        style={{ width: '60px', height: '60px', top: '-8px', right: '-8px' }}
                       width={60} height={60} />
                      <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: p.color }} />
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
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
                What do you care about?
              </h2>
              <p className="text-sm text-brand-muted mb-4">
                Pick as many as you want.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {PATHWAY_OPTIONS.map(function (pw) {
                  const selected = interests.includes(pw.id)
                  return (
                    <button
                      key={pw.id}
                      onClick={function () { toggleInterest(pw.id) }}
                      className="flex items-center gap-2 px-4 py-2 border-2 transition-all text-sm font-medium"
                      style={{
                        borderColor: selected ? pw.color : '#E2DDD5',
                        backgroundColor: selected ? pw.color + '12' : 'white',
                        color: selected ? pw.color : '#6B6560',
                        border: selected ? '2px solid ' + pw.color : undefined,
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full transition-transform"
                        style={{
                          backgroundColor: pw.color,
                          transform: selected ? 'scale(1.3)' : 'scale(1)',
                        }}
                      />
                      {pw.name}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleFinish}
                className="w-full max-w-xs mx-auto py-3 bg-brand-accent text-white font-semibold text-sm hover:brightness-110 transition-all"
              >
                Show me my community
              </button>
            </div>
          )}
        </div>

        {/* Bottom spectrum bar */}
        <div className="flex h-0.5">
          <div className="flex-1" style={{ background: '#7a2018' }} />
          <div className="flex-1" style={{ background: '#1e4d7a' }} />
          <div className="flex-1" style={{ background: '#4a2870' }} />
          <div className="flex-1" style={{ background: '#1a6b56' }} />
          <div className="flex-1" style={{ background: '#1b5e8a' }} />
          <div className="flex-1" style={{ background: '#1a5030' }} />
          <div className="flex-1" style={{ background: '#4a2870' }} />
        </div>
      </div>
    </div>
  )
}
