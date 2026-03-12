import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { User, ExternalLink } from 'lucide-react'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Candidates — Community Exchange',
  description: 'Candidates running for office in the Houston area.',
}

export default async function CandidatesPage() {
  const supabase = await createClient()
  const { data: candidates } = await supabase
    .from('candidates')
    .select('candidate_id, candidate_name, office_sought, office_level, district, party, incumbent, photo_url, bio_summary, campaign_website')
    .eq('is_active', 'true')
    .order('office_level, office_sought, candidate_name')

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="seed" gradientColor="#e53e3e" title="Candidates" subtitle="Get to know the candidates running for office in Houston and Harris County." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Elections', href: '/elections' }, { label: 'Candidates' }]} />
        <div className="space-y-4 mt-4">
          {(candidates || []).map(function (c) {
            return (
              <Link key={c.candidate_id} href={`/candidates/${c.candidate_id}`} className="block bg-white border border-brand-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {c.photo_url ? (
                    <Image src={c.photo_url} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0"  width={80} height={56} />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0"><User className="w-6 h-6 text-brand-muted" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-brand-text">{c.candidate_name}</h3>
                      {c.incumbent === 'true' && <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded font-medium">Incumbent</span>}
                    </div>
                    <p className="text-sm text-brand-muted">{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
                    {c.bio_summary && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{c.bio_summary}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
                      {c.party && <span>{c.party}</span>}
                      {c.office_level && <span>{c.office_level}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
