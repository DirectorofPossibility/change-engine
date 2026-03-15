import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import { getUnifiedKBItems } from '@/lib/data/library'
import { getFocusAreas } from '@/lib/data/exchange'
import { KnowledgeBaseClient } from '../KnowledgeBaseSection'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Knowledge Base — Change Engine',
  description: 'Browse articles, reports, guides, videos, and research across all pathways.',
}

// ── Design tokens ─────────────────────────────────────────────────────


export default async function KnowledgeBasePage() {
  const [items, allFocusAreas] = await Promise.all([
    getUnifiedKBItems(),
    getFocusAreas(),
  ])

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, emoji: theme.emoji }
  })

  const focusAreas = allFocusAreas.map(function (fa: any) {
    return { focus_id: fa.focus_id, focus_area_name: fa.focus_area_name, theme_id: fa.theme_id || null }
  })

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
            Knowledge Base
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
            Explore articles, reports, guides, videos, and tools -- organized by pathway, topic, or A-Z.
          </p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.875rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/explore" className="hover:underline" style={{ color: "#1b5e8a" }}>Explore</Link>
          <span className="mx-2">/</span>
          <span>Knowledge Base</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* Quick links */}
        <div className="flex items-center gap-6 mb-8">
          <Link
            href="/library"
            style={{ fontSize: '0.875rem', letterSpacing: '0.08em', color: "#1b5e8a" }}
            className="uppercase hover:underline"
          >
            Research Library
          </Link>
          <Link
            href="/library/chat"
            style={{ fontSize: '0.875rem', letterSpacing: '0.08em', color: "#1b5e8a" }}
            className="uppercase hover:underline"
          >
            Ask AI
          </Link>
          <span style={{ fontSize: '0.875rem', color: "#5c6474" }} className="ml-auto">
            {items.length} item{items.length !== 1 ? 's' : ''} in knowledge base
          </span>
        </div>

        <KnowledgeBaseClient
          items={items}
          themes={themes}
          focusAreas={focusAreas}
        />

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/explore" style={{ fontSize: '0.875rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Explore
          </Link>
        </div>
      </div>
    </div>
  )
}
