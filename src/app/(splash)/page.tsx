'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export default function SplashPage() {
  const [betaEmail, setBetaEmail] = useState('')
  const [betaName, setBetaName] = useState('')
  const [sent, setSent] = useState(false)

  function handleBeta(e: React.FormEvent) {
    e.preventDefault()
    const body = encodeURIComponent(
      `Name: ${betaName}\nEmail: ${betaEmail}\n\nI'd like to be a beta tester for The Change Engine Community Exchange.`
    )
    window.location.href = `mailto:hello@thechangelab.net?subject=${encodeURIComponent('Beta Tester Request')}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center relative overflow-hidden">
      {/* Background decorative FOLs */}
      <div className="absolute top-[-120px] left-[-120px] opacity-[0.03]">
        <FlowerOfLifeIcon size={400} color="#C75B2A" />
      </div>
      <div className="absolute bottom-[-100px] right-[-100px] opacity-[0.03]">
        <FlowerOfLifeIcon size={350} color="#C75B2A" />
      </div>
      <div className="absolute top-[55%] left-[65%] opacity-[0.02]">
        <FlowerOfLifeIcon size={250} color="#C75B2A" />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center px-6 w-full max-w-2xl pt-16 sm:pt-24">
        <FlowerOfLifeIcon size={200} className="mx-auto mb-8" />

        <h1 className="text-5xl sm:text-7xl font-serif font-bold text-[#2C2C2C] mb-6 tracking-tight">
          The Change Engine
        </h1>

        <p className="text-xl sm:text-2xl text-[#6B6560] font-serif mb-3 max-w-lg mx-auto leading-relaxed">
          Every community has what it needs to thrive.
        </p>
        <p className="text-base text-[#6B6560] font-sans mb-10 max-w-md mx-auto leading-relaxed">
          We&apos;re building a civic platform that connects Houston residents with the resources, services, and opportunities already around them.
        </p>

        <div className="inline-block px-8 py-3 rounded-full border-2 border-[#C75B2A] text-[#C75B2A] text-sm font-mono font-bold uppercase tracking-[0.2em]">
          Coming Soon
        </div>
      </div>

      {/* Can you imagine */}
      <div className="relative z-10 w-full max-w-2xl px-6 mt-16">
        <div className="bg-white rounded-2xl border-2 border-[#D1D5E0] p-8 sm:p-10" style={{ boxShadow: '4px 4px 0 #D1D5E0' }}>
          <p className="text-sm font-mono font-bold uppercase tracking-wider text-[#C75B2A] mb-5">Can you imagine...</p>
          <ul className="space-y-4 text-[#2C2C2C] text-base leading-relaxed">
            <li className="flex gap-3">
              <span className="text-[#C75B2A] font-serif text-xl leading-none mt-0.5">&bull;</span>
              <span>Knowing exactly who represents you at every level of government — and how to reach them</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C75B2A] font-serif text-xl leading-none mt-0.5">&bull;</span>
              <span>Finding every service, benefit, and resource available in your ZIP code — in one place</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C75B2A] font-serif text-xl leading-none mt-0.5">&bull;</span>
              <span>Understanding the policies being passed in your name — written so anyone can follow along</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C75B2A] font-serif text-xl leading-none mt-0.5">&bull;</span>
              <span>A community where neighbors share what they know — and everyone gets stronger</span>
            </li>
          </ul>
          <p className="mt-6 text-[#6B6560] text-sm italic">
            That&apos;s what we&apos;re building. And we&apos;d love for you to be part of it.
          </p>
        </div>
      </div>

      {/* Beta tester signup */}
      <div className="relative z-10 w-full max-w-md px-6 mt-12">
        {sent ? (
          <div className="bg-white rounded-xl border-2 border-[#38a169]/30 p-6 text-center" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
            <p className="text-[#38a169] font-semibold mb-1">You&apos;re on the list!</p>
            <p className="text-sm text-[#6B6560]">Complete the email that just opened to send your request.</p>
          </div>
        ) : (
          <form onSubmit={handleBeta} className="bg-white rounded-xl border-2 border-[#D1D5E0] p-6 space-y-4" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
            <p className="text-center text-sm font-semibold text-[#2C2C2C]">Sign up to be a beta tester</p>
            <div>
              <input
                type="text"
                required
                value={betaName}
                onChange={function (e) { setBetaName(e.target.value) }}
                className="w-full px-3 py-2.5 border-2 border-[#D1D5E0] rounded-lg text-sm focus:outline-none focus:border-[#C75B2A]"
                placeholder="Your name"
              />
            </div>
            <div>
              <input
                type="email"
                required
                value={betaEmail}
                onChange={function (e) { setBetaEmail(e.target.value) }}
                className="w-full px-3 py-2.5 border-2 border-[#D1D5E0] rounded-lg text-sm focus:outline-none focus:border-[#C75B2A]"
                placeholder="Your email"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#C75B2A] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Request Beta Access
            </button>
          </form>
        )}
      </div>

      {/* Links */}
      <div className="relative z-10 mt-10 mb-16 flex flex-col sm:flex-row items-center justify-center gap-5">
        <Link
          href="/login"
          className="text-sm font-medium text-[#2C2C2C] hover:text-[#C75B2A] transition-colors"
        >
          Sign In
        </Link>
        <span className="hidden sm:inline text-[#D1D5E0]">|</span>
        <a
          href="https://thechangelab.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#6B6560] hover:text-[#C75B2A] transition-colors"
        >
          Read our Substack
        </a>
        <span className="hidden sm:inline text-[#D1D5E0]">|</span>
        <Link
          href="/exchange"
          className="text-sm text-[#6B6560] hover:text-[#C75B2A] transition-colors underline underline-offset-4 decoration-[#D1D5E0] hover:decoration-[#C75B2A]"
        >
          Preview the Community Exchange
        </Link>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C75B2A] to-transparent" />
    </div>
  )
}
