import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CENTERS, CENTER_COLORS, THEMES } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import {
  UnderstandIcon, InvolveIcon, DeeperIcon, FlowerOfLifeIcon,
} from '@/components/exchange/FlowerIcons'
import { BookOpen, Heart, Gift, Scale } from 'lucide-react'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const metadata: Metadata = {
  title: 'Layers of Engagement | Community Exchange',
  description: 'Four ways to engage with your community: Learning, Action, Resource, and Accountability.',
}

export const revalidate = 3600

const LAYER_META: Record<string, {
  icon: typeof BookOpen
  description: string
  examples: string[]
}> = {
  Learning: {
    icon: BookOpen,
    description: 'Understand what is happening in your community. Read research, explore data, and learn how issues connect to your daily life.',
    examples: ['Articles', 'Reports', 'Courses', 'Videos', 'Research Library'],
  },
  Action: {
    icon: Heart,
    description: 'Put your energy into motion. Volunteer, attend events, sign petitions, join campaigns, and organize with your neighbors.',
    examples: ['Events', 'Volunteer Opportunities', 'Campaigns', 'Petitions'],
  },
  Resource: {
    icon: Gift,
    description: 'Access what you need. Find services, benefits, hotlines, and organizations that provide direct support.',
    examples: ['211 Services', 'Benefits', 'Hotlines', 'Organizations'],
  },
  Accountability: {
    icon: Scale,
    description: 'Know who makes decisions and how to influence them. Track officials, follow policy, and show up at public meetings.',
    examples: ['Elected Officials', 'Policies', 'Civic Calendar', 'Voting Guides'],
  },
}

export default async function CentersIndexPage() {
  const supabase = await createClient()

  // Single query: fetch center, pathway, and image_url for all active content
  const centerNames = Object.keys(CENTERS)
  const { data: allContent } = await supabase
    .from('content_published')
    .select('center, pathway_primary, image_url')
    .eq('is_active', true)

  // Compute counts, sample images, and pathway breakdown in one pass
  const counts: Record<string, number> = {}
  const sampleImages: Record<string, string | null> = {}
  const pwCountsByCenter: Record<string, Record<string, number>> = {}

  for (const row of (allContent ?? [])) {
    const c = row.center || 'Learning'
    counts[c] = (counts[c] || 0) + 1

    if (row.image_url && !sampleImages[c]) {
      sampleImages[c] = row.image_url
    }

    if (row.pathway_primary) {
      if (!pwCountsByCenter[c]) pwCountsByCenter[c] = {}
      pwCountsByCenter[c][row.pathway_primary] = (pwCountsByCenter[c][row.pathway_primary] || 0) + 1
    }
  }

  const pathwayBreakdown: Record<string, Array<{ id: string; name: string; color: string; count: number }>> = {}
  for (const name of centerNames) {
    const pwCounts = pwCountsByCenter[name] || {}
    pathwayBreakdown[name] = Object.entries(pwCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, count]) => {
        const theme = (THEMES as Record<string, { name: string; color: string }>)[id]
        return { id, name: theme?.name || id, color: theme?.color || '#8B7E74', count }
      })
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Engagement' }]} />

      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-text mb-3">Layers of Engagement</h1>
        <p className="text-brand-muted max-w-xl mx-auto">
          Four concentric layers — from understanding to accountability. Every piece of content lives in one of these spaces.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div>
          {/* Visual — concentric rings hint */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              {centerNames.map(function (name, i) {
                const color = CENTER_COLORS[name] || '#8B7E74'
                const size = 180 - i * 30
                return (
                  <div
                    key={name}
                    className="absolute rounded-full border-2"
                    style={{
                      width: size,
                      height: size,
                      borderColor: color,
                      opacity: 0.2 + i * 0.15,
                      top: (180 - size) / 2,
                      left: (180 - size) / 2,
                    }}
                  />
                )
              })}
              <div className="w-[180px] h-[180px] flex items-center justify-center">
                <FlowerOfLifeIcon size={60} />
              </div>
            </div>
          </div>

          {/* Center cards */}
          <div className="space-y-6">
            {centerNames.map(function (name, i) {
              const config = CENTERS[name]
              const color = CENTER_COLORS[name] || '#8B7E74'
              const meta = LAYER_META[name]
              const Icon = meta?.icon || BookOpen
              const count = counts[name] || 0
              const pathways = pathwayBreakdown[name] || []
              const image = sampleImages[name]

              return (
                <Link
                  key={name}
                  href={'/centers/' + config.slug}
                  className="block bg-white rounded-xl border-2 border-brand-border overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Color accent + icon */}
                    <div
                      className="sm:w-48 flex-shrink-0 flex items-center justify-center p-6"
                      style={{ backgroundColor: color + '10' }}
                    >
                      <div className="text-center">
                        <Icon size={32} style={{ color }} className="mx-auto mb-2" />
                        <div className="font-serif text-xl font-bold" style={{ color }}>{name}</div>
                        <div className="text-xs text-brand-muted mt-1">{count} resources</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <p className="text-sm font-serif italic text-brand-muted mb-2">{config.question}</p>
                      <p className="text-sm text-brand-text leading-relaxed mb-3">{meta?.description}</p>

                      {/* What you'll find */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(meta?.examples || []).map(function (ex) {
                          return (
                            <span
                              key={ex}
                              className="text-[11px] px-2 py-0.5 rounded"
                              style={{ backgroundColor: color + '12', color }}
                            >
                              {ex}
                            </span>
                          )
                        })}
                      </div>

                      {/* Top pathways */}
                      {pathways.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-brand-muted">Top pathways:</span>
                          {pathways.map(function (pw) {
                            return (
                              <span key={pw.id} className="flex items-center gap-1 text-[10px] text-brand-muted">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pw.color }} />
                                {pw.name}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Preview image */}
                    {image && (
                      <div className="hidden md:block w-36 flex-shrink-0">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <IndexWayfinder currentPage="centers" related={[{label:'Topics',href:'/pathways'},{label:'Explore',href:'/explore'},{label:'Collections',href:'/collections'}]} color="#C75B2A" />
            <FeaturedPromo variant="card" />
          </div>
        </div>
      </div>
    </div>
  )
}
