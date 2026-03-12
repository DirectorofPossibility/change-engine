import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getElectionDashboard } from '@/lib/data/exchange'
import { VotingDashboardClient } from './VotingDashboardClient'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={600} height={600} className="opacity-[0.04]" />
        </div>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-24">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 className="mt-4" style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1.1, color: INK }}>
            Elections & Voting
          </h1>
          <p className="mt-4 max-w-[560px]" style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, color: MUTED }}>
            Your vote is your voice. Here's everything you need — upcoming elections,
            key deadlines, who represents you, and how to make sure your ballot counts.
          </p>

          {/* Quick stats strip */}
          <div className="mt-8 flex flex-wrap gap-8">
            {nextElection && (
              <div>
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>
                  Next Election
                </p>
                <p className="mt-1" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                  {nextElection.election_name}
                </p>
              </div>
            )}
            {data.upcomingElections.length > 0 && (
              <div>
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>
                  Upcoming
                </p>
                <p className="mt-1" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 'bold', color: CLAY }}>
                  {data.upcomingElections.length}
                </p>
              </div>
            )}
            {zip && totalOfficials > 0 && (
              <div>
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>
                  Your Representatives
                </p>
                <p className="mt-1" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 'bold', color: CLAY }}>
                  {totalOfficials}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{ height: 1, background: RULE_COLOR }} />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
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
              <p className="mt-4" style={{ fontFamily: SERIF, fontSize: 14, color: MUTED }}>Loading your voting guide...</p>
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

      {/* ── Footer rule ── */}
      <div className="max-w-[900px] mx-auto px-6">
        <div style={{ height: 1, background: RULE_COLOR }} />
        <div className="py-8 text-center">
          <Link href="/exchange" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
            &larr; Back to The Community Exchange
          </Link>
        </div>
      </div>
    </div>
  )
}
