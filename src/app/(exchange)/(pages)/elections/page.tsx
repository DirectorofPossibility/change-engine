import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getElectionDashboard } from '@/lib/data/exchange'
import { VotingDashboardClient } from './VotingDashboardClient'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300


export const metadata: Metadata = {
  title: 'Elections & Voting — The Change Engine',
  description: 'Upcoming elections, who represents you, key dates, and everything you need to participate.',
}

export default async function ElectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>
}) {
  const { zip: paramZip } = await searchParams
  const cookieStore = await cookies()
  const zip = paramZip || cookieStore.get('zip')?.value || undefined
  const data = await getElectionDashboard(zip)

  const nextElection = data.upcomingElections.length > 0 ? data.upcomingElections[0] : null
  const totalOfficials = data.officialsByLevel.federal.length +
    data.officialsByLevel.state.length +
    data.officialsByLevel.county.length +
    data.officialsByLevel.city.length

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={600} height={600} className="opacity-[0.04]" />
        </div>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-24">
          <p style={{ fontSize: 11, letterSpacing: '0.12em', color: "#1b5e8a", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 className="mt-4" style={{ fontSize: 44, lineHeight: 1.1,  }}>
            Elections & Voting
          </h1>
          <p className="mt-4 max-w-[560px]" style={{ fontSize: 17, lineHeight: 1.7, color: "#5c6474" }}>
            Your vote is your voice. Here's everything you need — upcoming elections,
            key deadlines, who represents you, and how to make sure your ballot counts.
          </p>

          {/* Register to Vote CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://www.votetexas.gov/register-to-vote/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider bg-blue text-white px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Register to Vote
            </a>
            <Link
              href="/polling-places"
              className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider border-2 border-ink text-ink px-5 py-2.5 hover:bg-ink hover:text-white transition-colors"
            >
              Find Polling Places
            </Link>
          </div>

          {/* Quick stats strip */}
          <div className="mt-8 flex flex-wrap gap-8">
            {nextElection && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#5c6474", textTransform: 'uppercase' }}>
                  Next Election
                </p>
                <p className="mt-1" style={{ fontSize: 15,  }}>
                  {nextElection.election_name}
                </p>
              </div>
            )}
            {data.upcomingElections.length > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#5c6474", textTransform: 'uppercase' }}>
                  Upcoming
                </p>
                <p className="mt-1" style={{ fontSize: 22, fontWeight: 'bold', color: "#1b5e8a" }}>
                  {data.upcomingElections.length}
                </p>
              </div>
            )}
            {zip && totalOfficials > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', color: "#5c6474", textTransform: 'uppercase' }}>
                  Your Representatives
                </p>
                <p className="mt-1" style={{ fontSize: 22, fontWeight: 'bold', color: "#1b5e8a" }}>
                  {totalOfficials}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{ height: 1, background: '#dde1e8' }} />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: 11, letterSpacing: '0.06em', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Elections & Voting</span>
        </nav>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Image src="/images/fol/seed-of-life.svg" alt="" width={60} height={60} className="opacity-20 mx-auto animate-pulse" />
              <p className="mt-4" style={{ fontSize: 14, color: "#5c6474" }}>Loading your voting guide...</p>
            </div>
          </div>
        }>
          <VotingDashboardClient
            pastElections={data.pastElections}
            upcomingElections={data.upcomingElections}
            civicEvents={data.civicEvents}
            recentCandidates={data.recentCandidates}
            recentBallotItems={data.recentBallotItems}
            upcomingCandidates={data.upcomingCandidates}
            upcomingBallotItems={data.upcomingBallotItems}
            officialsByLevel={data.officialsByLevel}
            relatedContent={data.relatedContent}
            zip={zip}
          />
        </Suspense>
      </div>

      {/* Cross-links */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div className="border-t border-rule pt-8">
          <p className="font-mono text-micro uppercase tracking-wider text-faint mb-4">Related</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/officials" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Your Officials</p>
              <p className="font-body text-sm text-muted">See who represents you</p>
            </Link>
            <Link href="/policies" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Policies</p>
              <p className="font-body text-sm text-muted">Legislation and ordinances</p>
            </Link>
            <Link href="/call-your-senators" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Call Your Senators</p>
              <p className="font-body text-sm text-muted">Make your voice heard</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
