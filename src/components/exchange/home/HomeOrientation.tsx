import Link from 'next/link'
import Image from 'next/image'

const CENTERS = [
  {
    href: '/centers/resources',
    motif: '/images/fol/seed-of-life.svg',
    q: 'What\u2019s available to me?',
    name: 'Resource Center',
    voice: 'Services, benefits, organizations — discover what your community offers.',
  },
  {
    href: '/centers/learning',
    motif: '/images/fol/vesica-piscis.svg',
    q: 'I want to understand.',
    name: 'Learning Center',
    voice: 'News, explainers, data, and context — understand how things work.',
  },
  {
    href: '/centers/action',
    motif: '/images/fol/tripod-of-life.svg',
    q: 'I want to do something.',
    name: 'Action Center',
    voice: 'Volunteer, organize, attend, donate — put your energy to work.',
  },
  {
    href: '/centers/accountability',
    motif: '/images/fol/metatrons-cube.svg',
    q: 'I want answers.',
    name: 'Accountability Center',
    voice: 'Officials, policies, spending, elections — follow the trail.',
  },
]

const PATHWAYS = [
  { name: 'Health', slug: 'our-health', color: '#1a6b56', line: 'Clinics, mental health, nutrition, insurance, and the care networks that keep Houston going.' },
  { name: 'Families', slug: 'our-families', color: '#1e4d7a', line: 'Childcare, schools, housing assistance, and what it takes to keep a household together.' },
  { name: 'Neighborhood', slug: 'our-neighborhood', color: '#4a2870', line: 'Streets, parks, zoning, transit — the physical places we share and the plans that shape them.' },
  { name: 'Voice', slug: 'our-voice', color: '#7a2018', line: 'Voting, representatives, advocacy, civic education — how we make decisions together.' },
  { name: 'Money', slug: 'our-money', color: '#6a4e10', line: 'Jobs, financial help, small business support — income, opportunity, and what they open up.' },
  { name: 'Planet', slug: 'our-planet', color: '#1a5030', line: 'Flooding, air quality, green spaces, energy — protecting the ground we stand on.' },
  { name: 'The Bigger We', slug: 'the-bigger-we', color: '#1b5e8a', line: 'Root causes, long games, and the structural questions underneath everything else.' },
]

export function HomeOrientation() {
  return (
    <>
      {/* How to use this guide */}
      <section className="bg-paper">
        <div className="max-w-[720px] mx-auto px-6 py-16">
          <p className="font-mono text-xs tracking-[0.14em] text-blue uppercase mb-1.5">
            How to use this guide
          </p>
          <p className="font-display text-[clamp(20px,3vw,28px)] leading-snug mb-2">
            Start with what matters to you right now.
          </p>
          <p className="font-body text-[15px] text-muted leading-relaxed mb-8">
            This guide is organized four ways. Pick the one that matches where you are today.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {CENTERS.map(function (c) {
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group relative block overflow-hidden hover:bg-paper transition-colors p-[clamp(24px,3vw,36px)] border border-clay/[0.08]"
                >
                  <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.04]" aria-hidden="true">
                    <Image src={c.motif} alt="" width={140} height={140} />
                  </div>
                  <div className="relative z-10">
                    <p className="font-body text-[clamp(17px,2vw,20px)] italic text-blue mb-2.5">
                      &ldquo;{c.q}&rdquo;
                    </p>
                    <p className="font-body text-base mb-1.5">
                      {c.name}
                    </p>
                    <p className="font-body text-sm text-muted leading-relaxed mb-4">
                      {c.voice}
                    </p>
                    <span className="font-body text-[13px] italic text-blue group-hover:text-clay transition-colors">
                      Open &rarr;
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-rule" />

      {/* Browse by topic */}
      <section className="bg-paper">
        <div className="max-w-[720px] mx-auto px-6 py-16">
          <p className="font-mono text-xs tracking-[0.14em] text-blue uppercase mb-1.5">
            Browse by topic
          </p>
          <p className="font-display text-[clamp(20px,3vw,28px)] leading-snug mb-2">
            Seven parts of community life.
          </p>
          <p className="font-body text-[15px] text-muted leading-relaxed mb-8">
            Every resource, every official, every policy connects back to one of these.
          </p>

          {PATHWAYS.map(function (pw, i) {
            return (
              <Link
                key={pw.slug}
                href={'/pathways/' + pw.slug}
                className={'group block py-5 transition-colors' + (i < 6 ? ' border-b border-clay/10' : '')}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-2 w-2.5 h-2.5 shrink-0" style={{ background: pw.color }} />
                  <div>
                    <p className="font-body text-[19px] mb-1 group-hover:text-blue transition-colors">
                      {pw.name}
                    </p>
                    <p className="font-body text-sm text-muted leading-relaxed">
                      {pw.line}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </>
  )
}
