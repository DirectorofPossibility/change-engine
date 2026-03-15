import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ALL_ADVENTURES } from '@/lib/data/adventures'

export const metadata: Metadata = {
  title: 'Community Adventures — The Change Engine',
  description: 'Interactive stories that put you at the center of civic life. Navigate a town hall meeting, discover hidden neighborhood assets, or prepare your community for hurricane season.',
}


const VISIBLE_COUNT = 3

export default function AdventuresPage() {
  const visible = ALL_ADVENTURES.slice(0, VISIBLE_COUNT)
  const rest = ALL_ADVENTURES.slice(VISIBLE_COUNT)

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            Community Adventures
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Interactive stories where your choices shape the outcome. Step into real civic scenarios -- every choice teaches you something real.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <span style={{ fontSize: '2rem',  }}>{ALL_ADVENTURES.length}</span>
              <span style={{ fontSize: '0.875rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Adventures</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem',  }}>~5 min</span>
              <span style={{ fontSize: '0.875rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Each</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem',  }}>Free</span>
              <span style={{ fontSize: '0.875rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Always</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Adventures</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Section header */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>Choose Your Adventure</h2>
          <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{ALL_ADVENTURES.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        {/* Visible adventures */}
        <div className="space-y-4">
          {visible.map(function (adventure) {
            return (
              <Link
                key={adventure.slug}
                href={'/adventures/' + adventure.slug}
                className="block border hover:border-current transition-colors"
                style={{ borderColor: '#dde1e8' }}
              >
                <div className="p-6 bg-paper">
                  <h3 style={{ fontSize: '1.15rem' }}>{adventure.title}</h3>
                  <p style={{ color: "#1b5e8a", fontSize: '0.875rem', marginTop: '0.25rem' }}>{adventure.subtitle}</p>
                  <p style={{ color: "#5c6474", fontSize: '0.875rem', lineHeight: 1.6, marginTop: '0.5rem' }}>{adventure.description}</p>
                  <div className="flex items-center gap-4 mt-3" style={{ color: "#5c6474", fontSize: '0.875rem' }}>
                    <span>~{adventure.estimatedMinutes} min</span>
                    <span>{adventure.nodeCount} scenes</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Progressive disclosure */}
        {rest.length > 0 && (
          <details className="mt-4">
            <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
              See {rest.length} more adventure{rest.length > 1 ? 's' : ''}
            </summary>
            <div className="space-y-4 mt-4">
              {rest.map(function (adventure) {
                return (
                  <Link
                    key={adventure.slug}
                    href={'/adventures/' + adventure.slug}
                    className="block border hover:border-current transition-colors"
                    style={{ borderColor: '#dde1e8' }}
                  >
                    <div className="p-6 bg-paper">
                      <h3 style={{ fontSize: '1.15rem' }}>{adventure.title}</h3>
                      <p style={{ color: "#1b5e8a", fontSize: '0.875rem', marginTop: '0.25rem' }}>{adventure.subtitle}</p>
                      <p style={{ color: "#5c6474", fontSize: '0.875rem', lineHeight: 1.6, marginTop: '0.5rem' }}>{adventure.description}</p>
                      <div className="flex items-center gap-4 mt-3" style={{ color: "#5c6474", fontSize: '0.875rem' }}>
                        <span>~{adventure.estimatedMinutes} min</span>
                        <span>{adventure.nodeCount} scenes</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* How it works */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>How Community Adventures Work</h2>
          <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>3 steps</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Read the Scene', desc: 'Each scene puts you in a real civic situation with illustrated context.' },
            { step: '2', title: 'Make a Choice', desc: 'Your decisions shape the story. There is no wrong answer -- every path teaches something.' },
            { step: '3', title: 'Learn & Connect', desc: 'Scenes include real facts and links to explore topics further on The Change Engine.' },
          ].map(function (item) {
            return (
              <div key={item.step} className="p-5 border" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
                <span style={{ color: "#1b5e8a", fontSize: '0.875rem', fontWeight: 700 }}>{item.step}.</span>
                <h3 style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: "#5c6474", fontSize: '0.875rem', lineHeight: 1.6, marginTop: '0.25rem' }}>{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
