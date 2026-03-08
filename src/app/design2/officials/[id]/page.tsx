import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import Image from 'next/image'

export const revalidate = 600

/* ── Level badge colors ── */
function levelBadge(level: string | null): { bg: string; text: string; border: string } {
  switch (level) {
    case 'Federal':
      return { bg: '#EBF4FF', text: '#3182ce', border: '#BEE3F8' }
    case 'State':
      return { bg: '#FEFCBF', text: '#d69e2e', border: '#FAF089' }
    case 'County':
      return { bg: '#C6F6D5', text: '#38a169', border: '#9AE6B4' }
    case 'City':
      return { bg: '#E9D8FD', text: '#805ad5', border: '#D6BCFA' }
    default:
      return { bg: '#EDF2F7', text: '#718096', border: '#E2E8F0' }
  }
}

/* ── Focus area tag palette ── */
const TAG_COLORS = [
  { bg: '#EBF4FF', text: '#3182ce', border: '#BEE3F8' },
  { bg: '#C6F6D5', text: '#38a169', border: '#9AE6B4' },
  { bg: '#E9D8FD', text: '#805ad5', border: '#D6BCFA' },
  { bg: '#FEEBC8', text: '#C05621', border: '#FBD38D' },
  { bg: '#B2F5EA', text: '#2C7A7B', border: '#81E6D9' },
  { bg: '#FED7D7', text: '#C53030', border: '#FEB2B2' },
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

/* ── Metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('elected_officials')
    .select('official_name, title')
    .eq('official_id', id)
    .single()

  if (!data) return { title: 'Official Not Found' }
  return {
    title: `${data.official_name} — Community Exchange`,
    description: data.title || `Details about ${data.official_name}`,
  }
}

/* ── Page ── */
export default async function OfficialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Parallel fetch: official, profile, junctions, committees, votes
  const [
    { data: official },
    { data: profileRow },
    { data: policyJunctions },
    { data: focusJunctions },
    { data: committees },
    { data: votes },
  ] = await Promise.all([
    supabase.from('elected_officials').select('*').eq('official_id', id).single(),
    supabase.from('official_profiles' as any).select('*').eq('official_id', id).single(),
    supabase.from('policy_officials').select('policy_id').eq('official_id', id),
    supabase.from('official_focus_areas').select('focus_id').eq('official_id', id),
    supabase
      .from('committee_assignments' as any)
      .select('committee_name, role, chamber')
      .eq('official_id', id)
      .order('committee_name'),
    supabase
      .from('vote_records' as any)
      .select('bill_number, vote, vote_date, policy_id')
      .eq('official_id', id)
      .order('vote_date', { ascending: false })
      .limit(20),
  ])

  if (!official) notFound()

  const profile = profileRow as unknown as {
    bio_short?: string | null
    photo_url?: string | null
    phone_office?: string | null
    address_office?: string | null
    address_district?: string | null
    social_twitter?: string | null
    social_facebook?: string | null
    social_instagram?: string | null
    social_linkedin?: string | null
  } | null

  // Second batch: resolve junction IDs
  const policyIds = (policyJunctions ?? []).map((j) => j.policy_id)
  const focusAreaIds = (focusJunctions ?? []).map((j) => j.focus_id)

  const [policiesResult, focusAreasResult] = await Promise.all([
    policyIds.length > 0
      ? supabase.from('policies').select('*').in('policy_id', policyIds)
      : Promise.resolve({ data: [] as any[] }),
    focusAreaIds.length > 0
      ? supabase
          .from('focus_areas')
          .select('focus_id, focus_area_name')
          .in('focus_id', focusAreaIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const policies = policiesResult.data ?? []
  const focusAreas = (focusAreasResult.data ?? []) as Array<{
    focus_id: string
    focus_area_name: string
  }>

  const committeeList = (committees ?? []) as unknown as Array<{
    committee_name: string
    role: string | null
    chamber: string | null
  }>

  const voteList = (votes ?? []) as unknown as Array<{
    bill_number: string | null
    vote: string
    vote_date: string | null
    policy_id: string | null
  }>

  // Wayfinder + auth
  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('official', id, userProfile?.role)

  // Derived display values
  const rawPhotoUrl = profile?.photo_url || (official as any).photo_url
  const photoUrl = rawPhotoUrl?.replace(/^http:\/\//, 'https://') ?? null
  const bio = profile?.bio_short || official.description_5th_grade
  const badge = levelBadge(official.level)

  const socialLinks = [
    profile?.social_twitter && { label: 'Twitter', url: profile.social_twitter },
    profile?.social_facebook && { label: 'Facebook', url: profile.social_facebook },
    profile?.social_instagram && { label: 'Instagram', url: profile.social_instagram },
    profile?.social_linkedin && { label: 'LinkedIn', url: profile.social_linkedin },
  ].filter(Boolean) as Array<{ label: string; url: string }>

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Back bar */}
      <div className="border-b" style={{ borderColor: '#E2DDD5' }}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/design2/officials"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Officials
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Main column ── */}
          <div className="min-w-0 flex-1">
            {/* Header card */}
            <div
              className="rounded-xl border p-6 sm:p-8"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {/* Photo */}
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={official.official_name}
                    className="h-28 w-28 flex-shrink-0 rounded-full border-4 object-cover"
                    style={{ borderColor: '#E2DDD5' }}
                   width={112} height={80} />
                ) : (
                  <div
                    className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border-4 text-2xl font-bold text-white"
                    style={{ borderColor: '#E2DDD5', backgroundColor: badge.text }}
                  >
                    {official.official_name
                      .split(' ')
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left">
                  {/* Level + Party badges */}
                  <div className="mb-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {official.level && (
                      <span
                        className="inline-block rounded-lg px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {official.level}
                      </span>
                    )}
                    {official.party && (
                      <span
                        className="inline-block rounded-lg px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: '#F7FAFC',
                          color: '#4A4540',
                          border: '1px solid #E2DDD5',
                        }}
                      >
                        {official.party}
                      </span>
                    )}
                  </div>

                  <h1
                    className="font-serif text-3xl font-bold leading-tight lg:text-4xl"
                    style={{ color: '#1A1A1A' }}
                  >
                    {official.official_name}
                  </h1>

                  {official.title && (
                    <p className="mt-1 text-lg" style={{ color: '#6B6560' }}>
                      {official.title}
                    </p>
                  )}

                  {official.jurisdiction && (
                    <p className="mt-1 text-sm" style={{ color: '#6B6560' }}>
                      {official.jurisdiction}
                    </p>
                  )}

                  {official.term_end && (
                    <p className="mt-1 text-sm" style={{ color: '#6B6560' }}>
                      Term ends {formatDate(official.term_end)}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div className="mt-6 border-t pt-5" style={{ borderColor: '#E2DDD5' }}>
                  <p className="leading-relaxed" style={{ color: '#4A4540' }}>
                    {bio}
                  </p>
                </div>
              )}
            </div>

            {/* Contact card */}
            {(profile?.phone_office ||
              official.email ||
              official.website ||
              profile?.address_office ||
              profile?.address_district ||
              socialLinks.length > 0) && (
              <div
                className="mt-6 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
              >
                <h2
                  className="font-serif text-xl font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Contact
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(profile?.phone_office || official.office_phone) && (
                    <a
                      href={`tel:${profile?.phone_office || official.office_phone}`}
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#FAF8F5', color: '#C75B2A' }}
                    >
                      <Phone size={18} className="flex-shrink-0" />
                      {profile?.phone_office || official.office_phone}
                    </a>
                  )}
                  {official.email && (
                    <a
                      href={`mailto:${official.email}`}
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#FAF8F5', color: '#C75B2A' }}
                    >
                      <Mail size={18} className="flex-shrink-0" />
                      <span className="truncate">{official.email}</span>
                    </a>
                  )}
                  {official.website && (
                    <a
                      href={official.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#FAF8F5', color: '#C75B2A' }}
                    >
                      <Globe size={18} className="flex-shrink-0" />
                      Website
                    </a>
                  )}
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#FAF8F5', color: '#C75B2A' }}
                    >
                      <Globe size={18} className="flex-shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>

                {/* Addresses */}
                {(profile?.address_office || profile?.address_district) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {profile.address_office && (
                      <div
                        className="flex items-start gap-3 rounded-lg p-3 text-sm"
                        style={{ backgroundColor: '#FAF8F5', color: '#4A4540' }}
                      >
                        <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#6B6560' }} />
                        <div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: '#6B6560' }}
                          >
                            Office
                          </span>
                          <p className="mt-0.5">{profile.address_office}</p>
                        </div>
                      </div>
                    )}
                    {profile.address_district && (
                      <div
                        className="flex items-start gap-3 rounded-lg p-3 text-sm"
                        style={{ backgroundColor: '#FAF8F5', color: '#4A4540' }}
                      >
                        <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#6B6560' }} />
                        <div>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: '#6B6560' }}
                          >
                            District Office
                          </span>
                          <p className="mt-0.5">{profile.address_district}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <div
                className="mt-6 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
              >
                <h2
                  className="font-serif text-xl font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Focus Areas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((fa, i) => {
                    const tc = TAG_COLORS[i % TAG_COLORS.length]
                    return (
                      <Link
                        key={fa.focus_id}
                        href={`/design2/explore?focus=${fa.focus_id}`}
                        className="inline-block rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: tc.bg,
                          color: tc.text,
                          border: `1px solid ${tc.border}`,
                        }}
                      >
                        {fa.focus_area_name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Committee Assignments */}
            {committeeList.length > 0 && (
              <div
                className="mt-6 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
              >
                <h2
                  className="font-serif text-xl font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Committee Assignments
                </h2>
                <div className="space-y-3">
                  {committeeList.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 rounded-lg border p-4"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium" style={{ color: '#1A1A1A' }}>
                          {c.committee_name}
                        </p>
                        {c.chamber && (
                          <p className="mt-0.5 text-xs" style={{ color: '#6B6560' }}>
                            {c.chamber}
                          </p>
                        )}
                      </div>
                      {c.role && (
                        <span
                          className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: '#E9D8FD',
                            color: '#805ad5',
                            border: '1px solid #D6BCFA',
                          }}
                        >
                          {c.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vote Records */}
            {voteList.length > 0 && (
              <div
                className="mt-6 rounded-xl border overflow-hidden"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
              >
                <div className="p-6 pb-0">
                  <h2
                    className="font-serif text-xl font-bold mb-4"
                    style={{ color: '#1A1A1A' }}
                  >
                    Recent Votes
                  </h2>
                </div>
                <div className="divide-y" style={{ borderColor: '#E2DDD5' }}>
                  {voteList.map((v, i) => {
                    const voteColor =
                      v.vote === 'Yea'
                        ? { bg: '#C6F6D5', text: '#276749' }
                        : v.vote === 'Nay'
                          ? { bg: '#FED7D7', text: '#9B2C2C' }
                          : { bg: '#EDF2F7', text: '#4A5568' }

                    const inner = (
                      <div className="flex items-center justify-between gap-3 px-6 py-4">
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: '#1A1A1A' }}
                          >
                            {v.bill_number || 'Vote'}
                          </p>
                          {v.vote_date && (
                            <p className="mt-0.5 text-xs" style={{ color: '#6B6560' }}>
                              {formatDate(v.vote_date)}
                            </p>
                          )}
                        </div>
                        <span
                          className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: voteColor.bg,
                            color: voteColor.text,
                          }}
                        >
                          {v.vote}
                        </span>
                      </div>
                    )

                    return v.policy_id ? (
                      <Link
                        key={i}
                        href={`/design2/policies/${v.policy_id}`}
                        className="block transition-colors hover:bg-[#FAF8F5]/50"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={i}>{inner}</div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Policies */}
            {policies.length > 0 && (
              <div className="mt-6">
                <h2
                  className="font-serif text-xl font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Policies &amp; Legislation
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {policies.map((p: any) => (
                    <Link
                      key={p.policy_id}
                      href={`/design2/policies/${p.policy_id}`}
                      className="group rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}
                    >
                      <p
                        className="font-medium leading-snug group-hover:underline"
                        style={{ color: '#1A1A1A' }}
                      >
                        {p.title_6th_grade || p.policy_name}
                      </p>
                      {p.bill_number && (
                        <p className="mt-1 text-xs" style={{ color: '#6B6560' }}>
                          {p.bill_number}
                          {p.status && ` -- ${p.status}`}
                        </p>
                      )}
                      {(p.summary_6th_grade || p.summary_5th_grade) && (
                        <p
                          className="mt-2 text-sm line-clamp-2"
                          style={{ color: '#4A4540' }}
                        >
                          {p.summary_6th_grade || p.summary_5th_grade}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar: Wayfinder ── */}
          <aside className="w-full lg:w-[340px] lg:flex-shrink-0">
            <DetailWayfinder
              data={wayfinderData}
              currentType="official"
              currentId={id}
              userRole={userProfile?.role}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
