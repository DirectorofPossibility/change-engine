'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { createClient } from '@/lib/supabase/client'
import { MapPin, ChevronRight } from 'lucide-react'

interface NeighborhoodData {
  officials: Array<{ official_id: string; official_name: string; title: string | null; level: string | null }>
  services: Array<{ service_id: string; service_name: string }>
  content: Array<{ id: string; title_6th_grade: string }>
  neighborhoodName: string | null
}

export function HomeNeighborhood() {
  const { zip, neighborhood } = useNeighborhood()
  const [data, setData] = useState<NeighborhoodData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(function () {
    if (!zip) { setData(null); return }
    setLoading(true)

    const supabase = createClient()

    async function load() {
      const [officialsRes, servicesRes, contentRes] = await Promise.all([
        supabase.from('elected_officials')
          .select('official_id, official_name, title, level')
          .contains('zip_codes', [zip!])
          .eq('is_active', true)
          .limit(4),
        supabase.from('services_211')
          .select('service_id, service_name')
          .eq('zip_code', zip!)
          .eq('is_active', 'Yes')
          .limit(4),
        supabase.from('content_published')
          .select('id, title_6th_grade')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(4),
      ])

      setData({
        officials: officialsRes.data || [],
        services: servicesRes.data || [],
        content: (contentRes as any).data || [],
        neighborhoodName: neighborhood?.neighborhood_name || null,
      })
      setLoading(false)
    }

    load()
  }, [zip, neighborhood])

  if (!zip) return null
  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={14} className="text-blue" />
          <span className="font-mono text-micro uppercase tracking-wider text-muted">In Your Neighborhood</span>
        </div>
        <div className="h-20 bg-faint animate-pulse" />
      </div>
    )
  }
  if (!data) return null

  const hasContent = data.officials.length > 0 || data.services.length > 0 || data.content.length > 0
  if (!hasContent) return null

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-blue" />
          <span className="font-mono text-micro uppercase tracking-wider text-muted">
            In Your Neighborhood
            {data.neighborhoodName && <> &mdash; {data.neighborhoodName}</>}
          </span>
        </div>
        <Link href={'/geography?zip=' + zip} className="font-mono text-micro uppercase tracking-wider text-blue hover:underline">
          Explore map <ChevronRight size={10} className="inline" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Officials */}
        {data.officials.length > 0 && (
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted mb-3">Your Representatives</p>
            <div className="space-y-2">
              {data.officials.map(function (o) {
                return (
                  <Link key={o.official_id} href={'/officials/' + o.official_id} className="block hover:underline">
                    <span className="font-body text-[0.9rem] font-semibold">{o.official_name}</span>
                    {o.title && <span className="block font-body text-sm text-muted">{o.title}</span>}
                  </Link>
                )
              })}
            </div>
            <Link href="/officials" className="font-mono text-micro uppercase tracking-wider text-blue hover:underline mt-3 inline-block">
              All officials →
            </Link>
          </div>
        )}

        {/* Services */}
        {data.services.length > 0 && (
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted mb-3">Nearby Services</p>
            <div className="space-y-2">
              {data.services.map(function (s) {
                return (
                  <Link key={s.service_id} href={'/services/' + s.service_id} className="block font-body text-[0.9rem] hover:underline">
                    {s.service_name}
                  </Link>
                )
              })}
            </div>
            <Link href={'/services?zip=' + zip} className="font-mono text-micro uppercase tracking-wider text-blue hover:underline mt-3 inline-block">
              All services →
            </Link>
          </div>
        )}

        {/* Content */}
        {data.content.length > 0 && (
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted mb-3">Local News</p>
            <div className="space-y-2">
              {data.content.map(function (c) {
                return (
                  <Link key={c.id} href={'/content/' + c.id} className="block font-body text-[0.9rem] hover:underline line-clamp-2">
                    {c.title_6th_grade}
                  </Link>
                )
              })}
            </div>
            <Link href="/news" className="font-mono text-micro uppercase tracking-wider text-blue hover:underline mt-3 inline-block">
              All news →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
