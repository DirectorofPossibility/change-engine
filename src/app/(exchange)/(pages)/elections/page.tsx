import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCivicHubData, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { CivicHubClient } from './CivicHubClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Civic Hub — Your Government at Every Level',
  description: 'Explore elected officials, policies, and elections organized by government level for Houston, Harris County, Texas, and federal.',
}

export default async function CivicHubPage() {
  const { officials, policies, elections, upcomingElection, linkedinProfiles } = await getCivicHubData()

  // Fetch translations for non-English visitors
  const langId = await getLangId()
  let officialTranslations = {}
  let policyTranslations = {}
  if (langId) {
    const [ot, pt] = await Promise.all([
      fetchTranslationsForTable('elected_officials', officials.map(function (o) { return o.official_id }), langId),
      fetchTranslationsForTable('policies', policies.map(function (p) { return p.policy_id }), langId),
    ])
    officialTranslations = ot
    policyTranslations = pt
  }

  return (
    <div>
      <PageHero
        variant="editorial"
        titleKey="elections.title"
        subtitleKey="elections.subtitle"
        intro={PAGE_INTROS.elections}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Elections' }]} />
        {/* Election countdown banner */}
        {upcomingElection && (
          <div className="mb-10">
            <Link href={'/elections/' + upcomingElection.election_id}>
              <ElectionCountdown
                electionName={upcomingElection.election_name}
                electionDate={upcomingElection.election_date}
                earlyVotingStart={upcomingElection.early_voting_start}
                earlyVotingEnd={upcomingElection.early_voting_end}
                registrationDeadline={upcomingElection.registration_deadline}
                electionType={upcomingElection.election_type}
              />
            </Link>
          </div>
        )}

        <Suspense fallback={<div className="text-brand-muted py-12 text-center">Loading civic data...</div>}>
          <CivicHubClient
            officials={officials}
            policies={policies}
            elections={elections}
            officialTranslations={officialTranslations}
            policyTranslations={policyTranslations}
            linkedinProfiles={linkedinProfiles}
          />
        </Suspense>
      </div>
    </div>
  )
}
