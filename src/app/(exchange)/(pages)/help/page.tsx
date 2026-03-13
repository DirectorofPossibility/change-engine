/**
 * @fileoverview Help / Available Resources listing page.
 *
 * Displays all life situations organized by urgency level, with editorial
 * culture guide aesthetic. Includes a crisis resource banner.
 *
 * @datasource Supabase tables: life_situations, translations
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /help
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getLifeSituations, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { HelpCrisisBanner } from './HelpCrisisBanner'
import { HelpListClient } from './HelpListClient'

export const revalidate = 300


export const metadata: Metadata = {
  title: 'Find Help — Change Engine',
  description: 'Find services and resources for food, housing, healthcare, jobs, and more in Houston.',
}

export default async function HelpPage() {
  const situations = await getLifeSituations()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('life_situations', situations.map(s => s.situation_id), langId)
    : {}

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p className="font-mono text-micro uppercase tracking-widest text-muted mb-4">
            Change Engine
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mb-4">
            Find Help
          </h1>
          <p className="font-body text-lg text-muted max-w-xl mx-auto leading-relaxed">
            Search for food, housing, healthcare, jobs, and more in Houston. Type what you need below.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav className="font-mono text-micro text-muted">
          <Link href="/" className="text-blue hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Find Help</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <HelpCrisisBanner />
        <HelpListClient situations={situations} translations={translations} />

        {/* Cross-links */}
        <div className="mt-10 pt-8 border-t border-rule">
          <p className="font-mono text-micro uppercase tracking-wider text-faint mb-4">You might also need</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/services" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Service Directory</p>
              <p className="font-body text-sm text-muted">Browse 211 services by category</p>
            </Link>
            <Link href="/officials/lookup" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Find Your Rep</p>
              <p className="font-body text-sm text-muted">Look up who represents you</p>
            </Link>
            <Link href="/opportunities" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Get Involved</p>
              <p className="font-body text-sm text-muted">Volunteer and community opportunities</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
