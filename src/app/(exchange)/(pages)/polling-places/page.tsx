import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PollingPlaceClient } from './PollingPlaceClient'
import { FlowerOfLife } from '@/components/geo/sacred'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Find Where to Vote',
  description: 'Find where to vote. Early voting, Election Day, and mail ballots — enter your address and get your polling place in thirty seconds.',
}

export default async function PollingPlacesPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'en') as 'en' | 'es' | 'vi'
  const t = getUIStrings(lang)

  const { data: upcoming } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)

  const activeElection = upcoming && upcoming.length > 0 ? upcoming[0] : null

  return (
    <div>
      {/* Masthead */}
      <div className="bg-ink border-b-2 border-ink">
        <div className="max-w-[1080px] mx-auto px-6 py-10 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-[0.06]">
            <FlowerOfLife color="#ffffff" size={180} />
          </div>
          <span className="inline-block font-mono text-[.62rem] uppercase tracking-[0.12em] text-teal border border-teal/30 px-2.5 py-1 mb-4">
            {t('polling.hook')}
          </span>
          <h1 className="font-display text-3xl sm:text-[2.5rem] font-bold text-white leading-tight mb-3">
            {t('polling.title')}
          </h1>
          <p className="font-body text-[1.05rem] text-white/70 max-w-[600px] mb-2">
            {t('polling.subhead')}
          </p>
          <p className="font-body text-[.9rem] text-white/50 max-w-[520px]">
            {t('polling.subtitle')}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1080px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Main column — search + results */}
          <div>
            <PollingPlaceClient activeElection={activeElection} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:border-l lg:border-rule lg:pl-8">
            {activeElection && (
              <ElectionCountdown
                electionName={activeElection.election_name}
                electionDate={activeElection.election_date}
                earlyVotingStart={activeElection.early_voting_start}
                earlyVotingEnd={activeElection.early_voting_end}
                registrationDeadline={activeElection.registration_deadline}
                electionType={activeElection.election_type}
              />
            )}

            {/* Quick links */}
            <div className="border-2 border-ink">
              <div className="border-b border-rule px-5 py-3">
                <span className="font-mono text-[.62rem] uppercase tracking-[0.08em] text-faint">
                  {t('detail.helpful_links')}
                </span>
              </div>
              <div className="px-5 py-3 space-y-2">
                <a
                  href="https://www.votetexas.gov/voting/where.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-body text-[.85rem] text-blue hover:text-ink transition-colors"
                >
                  VoteTexas.gov &rarr;
                </a>
                <a
                  href="https://www.harrisvotes.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-body text-[.85rem] text-blue hover:text-ink transition-colors"
                >
                  HarrisVotes.com &rarr;
                </a>
                <a
                  href="https://www.vote.org/register-to-vote/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-body text-[.85rem] text-blue hover:text-ink transition-colors"
                >
                  Register to Vote &rarr;
                </a>
              </div>
            </div>

            {/* Support numbers */}
            <div className="border-t border-rule pt-4">
              <span className="font-mono text-[.62rem] uppercase tracking-[0.08em] text-faint block mb-2">
                {t('d2nav.support')}
              </span>
              <div className="space-y-1 font-mono text-[.68rem] text-dim">
                <p>Harris County Elections: <strong className="text-ink">713-755-6965</strong></p>
                <p>TX SOS Voter Hotline: <strong className="text-ink">1-800-252-8683</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
