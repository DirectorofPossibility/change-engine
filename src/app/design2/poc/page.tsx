import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Community Exchange — Proof of Concept', robots: 'noindex' }

/* ─── Flower of Life SVG patterns at various scales ─── */

function FlowerHero() {
  // Large decorative flower behind the hero text — 7-circle sacred geometry
  return (
    <svg width="420" height="420" viewBox="0 0 420 420" fill="none" className="absolute right-[-60px] top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none" aria-hidden="true">
      <circle cx="210" cy="210" r="70" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="210" cy="140" r="70" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="210" cy="280" r="70" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="270.6" cy="175" r="70" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="270.6" cy="245" r="70" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="149.4" cy="175" r="70" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="149.4" cy="245" r="70" stroke="currentColor" strokeWidth="1.2" />
      {/* Outer ring of 6 */}
      <circle cx="210" cy="70" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <circle cx="210" cy="350" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <circle cx="331.2" cy="140" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <circle cx="331.2" cy="280" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <circle cx="88.8" cy="140" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <circle cx="88.8" cy="280" r="70" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      {/* Bounding circle */}
      <circle cx="210" cy="210" r="200" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  )
}

function FlowerSectionDivider({ color = '#C75B2A' }: { color?: string }) {
  // Horizontal divider with Vesica Piscis (two overlapping circles) at center
  return (
    <div className="flex items-center justify-center py-10" aria-hidden="true">
      <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(to right, transparent, ${color}30)` }} />
      <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="mx-4">
        <circle cx="32" cy="24" r="18" stroke={color} strokeWidth="1" opacity="0.35" />
        <circle cx="48" cy="24" r="18" stroke={color} strokeWidth="1" opacity="0.35" />
      </svg>
      <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(to left, transparent, ${color}30)` }} />
    </div>
  )
}

function FlowerWatermark({ className = '' }: { className?: string }) {
  // Background watermark — full 19-circle Flower of Life
  return (
    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" className={className} aria-hidden="true">
      {/* Center */}
      <circle cx="150" cy="150" r="40" stroke="currentColor" strokeWidth="0.8" />
      {/* Inner ring */}
      <circle cx="150" cy="110" r="40" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="150" cy="190" r="40" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="184.6" cy="130" r="40" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="184.6" cy="170" r="40" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="115.4" cy="130" r="40" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="115.4" cy="170" r="40" stroke="currentColor" strokeWidth="0.6" />
      {/* Outer ring */}
      <circle cx="150" cy="70" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
      <circle cx="150" cy="230" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
      <circle cx="219.3" cy="110" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
      <circle cx="219.3" cy="190" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
      <circle cx="80.7" cy="110" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
      <circle cx="80.7" cy="190" r="40" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
    </svg>
  )
}

function SeedOfLife({ size = 64, color = '#C75B2A' }: { size?: number; color?: string }) {
  // 7-circle seed — used inline as accent
  const r = size * 0.2
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx={cx} cy={cy - r} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
      <circle cx={cx} cy={cy + r} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
      <circle cx={cx + r * 0.866} cy={cy - r * 0.5} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
      <circle cx={cx + r * 0.866} cy={cy + r * 0.5} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
      <circle cx={cx - r * 0.866} cy={cy - r * 0.5} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
      <circle cx={cx - r * 0.866} cy={cy + r * 0.5} r={r} stroke={color} strokeWidth="0.7" opacity="0.3" />
    </svg>
  )
}

function TripodOfLife({ size = 48, color = '#38a169' }: { size?: number; color?: string }) {
  const r = size * 0.22
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={cx} cy={cy - r * 0.6} r={r} stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx={cx - r * 0.52} cy={cy + r * 0.3} r={r} stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx={cx + r * 0.52} cy={cy + r * 0.3} r={r} stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

function MetatronsCube({ size = 48, color = '#805ad5' }: { size?: number; color?: string }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.14
  const R = size * 0.35
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="0.8" opacity="0.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = cx + R * Math.sin(rad)
        const y = cy - R * Math.cos(rad)
        return <circle key={deg} cx={x} cy={y} r={r} stroke={color} strokeWidth="0.6" opacity="0.35" />
      })}
      {/* Connecting lines */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad1 = (deg * Math.PI) / 180
        const rad2 = (((deg + 60) % 360) * Math.PI) / 180
        return (
          <line
            key={i}
            x1={cx + R * Math.sin(rad1)}
            y1={cy - R * Math.cos(rad1)}
            x2={cx + R * Math.sin(rad2)}
            y2={cy - R * Math.cos(rad2)}
            stroke={color}
            strokeWidth="0.4"
            opacity="0.2"
          />
        )
      })}
    </svg>
  )
}

function GenesisPattern({ size = 40, color = '#92400e' }: { size?: number; color?: string }) {
  const r = size * 0.2
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1.2" opacity="0.5" />
      <circle cx={cx} cy={cy - r * 0.7} r={r * 0.6} stroke={color} strokeWidth="0.8" opacity="0.3" />
      <circle cx={cx} cy={cy + r * 0.7} r={r * 0.6} stroke={color} strokeWidth="0.8" opacity="0.3" />
    </svg>
  )
}

/* ─── Spectrum bar ─── */
const PATHWAY_COLORS = ['#E05A33', '#D4883E', '#4A9B6E', '#3B82A0', '#7B68AE', '#C75B8E', '#2C8C99']

function SpectrumBar() {
  return (
    <div className="h-1 flex" aria-hidden="true">
      {PATHWAY_COLORS.map((c) => (
        <div key={c} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  )
}

/* ─── Audience card colors ─── */
const AUDIENCE_COLORS: Record<string, string> = {
  alumni: '#7B68AE',
  engaged: '#4A9B6E',
  crisis: '#E05A33',
  newcomer: '#3B82A0',
  partner: '#D4883E',
  researcher: '#2C8C99',
}

/* ─── Page ─── */
export default function ProofOfConceptPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>

      <SpectrumBar />

      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden text-center" style={{ background: '#1a1a2e', color: '#FAF8F5', padding: '80px 40px 60px' }}>
        <FlowerHero />
        {/* Left-side smaller flower watermark */}
        <FlowerWatermark className="absolute left-[-80px] bottom-[-40px] opacity-[0.04] text-white pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[0.85rem] uppercase tracking-[3px] mb-6" style={{ color: 'rgba(250,248,245,0.4)' }}>
            The Change Lab
          </p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-normal mb-3" style={{ color: '#FAF8F5' }}>
            Community Exchange
          </h1>
          <p className="text-[1.15rem] max-w-[640px] mx-auto" style={{ color: 'rgba(250,248,245,0.75)' }}>
            A civic discovery platform connecting Houston residents with the resources, services, officials, and opportunities that matter to them.
          </p>
          <p className="mt-8 text-[0.8rem]" style={{ color: 'rgba(250,248,245,0.3)' }}>
            Proof of Concept &mdash; March 2026 &mdash; www.changeengine.us
          </p>
        </div>
      </section>

      <SpectrumBar />

      {/* ════ EXECUTIVE SUMMARY ════ */}
      <div className="max-w-[860px] mx-auto px-8">
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Executive Summary</h2>
          <p className="mb-4">Community Exchange is a civic discovery platform that connects Houston residents with the resources, services, elected officials, policies, and opportunities relevant to their lives &mdash; organized through a unified knowledge graph, delivered in three languages, and written at a 6th-grade reading level.</p>
          <p>The platform eliminates the fragmentation that defines civic infrastructure today. Instead of expecting residents to know which agency to call, which nonprofit serves their area, or which elected official represents them, Community Exchange surfaces relevant information based on where people live, what they care about, and how they want to engage.</p>
        </section>

        <FlowerSectionDivider />

        {/* ════ THE OPPORTUNITY ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <div className="relative">
            <FlowerWatermark className="absolute right-[-100px] top-[-40px] opacity-[0.03] text-[#C75B2A] pointer-events-none" />
            <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>The Opportunity</h2>
          </div>
          <p className="mb-4">Houston has extraordinary civic assets: thousands of nonprofits, one of the most diverse populations in America, multi-level government representation, a robust 211 service network, and deep traditions of civic leadership through programs like Leadership Houston, the American Leadership Forum, and the Center for Houston&apos;s Future.</p>
          <p className="mb-4">What&apos;s missing is the connective tissue. These assets exist in silos &mdash; separate websites, separate databases, separate languages. Community Exchange weaves them into a single, navigable fabric so that every resident can find what&apos;s already there for them.</p>
          <ul className="pl-6 mb-4">
            <li className="mb-2"><strong>Connecting the dots</strong> &mdash; A unified platform that links news, services, officials, policies, and organizations around the issues people actually care about</li>
            <li className="mb-2"><strong>Meeting people in their language</strong> &mdash; Full content delivery in English, Spanish, and Vietnamese, written at a reading level everyone can access</li>
            <li className="mb-2"><strong>Making the invisible visible</strong> &mdash; Surfacing the services, opportunities, and representation that already exist but are hard to discover</li>
            <li className="mb-2"><strong>Building on existing strengths</strong> &mdash; Every pathway starts with what a community has, not what it lacks</li>
          </ul>
        </section>

        <FlowerSectionDivider color="#4A9B6E" />

        {/* ════ WHO IT'S FOR ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-3" style={{ color: '#1a1a2e' }}>Who It&apos;s For</h2>
          <p className="mb-8">Community Exchange serves six audiences. Each one brings different strengths, arrives with different intent, and moves through the platform differently. The system adapts &mdash; not by creating separate apps, but by reordering the same knowledge graph based on how someone wants to engage.</p>

          {/* Audience 1: Civic Leadership Alumni */}
          <AudienceCard
            type="alumni"
            number={1}
            title="Civic Leadership Alumni"
            description="Graduates of Leadership Houston, the American Leadership Forum, and the Center for Houston's Future carry deep networks and hard-won civic knowledge. Community Exchange gives them a shared operating dashboard to keep that momentum going after the program ends."
            details="They arrive through pathway pages organized by issue — housing, education, environment — and see the Go Deeper tier first: officials, policies, foundations, and spending data. They can cross-reference who's working on what, track legislation across government levels, and spot where their networks can make the biggest difference."
            steps={['Select a pathway', 'See officials and active policies', 'Cross-reference organizations', 'Identify where to collaborate']}
          />

          {/* Audience 2: Engaged Residents */}
          <AudienceCard
            type="engaged"
            number={2}
            title="Engaged Residents"
            description="These are the people already showing up — voting, volunteering, attending community meetings. They bring commitment and consistency. Community Exchange helps them see how their work connects to a larger picture and opens doors they might not have known were there."
            details={'They enter through the homepage or location-based personalization (ZIP code or street address) and browse content streams organized as horizontal shelves — articles, services, opportunities, and officials flowing together in one pathway. Every action is labeled with an effort estimate ("read ~1 min", "attend ~2 hrs", "volunteer recurring") so the next step is always clear and approachable.'}
            steps={['Enter location', 'Browse pathway shelves', 'Read an article', 'Discover a related opportunity', 'Take action']}
          />

          {/* Audience 3: Residents Navigating a Transition */}
          <AudienceCard
            type="crisis"
            number={3}
            title="Residents Navigating a Transition"
            description={'Someone looking for housing, food assistance, legal aid, or benefits is carrying enough weight already. Community Exchange meets them where they are with life situation prompts — "I\'m looking for housing options", "I need food assistance today" — and immediately surfaces services, organizations, and step-by-step guides.'}
            details="Everything is written in plain language at a 6th-grade reading level, available in English, Spanish, and Vietnamese, and filtered to their location. Service cards show a phone number, an address, and hours. No navigation required, no prior knowledge assumed."
            steps={['"I\'m looking for..."', 'Life situation match', 'Services near you', 'Call, visit, or apply']}
          />

          {/* Audience 4: Civic Newcomers */}
          <AudienceCard
            type="newcomer"
            number={4}
            title="Civic Newcomers"
            description="New to Houston or new to civic life, these residents bring fresh perspective and curiosity. They may not yet know their council district, their state representative, or what a super neighborhood is — and that's a starting point, not a barrier."
            details="The homepage greets them with an inviting Wayfinder visualization — seven pathways they can explore with no prior knowledge required. Entering a ZIP code or street address reveals their elected officials at every level, their voting districts, and their super neighborhood."
            steps={['Arrive at homepage', 'Enter address or ZIP', 'Meet your officials', 'Pick a pathway', 'Follow a learning path']}
          />

          {/* Audience 5: Partner Organizations */}
          <AudienceCard
            type="partner"
            number={5}
            title="Partner Organizations"
            description="Nonprofits, foundations, and agencies invest enormous energy mapping the landscape they operate in. Community Exchange gives them a living map of that landscape — which organizations share their focus areas, which officials shape their policy domain, and what the community is reading and engaging with."
            details="Partners see the full taxonomy layer: SDGs, NTEE codes, social determinants of health, geographic scope. Organization profiles surface related organizations through shared focus areas, making it possible to discover potential collaborators without already knowing they exist."
            steps={['Browse a focus area', 'See active organizations and services', 'Find shared focus areas', 'Connect with a collaborator']}
          />

          {/* Audience 6: Researchers & Journalists */}
          <AudienceCard
            type="researcher"
            number={6}
            title="Researchers & Journalists"
            description="People analyzing policy, tracking officials, or mapping service coverage bring rigor and accountability to civic life. Community Exchange gives them something that doesn't exist anywhere else: the ability to trace a policy from the official who sponsored it, to the focus areas it touches, to the services that implement it, to the organizations delivering those services, to the neighborhoods they serve."
            details="They use full-text search across every entity type, detail pages with complete Wayfinder context, geographic boundary overlays on maps, and federal spending data. Every connection in the knowledge graph is a thread they can pull."
            steps={['Search a topic or official', 'Open detail page', 'Follow related policies', 'Trace to services and organizations', 'Map geographic coverage']}
          />

          {/* Callout */}
          <div className="my-8 rounded-r-lg bg-white p-5 pl-6" style={{ borderLeft: '4px solid #C75B2A' }}>
            <p className="mb-3"><strong>One platform, six experiences.</strong> The knowledge graph is the same for everyone. What changes is the entry point, the ordering, and which engagement tier opens first. A resident navigating a transition sees services immediately. A leadership alumnus sees the policy landscape. A newcomer sees an open invitation to explore. The Wayfinder adapts to intent &mdash; the underlying connections stay whole.</p>
          </div>
        </section>

        <FlowerSectionDivider color="#7B68AE" />

        {/* ════ SOLUTION ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Solution</h2>

          {/* Knowledge Graph */}
          <div className="relative">
            <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-4" style={{ color: '#1a1a2e' }}>Knowledge Graph Architecture</h3>
            <p className="mb-4">Every piece of content &mdash; articles, services, officials, policies, organizations, opportunities &mdash; is classified across <strong>16 taxonomy dimensions</strong> and linked through a shared knowledge graph. An article about affordable housing is automatically connected to relevant 211 services, housing officials, zoning policies, and volunteer opportunities.</p>
          </div>

          {/* Seven Pathways — with Flower geometry */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Seven Thematic Pathways</h3>
          <p className="mb-4">Content is organized into seven pathways representing dimensions of community life:</p>

          {/* Pathway flower visualization */}
          <div className="relative flex justify-center my-8">
            <svg width="280" height="280" viewBox="0 0 280 280" fill="none" aria-hidden="true">
              {/* Center circle */}
              <circle cx="140" cy="140" r="32" fill="#1a1a2e10" stroke="#1a1a2e" strokeWidth="1" />
              <text x="140" y="144" textAnchor="middle" fill="#1a1a2e" fontSize="8" fontWeight="700" fontFamily="'DM Sans', sans-serif">COMMUNITY</text>
              {/* 7 pathway circles arranged in flower pattern */}
              {[
                { cx: 140, cy: 75, color: '#E05A33', label: 'Health' },
                { cx: 196, cy: 100, color: '#D4883E', label: 'Families' },
                { cx: 210, cy: 160, color: '#4A9B6E', label: 'Home' },
                { cx: 175, cy: 210, color: '#3B82A0', label: 'Voice' },
                { cx: 105, cy: 210, color: '#7B68AE', label: 'Money' },
                { cx: 70, cy: 160, color: '#C75B8E', label: 'Planet' },
                { cx: 84, cy: 100, color: '#2C8C99', label: 'Bigger We' },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx={p.cx} cy={p.cy} r="28" fill={`${p.color}15`} stroke={p.color} strokeWidth="1.2" />
                  <text x={p.cx} y={p.cy + 3} textAnchor="middle" fill={p.color} fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Pathway</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Theme</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Health & Wellbeing', 'Physical and mental health, healthcare access'],
                  ['Families & Education', 'Childcare, schools, youth development'],
                  ['Neighborhood & Home', 'Housing, infrastructure, safety'],
                  ['Voice & Power', 'Civic participation, elections, advocacy'],
                  ['Money & Mobility', 'Jobs, transportation, financial stability'],
                  ['Planet & Place', 'Environment, climate, parks, sustainability'],
                  ['The Bigger We', 'Arts, culture, immigration, belonging'],
                ].map(([pathway, theme], i) => (
                  <tr key={pathway}>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{pathway}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{theme}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wayfinder tiers — with tier-specific Flower geometry */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Wayfinder &mdash; Contextual Discovery</h3>
          <p className="mb-4">The Wayfinder appears on every detail page, performing a <strong>3-hop graph traversal</strong> to surface related content across three engagement tiers:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-white border rounded-xl p-6 text-center" style={{ borderColor: '#E2DDD5' }}>
              <div className="flex justify-center mb-3">
                <GenesisPattern size={48} color="#92400e" />
              </div>
              <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#C75B2A' }}>Understand</h3>
              <p className="text-[0.9rem]" style={{ color: '#6B6560' }}>News articles, library resources, explainers. Lowest barrier to entry.</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center" style={{ borderColor: '#E2DDD5' }}>
              <div className="flex justify-center mb-3">
                <TripodOfLife size={48} color="#065f46" />
              </div>
              <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#C75B2A' }}>Get Involved</h3>
              <p className="text-[0.9rem]" style={{ color: '#6B6560' }}>Events, volunteer opportunities, services. Moderate commitment.</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center" style={{ borderColor: '#E2DDD5' }}>
              <div className="flex justify-center mb-3">
                <MetatronsCube size={48} color="#1e40af" />
              </div>
              <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#C75B2A' }}>Go Deeper</h3>
              <p className="text-[0.9rem]" style={{ color: '#6B6560' }}>Officials, policies, foundations. Systemic engagement levers.</p>
            </div>
          </div>

          {/* Archetypes — with Flower geometry for each */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Navigational Archetypes</h3>
          <p className="mb-4">Six archetypes serve as navigational lenses that reorder information by intent:</p>

          {/* Archetype visual grid with their Flower of Life patterns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
            {[
              { name: 'Seeker', intent: '"I need help"', color: '#d69e2e', pattern: 'seed' },
              { name: 'Learner', intent: '"I want to understand"', color: '#3182ce', pattern: 'vesica' },
              { name: 'Builder', intent: '"I want to contribute"', color: '#38a169', pattern: 'tripod' },
              { name: 'Watchdog', intent: '"I want accountability"', color: '#805ad5', pattern: 'metatron' },
              { name: 'Partner', intent: '"I represent an org"', color: '#dd6b20', pattern: 'borromean' },
              { name: 'Explorer', intent: '"I\'m just browsing"', color: '#E8723A', pattern: 'flower' },
            ].map((a) => (
              <div key={a.name} className="bg-white border rounded-xl p-4 relative overflow-hidden" style={{ borderColor: '#E2DDD5' }}>
                <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: a.color }} />
                <div className="flex items-center gap-2 mb-1.5 pl-2">
                  <SeedOfLife size={28} color={a.color} />
                  <span className="font-serif text-[1rem] font-normal" style={{ color: '#1a1a2e' }}>{a.name}</span>
                </div>
                <p className="text-[0.8rem] pl-2" style={{ color: '#6B6560' }}>{a.intent}</p>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Multilingual Content Pipeline</h3>
          <div className="my-6">
            {[
              { num: 1, title: 'Ingest', desc: 'RSS feeds, government APIs, and manual submissions' },
              { num: 2, title: 'Rewrite', desc: 'AI simplifies to 6th-grade reading level' },
              { num: 3, title: 'Classify', desc: 'Claude AI maps across 16 taxonomy dimensions' },
              { num: 4, title: 'Review', desc: 'Human editors approve (nothing auto-publishes)' },
              { num: 5, title: 'Translate', desc: 'Nightly batch into Spanish and Vietnamese' },
            ].map((step, i) => (
              <div key={step.num}>
                <div className="flex items-start gap-4 py-3.5">
                  <div className="w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center text-[0.8rem] font-bold" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>
                    {step.num}
                  </div>
                  <div>
                    <strong>{step.title}</strong> &mdash; {step.desc}
                  </div>
                </div>
                {i < 4 && <div className="w-0.5 h-3 ml-[15px]" style={{ background: '#E2DDD5' }} />}
              </div>
            ))}
          </div>

          {/* Geographic Personalization */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Geographic Personalization</h3>
          <p className="mb-4">Residents enter a ZIP code for a quick start, or a street address for precision. The platform resolves their location against multiple geographic layers, because the boundaries that shape civic life don&apos;t all follow the same lines:</p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Layer</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Boundary Type</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>What It Unlocks</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Federal', 'Congressional districts', 'U.S. House representative, federal policies and spending'],
                  ['State', 'TX House & Senate districts', 'State legislators, state bills and budget items'],
                  ['County', 'Commissioner precincts', 'Harris County officials, county legislation'],
                  ['City', 'Council districts', 'City council member, Houston ordinances'],
                  ['Neighborhood', 'Super neighborhoods (88)', 'Local content, organizations, community context'],
                  ['Voting', 'Precincts, polling places', 'Where to vote, ballot information'],
                  ['Census', 'Census tracts', 'Demographic context, service planning data'],
                ].map(([layer, boundary, unlocks], i) => (
                  <tr key={layer}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{layer}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{boundary}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{unlocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <FlowerSectionDivider color="#3B82A0" />

        {/* ════ TECHNICAL ARCHITECTURE ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <div className="relative">
            <FlowerWatermark className="absolute right-[-60px] top-[-20px] opacity-[0.025] text-[#805ad5] pointer-events-none" />
            <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Technical Architecture</h2>
          </div>

          <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-4" style={{ color: '#1a1a2e' }}>Technology Stack</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Layer</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Technology</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Framework', 'Next.js 14 (App Router)', 'Server components, streaming, ISR'],
                  ['Language', 'TypeScript 5', 'End-to-end type safety'],
                  ['Frontend', 'React 18 + Tailwind CSS 3', 'Component-based UI'],
                  ['Typography', 'DM Serif Display + DM Sans', 'Google Fonts'],
                  ['Maps', 'Leaflet + react-leaflet', 'OpenStreetMap tiles, GeoJSON overlays'],
                  ['Database', 'Supabase (PostgreSQL)', 'Row-level security, real-time'],
                  ['Edge Functions', 'Supabase (Deno)', 'Sync, classify, translate workers'],
                  ['AI', 'Anthropic Claude API', 'Classification, rewriting, enrichment'],
                  ['Hosting', 'Vercel', 'Auto-deploy from GitHub'],
                ].map(([layer, tech, details], i) => (
                  <tr key={layer}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{layer}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{tech}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data Model with Flower-inspired knowledge graph visualization */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Data Model &mdash; 174 Tables</h3>
          <p className="mb-4">The database is organized into entity tables (the things people interact with), taxonomy tables (how those things are classified), junction tables (the connections between them), and supporting infrastructure. Together they form the knowledge graph that powers the Wayfinder.</p>

          {/* Knowledge graph as Flower of Life visualization */}
          <div className="relative flex justify-center my-10">
            <svg width="320" height="260" viewBox="0 0 320 260" fill="none" aria-hidden="true">
              {/* Center: entities */}
              <circle cx="160" cy="130" r="45" fill="#C75B2A10" stroke="#C75B2A" strokeWidth="1.2" />
              <text x="160" y="125" textAnchor="middle" fill="#C75B2A" fontSize="9" fontWeight="700" fontFamily="'DM Sans', sans-serif">16 Entity</text>
              <text x="160" y="137" textAnchor="middle" fill="#C75B2A" fontSize="9" fontWeight="700" fontFamily="'DM Sans', sans-serif">Tables</text>

              {/* Upper: taxonomy */}
              <circle cx="160" cy="55" r="38" fill="#805ad510" stroke="#805ad5" strokeWidth="1" />
              <text x="160" y="52" textAnchor="middle" fill="#805ad5" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">15 Taxonomy</text>
              <text x="160" y="63" textAnchor="middle" fill="#805ad5" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">Dimensions</text>

              {/* Lower: geography */}
              <circle cx="160" cy="205" r="38" fill="#38a16910" stroke="#38a169" strokeWidth="1" />
              <text x="160" y="202" textAnchor="middle" fill="#38a169" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">12 Geographic</text>
              <text x="160" y="213" textAnchor="middle" fill="#38a169" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">Tables</text>

              {/* Left: junctions */}
              <circle cx="75" cy="130" r="38" fill="#3182ce10" stroke="#3182ce" strokeWidth="1" />
              <text x="75" y="127" textAnchor="middle" fill="#3182ce" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">~75 Junction</text>
              <text x="75" y="138" textAnchor="middle" fill="#3182ce" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">Tables</text>

              {/* Right: infrastructure */}
              <circle cx="245" cy="130" r="38" fill="#6B656010" stroke="#6B6560" strokeWidth="1" />
              <text x="245" y="127" textAnchor="middle" fill="#6B6560" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">~30 Support</text>
              <text x="245" y="138" textAnchor="middle" fill="#6B6560" fontSize="8" fontWeight="600" fontFamily="'DM Sans', sans-serif">Tables</text>

              {/* Connecting lines */}
              <line x1="160" y1="85" x2="160" y2="93" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
              <line x1="160" y1="175" x2="160" y2="167" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
              <line x1="113" y1="130" x2="115" y2="130" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
              <line x1="205" y1="130" x2="207" y2="130" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
            </svg>
          </div>

          {/* Entity tables */}
          <h4 className="text-[0.75rem] uppercase tracking-[2px] font-bold mb-3" style={{ color: '#6B6560' }}>Entity Tables (16)</h4>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Table</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>What It Holds</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['content_published', 'Published articles, rewritten at 6th-grade reading level'],
                  ['content_inbox', 'Ingested content awaiting classification and review'],
                  ['elected_officials', 'Officials at federal, state, county, and city levels'],
                  ['policies', 'Bills, ordinances, resolutions, executive orders'],
                  ['services_211', 'Social services from the United Way 211 network'],
                  ['organizations', 'Nonprofits, agencies, mutual aid groups, community orgs'],
                  ['opportunities', 'Volunteer positions, events, jobs, civic engagement'],
                  ['life_situations', 'Contextual entry points ("Find housing", "Manage grief")'],
                  ['guides', 'Long-form step-by-step editorial guides'],
                  ['learning_paths', 'Multi-step curated educational journeys'],
                  ['agencies', 'Government agencies at every level'],
                  ['benefit_programs', 'Government and nonprofit benefit programs'],
                  ['campaigns', 'Advocacy and organizing campaigns'],
                  ['candidates', 'Political candidates for elections'],
                  ['ballot_items', 'Ballot measures, races, propositions'],
                  ['foundations', 'Funders, philanthropic foundations'],
                ].map(([table, desc], i) => (
                  <tr key={table}>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>
                      <code className="text-[0.85em] px-1.5 py-0.5 rounded" style={{ background: i % 2 === 1 ? '#E2DDD5' : '#F0ECE6' }}>{table}</code>
                    </td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Taxonomy tables */}
          <h4 className="text-[0.75rem] uppercase tracking-[2px] font-bold mb-3" style={{ color: '#6B6560' }}>Taxonomy Tables (15)</h4>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Dimension</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Description</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Scale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Themes (Pathways)', '7 pathways organizing community life', '7'],
                  ['Focus Areas', 'Specific topics within pathways', '80+'],
                  ['SDGs', 'UN Sustainable Development Goals', '17'],
                  ['SDOH Domains', 'Social Determinants of Health', '6'],
                  ['NTEE Codes', 'Nonprofit charity classification', '26 categories'],
                  ['AIRS Codes', 'Social services taxonomy (211 system)', 'hierarchical'],
                  ['Audience Segments', 'Demographics and personas', '15+'],
                  ['Service Categories', '211 service type taxonomy', 'hierarchical'],
                  ['Resource Types', 'Content format (article, video, report...)', '12+'],
                  ['Skills', 'Skills tagged to opportunities', '30+'],
                  ['Action Types', 'Ways to engage (donate, volunteer...)', '10+'],
                  ['Time Commitments', 'Duration ranges for opportunities', '6 ranges'],
                  ['Government Levels', 'Federal, State, County, City, School District', '5'],
                  ['Centers', 'Engagement centers', '4'],
                  ['Languages', 'Supported content languages', '3'],
                ].map(([dim, desc, scale], i) => (
                  <tr key={dim}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{dim}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{desc}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{scale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Government Data Coverage */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Government Data Coverage</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Level</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Officials</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Legislation</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Federal', 'Congress.gov API', 'Congress.gov API', 'Daily 9 AM CT'],
                  ['State (TX)', 'Open States + TLO', 'TLO RSS + Open States', 'Daily 10 AM CT'],
                  ['County (Harris)', 'Legistar API', 'Legistar API', 'Daily 8 AM CT'],
                  ['City (Houston)', 'Legistar API', 'Legistar API', 'Daily 7 AM CT'],
                ].map(([level, officials, legislation, schedule], i) => (
                  <tr key={level}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{level}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{officials}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{legislation}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{schedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cron */}
          <h4 className="text-[0.75rem] uppercase tracking-[2px] font-bold mb-3" style={{ color: '#6B6560' }}>Daily Cron Schedule (Central Time)</h4>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Time</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Job</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1 AM', 'batch-translate', 'Translate untranslated content to ES + VI'],
                  ['3 AM', 'poll-rss', 'Poll all active RSS feeds, classify new items'],
                  ['5 AM Mon', 'sync-federal-spending', 'USAspending for Harris County'],
                  ['6 AM', 'sync-polling-places', 'Refresh voter locations'],
                  ['7-10 AM', 'sync-officials', 'City, county, federal, state (staggered)'],
                  ['11 AM', 'classify-pending', 'Sweep all tables for unclassified entities'],
                ].map(([time, job, desc], i) => (
                  <tr key={job}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{time}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>
                      <code className="text-[0.85em] px-1.5 py-0.5 rounded" style={{ background: i % 2 === 1 ? '#E2DDD5' : '#F0ECE6' }}>{job}</code>
                    </td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* App structure code block */}
          <h3 className="font-serif text-[1.35rem] font-normal mt-10 mb-4" style={{ color: '#1a1a2e' }}>Application Structure</h3>
          <pre className="rounded-lg overflow-x-auto text-[0.8rem] leading-relaxed" style={{ background: '#1a1a2e', color: '#E2DDD5', padding: '20px 24px', margin: '16px 0 24px' }}>
            <code>{`src/app/(exchange)/                Public-facing route group
  page.tsx                         Homepage (Wayfinder, shelves)
  (pages)/
    content/[id]/                  Article detail + Wayfinder sidebar
    officials/[id]/                Official profile + related policies
    policies/[id]/                 Policy detail + related officials
    services/[id]/                 Service detail + related resources
    organizations/[id]/            Organization profile
    explore/pathway/[slug]/        Themed content stream
    compass/                       Officials by address or ZIP
    elections/                     Election information
    library/                       Knowledge library

src/components/exchange/           UI component library
  WayfinderCircles.tsx             SVG pathway visualization
  DetailWayfinder.tsx              Contextual discovery sidebar
  ContentShelf.tsx                 Horizontal scroll shelf
  FlowerIcons.tsx                  Flower of Life icon system

src/lib/data/exchange.ts           Data access layer
  getWayfinderContext()            3-hop graph traversal

supabase/functions/                Edge functions (Deno)
  classify-content-v2/             AI classification (16 dimensions)
  translate-all/                   Batch translation
  sync-officials/                  Government data sync
  publish-content/                 Publishing workflow`}</code>
          </pre>
        </section>

        <FlowerSectionDivider color="#D4883E" />

        {/* ════ DESIGN PHILOSOPHY ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Design Philosophy: Asset-Based Framing</h2>
          <p className="mb-4">Every design decision, every word choice, and every data structure in Community Exchange starts from the same premise: <strong>Houston&apos;s communities are rich with assets</strong> &mdash; people, organizations, knowledge, services, leadership, culture, and resilience. The platform&apos;s job is to make those assets visible and connected.</p>
          <p className="mb-6">This isn&apos;t just a content guideline. It&apos;s an architectural principle that shapes the entire system:</p>

          {/* Philosophy cards with Flower watermarks */}
          {[
            { title: 'Language', body: '"Resources available in your neighborhood" instead of "underserved area." "Residents navigating a transition" instead of "persons in crisis." "Civic newcomer bringing fresh perspective" instead of "uninformed voter." Every piece of content — whether written by a human or rewritten by AI — is reviewed against this standard.' },
            { title: 'Information Architecture', body: "The Wayfinder starts with what exists: organizations already working in a focus area, services already available, officials already accountable, opportunities already open. Coverage gaps are visible through their absence, not through deficit labels. The data tells the story without framing communities as problems to be solved." },
            { title: 'Engagement Model', body: "The spiral model assumes people already have capacity and agency. It doesn't push them through a funnel toward a predetermined outcome. It offers clear next steps at every level — read, attend, volunteer, advocate — and trusts residents to choose their own path. Effort tags (read ~1 min, attend ~2 hrs, volunteer recurring) respect people's time without gatekeeping." },
            { title: 'Taxonomy', body: 'Life situations are framed as transitions, not deficits: "Find housing options", "Explore career paths", "Connect with legal support." Audience segments describe identity, not need: "Veterans", "Seniors", "Immigrants", "Parents" — each carrying knowledge and experience, not just requiring services.' },
          ].map((card) => (
            <div key={card.title} className="relative bg-white border rounded-xl p-7 my-4 overflow-hidden" style={{ borderColor: '#E2DDD5' }}>
              <FlowerWatermark className="absolute right-[-60px] top-[-60px] opacity-[0.02] text-[#C75B2A] pointer-events-none" />
              <h3 className="font-serif text-[1.15rem] font-normal mb-3 relative z-10" style={{ color: '#1a1a2e' }}>{card.title}</h3>
              <p className="text-[0.9rem] relative z-10 mb-0" style={{ color: '#6B6560' }}>{card.body}</p>
            </div>
          ))}
        </section>

        <FlowerSectionDivider color="#E05A33" />

        {/* ════ DIFFERENTIATORS ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>What Makes This Different</h2>

          <div className="bg-white border rounded-xl p-7 my-4" style={{ borderColor: '#E2DDD5' }}>
            <div className="flex items-start gap-4">
              <SeedOfLife size={48} color="#C75B2A" />
              <div>
                <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#1a1a2e' }}>Spiral Engagement, Not a Funnel</h3>
                <p className="text-[0.9rem] mb-0" style={{ color: '#6B6560' }}>Traditional civic platforms assume a linear journey: learn, then act. Community Exchange uses a <strong>spiral model</strong> &mdash; residents cycle through Understand, Get Involved, and Go Deeper repeatedly as their engagement deepens. The platform supports re-entry at any point. There is no &ldquo;end state&rdquo; &mdash; civic life is ongoing.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-7 my-4" style={{ borderColor: '#E2DDD5' }}>
            <div className="flex items-start gap-4">
              <MetatronsCube size={48} color="#805ad5" />
              <div>
                <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#1a1a2e' }}>16-Dimension Classification</h3>
                <p className="text-[0.9rem] mb-3" style={{ color: '#6B6560' }}>Every entity in the database is classified by AI across 16 taxonomy dimensions simultaneously. This produces ~75 junction tables connecting 16 entity types to 15 taxonomy dimensions &mdash; a densely connected knowledge graph where any entity can be reached from any other through shared classification.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-7 my-4" style={{ borderColor: '#E2DDD5' }}>
            <div className="flex items-start gap-4">
              <TripodOfLife size={48} color="#38a169" />
              <div>
                <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#1a1a2e' }}>Full Government Coverage</h3>
                <p className="text-[0.9rem] mb-0" style={{ color: '#6B6560' }}>From city council ordinances to federal spending in Harris County &mdash; the platform tracks officials, legislation, and spending at every level of government, synced daily from authoritative sources. Vote records connect officials to the policies they&apos;ve supported or opposed.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-7 my-4" style={{ borderColor: '#E2DDD5' }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  {/* Concentric circles representing layers of geography */}
                  <circle cx="24" cy="24" r="20" stroke="#3B82A0" strokeWidth="0.8" opacity="0.25" />
                  <circle cx="24" cy="24" r="16" stroke="#3B82A0" strokeWidth="0.8" opacity="0.35" />
                  <circle cx="24" cy="24" r="12" stroke="#3B82A0" strokeWidth="1" opacity="0.45" />
                  <circle cx="24" cy="24" r="8" stroke="#3B82A0" strokeWidth="1" opacity="0.55" />
                  <circle cx="24" cy="24" r="4" stroke="#3B82A0" strokeWidth="1.2" opacity="0.7" />
                  <circle cx="24" cy="24" r="1.5" fill="#3B82A0" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-[1.15rem] font-normal mb-2" style={{ color: '#1a1a2e' }}>Multi-Layer Geographic Resolution</h3>
                <p className="text-[0.9rem] mb-0" style={{ color: '#6B6560' }}>A single street address resolves against 7 overlapping boundary systems (congressional districts, state districts, commissioner precincts, council districts, super neighborhoods, voting precincts, census tracts). Cross-reference tables handle the reality that these boundaries don&apos;t align with each other or with ZIP codes.</p>
              </div>
            </div>
          </div>
        </section>

        <FlowerSectionDivider color="#2C8C99" />

        {/* ════ STATUS ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Current Status</h2>

          <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-3" style={{ color: '#1a1a2e' }}>Operational</h3>
          <div className="mb-3">
            <span className="inline-block text-[0.7rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded mr-1.5" style={{ background: '#d4edda', color: '#155724' }}>Live</span>
          </div>
          <ul className="pl-6 mb-8">
            <li className="mb-2">Content ingestion and classification pipeline (RSS + manual + API)</li>
            <li className="mb-2">Daily government data sync (federal, state, county, city)</li>
            <li className="mb-2">Multilingual translation (Spanish + Vietnamese)</li>
            <li className="mb-2">Human review queue and publishing workflow</li>
            <li className="mb-2">Wayfinder contextual discovery on all detail pages</li>
            <li className="mb-2">Address and ZIP-based official lookup (Civic Compass)</li>
            <li className="mb-2">Full-text search across all entity types</li>
            <li className="mb-2">Admin dashboard for content management</li>
          </ul>

          <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-3" style={{ color: '#1a1a2e' }}>In Progress</h3>
          <div className="mb-3">
            <span className="inline-block text-[0.7rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded mr-1.5" style={{ background: '#fff3cd', color: '#856404' }}>Building</span>
          </div>
          <ul className="pl-6 mb-8">
            <li className="mb-2">Geographic boundary system (super neighborhoods, district maps)</li>
            <li className="mb-2">Archetype-based engagement reordering</li>
            <li className="mb-2">AI civic assistant (chat interface)</li>
            <li className="mb-2">Federal spending tracker integration</li>
          </ul>

          <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-3" style={{ color: '#1a1a2e' }}>Planned</h3>
          <div className="mb-3">
            <span className="inline-block text-[0.7rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded mr-1.5" style={{ background: '#E2DDD5', color: '#6B6560' }}>Planned</span>
          </div>
          <ul className="pl-6 mb-4">
            <li className="mb-2">Community feedback loops (&ldquo;suggest an edit&rdquo; on published content)</li>
            <li className="mb-2">Organization self-service portal (partner accounts)</li>
            <li className="mb-2">Mobile-optimized progressive web app</li>
            <li className="mb-2">Real-time election night results integration</li>
          </ul>
        </section>

        <FlowerSectionDivider color="#C75B8E" />

        {/* ════ INFRASTRUCTURE ════ */}
        <section className="py-14" style={{ borderBottom: '1px solid #E2DDD5' }}>
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Infrastructure &amp; Deployment</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tl-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Component</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Provider</th>
                  <th className="text-left px-3.5 py-2.5 text-[0.75rem] uppercase tracking-wider font-medium rounded-tr-md" style={{ background: '#1a1a2e', color: '#FAF8F5' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Application', 'Vercel', 'Auto-deploy from GitHub master'],
                  ['Database', 'Supabase', 'Managed PostgreSQL with RLS'],
                  ['Edge Compute', 'Supabase', 'Deno runtime for workers'],
                  ['AI Services', 'Anthropic Claude', 'Classification, rewriting, translation'],
                  ['Maps', 'OpenStreetMap', 'Via Leaflet (no API key)'],
                  ['Gov Data', 'Public APIs', 'Congress.gov, Legistar, Open States, Google Civic'],
                ].map(([comp, provider, details], i) => (
                  <tr key={comp}>
                    <td className="px-3.5 py-2.5 font-medium" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{comp}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{provider}</td>
                    <td className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2DDD5', background: i % 2 === 1 ? '#F0ECE6' : undefined }}>{details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-serif text-[1.35rem] font-normal mt-8 mb-4" style={{ color: '#1a1a2e' }}>Security &amp; Privacy</h3>
          <ul className="pl-6 mb-4">
            <li className="mb-2"><strong>Row-level security</strong> on all Supabase tables</li>
            <li className="mb-2"><strong>API key authentication</strong> for ingestion endpoints</li>
            <li className="mb-2"><strong>Role-based access</strong> via Supabase Auth (admin, partner, public)</li>
            <li className="mb-2"><strong>No PII collection</strong> &mdash; Location is stored as a cookie (ZIP or geocoded point) with no account required</li>
            <li className="mb-2"><strong>Middleware-enforced route protection</strong> for admin pages</li>
          </ul>
        </section>

        {/* ════ SUMMARY ════ */}
        <section className="py-14">
          <h2 className="font-serif text-[2rem] font-normal mb-6" style={{ color: '#1a1a2e' }}>Summary</h2>
          <div className="relative rounded-r-lg bg-white p-6 pl-7 overflow-hidden" style={{ borderLeft: '4px solid #C75B2A' }}>
            <FlowerWatermark className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] text-[#C75B2A] pointer-events-none" />
            <p className="mb-3 relative z-10">Community Exchange demonstrates that civic infrastructure can be unified, accessible, and intelligent. By connecting a knowledge graph, AI classification, multilingual delivery, and geographic personalization into a single platform, it transforms Houston&apos;s fragmented civic landscape into a coherent, navigable experience for every resident &mdash; regardless of language, literacy level, or prior civic knowledge.</p>
            <p className="relative z-10 mb-0">The proof of concept is live at <strong>www.changeengine.us</strong> with operational data pipelines, a working knowledge graph, and daily government data synchronization covering all four levels of government in the Houston / Harris County area.</p>
          </div>
        </section>
      </div>

      <SpectrumBar />

      {/* ════ FOOTER ════ */}
      <footer className="text-center py-10" style={{ background: '#1a1a2e', color: 'rgba(250,248,245,0.5)', fontSize: '0.85rem' }}>
        <div className="flex justify-center mb-4">
          <SeedOfLife size={40} color="rgba(250,248,245,0.15)" />
        </div>
        <strong style={{ color: '#FAF8F5' }}>Community Exchange</strong> &mdash; Powered by The Change Lab<br />
        www.changeengine.us &mdash; March 2026
      </footer>
    </div>
  )
}

/* ─── Audience Card Component ─── */
function AudienceCard({
  type,
  number,
  title,
  description,
  details,
  steps,
}: {
  type: string
  number: number
  title: string
  description: string
  details: string
  steps: string[]
}) {
  const color = AUDIENCE_COLORS[type] || '#6B6560'
  return (
    <div className="relative bg-white border rounded-xl my-5 overflow-hidden" style={{ borderColor: '#E2DDD5', padding: '24px 28px' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      {/* Small Flower watermark in the card */}
      <div className="absolute right-[-80px] top-[-60px] opacity-[0.015] pointer-events-none" style={{ color }}>
        <FlowerWatermark />
      </div>
      <h3 className="font-serif text-[1.2rem] font-normal mt-0 mb-2 relative z-10" style={{ color: '#1a1a2e' }}>
        {number}. {title}
      </h3>
      <p className="text-[0.95rem] mb-3 relative z-10">{description}</p>
      <p className="text-[0.9rem] mb-4 relative z-10" style={{ color: '#6B6560' }}>{details}</p>
      <div className="flex flex-wrap gap-2 relative z-10">
        {steps.map((step, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[0.8rem] font-medium px-3 py-1.5 rounded-md" style={{ background: '#F0ECE6' }}>
            {i > 0 && <span className="font-bold" style={{ color: '#C75B2A' }}>&rarr;</span>}
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}
