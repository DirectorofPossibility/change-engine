import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PollingPlaceClient } from './PollingPlaceClient'

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <p style={{ fontFamily: MONO, fontSize: 12, color: CLAY, letterSpacing: '0.08em' }} className="uppercase mb-2">
            {t('polling.hook')}
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            {t('polling.title')}
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 17 }} className="max-w-[600px] leading-relaxed">
            {t('polling.subhead')}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">
          <Link href="/elections" className="hover:underline" style={{ color: CLAY }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>Polling Places</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Main column */}
          <div>
            <PollingPlaceClient activeElection={activeElection} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Helpful links */}
            <div className="border" style={{ borderColor: RULE_COLOR }}>
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${RULE_COLOR}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }} className="uppercase">
                  {t('detail.helpful_links')}
                </span>
              </div>
              <div className="px-5 py-3 space-y-2">
                <a
                  href="https://www.votetexas.gov/voting/where.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: SERIF, fontSize: 14, color: CLAY }}
                  className="block hover:underline"
                >
                  VoteTexas.gov &rarr;
                </a>
                <a
                  href="https://www.harrisvotes.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: SERIF, fontSize: 14, color: CLAY }}
                  className="block hover:underline"
                >
                  HarrisVotes.com &rarr;
                </a>
                <a
                  href="https://www.vote.org/register-to-vote/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: SERIF, fontSize: 14, color: CLAY }}
                  className="block hover:underline"
                >
                  Register to Vote &rarr;
                </a>
              </div>
            </div>

            {/* Support numbers */}
            <div style={{ borderTop: `1px solid ${RULE_COLOR}` }} className="pt-4">
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }} className="uppercase block mb-2">
                {t('d2nav.support')}
              </span>
              <div className="space-y-1" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                <p>Harris County Elections: <strong style={{ color: INK }}>713-755-6965</strong></p>
                <p>TX SOS Voter Hotline: <strong style={{ color: INK }}>1-800-252-8683</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
        <div className="text-center pb-12">
          <Link href="/elections" style={{ fontFamily: MONO, color: CLAY, fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Elections
          </Link>
        </div>
      </div>
    </div>
  )
}
