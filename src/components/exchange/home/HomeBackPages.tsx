import Link from 'next/link'

const FEATURES = [
  { label: 'Civic Compass', note: 'Personalized to your ZIP', href: '/compass' },
  { label: 'Knowledge Graph', note: 'See how it all connects', href: '/knowledge-graph' },
  { label: 'Three Good Things', note: 'Daily good news', href: '/goodthings' },
  { label: 'Call Your Senators', note: 'Direct line to D.C.', href: '/call-your-senators' },
  { label: 'Chat with Chance', note: 'Ask anything', href: '/chat' },
  { label: 'Teen Hub', note: 'For young Houstonians', href: '/teens' },
]

export function HomeBackPages() {
  return (
    <>
      {/* Don't miss */}
      <section className="bg-paper">
        <div className="max-w-[720px] mx-auto px-6 py-14">
          <p className="font-mono text-[10px] tracking-[0.14em] text-blue uppercase mb-6 text-center">
            Don&rsquo;t miss
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3">
            {FEATURES.map(function (item) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block py-4 px-3 text-center hover:bg-paper transition-colors"
                >
                  <p className="font-body text-[15px] mb-0.5 group-hover:text-blue transition-colors">
                    {item.label}
                  </p>
                  <p className="font-mono text-[10px] text-muted tracking-wider">
                    {item.note}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Colophon */}
      <section className="bg-paper border-t border-rule">
        <div className="max-w-[580px] mx-auto px-6 py-14 text-center">
          <p className="font-body text-[clamp(15px,1.8vw,18px)] italic text-muted leading-relaxed mb-7">
            We did not build anything new. We just made what already exists findable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 font-mono text-micro text-muted">
            <a href="tel:988" className="hover:text-blue transition-colors"><strong>988</strong> Crisis</a>
            <span className="text-blue">&middot;</span>
            <a href="tel:311" className="hover:text-blue transition-colors"><strong>311</strong> City</a>
            <span className="text-blue">&middot;</span>
            <a href="tel:211" className="hover:text-blue transition-colors"><strong>211</strong> Social Services</a>
            <span className="text-blue">&middot;</span>
            <a href="tel:7135282121" className="hover:text-blue transition-colors"><strong>713-528-2121</strong> DV Hotline</a>
          </div>

          <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
            Built in Houston. For Houston.
          </p>
        </div>
      </section>
    </>
  )
}
