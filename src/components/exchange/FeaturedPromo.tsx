'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Promotion {
  promo_id: string
  title: string
  subtitle: string | null
  description: string | null
  promo_type: string
  org_id: string | null
  image_url: string | null
  cta_text: string | null
  cta_href: string | null
  color: string
  org_name?: string | null
  logo_url?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  partner_spotlight: 'Partner Spotlight',
  event: 'Upcoming Event',
  resource: 'Featured Resource',
  campaign: 'Campaign',
  announcement: 'Announcement',
}

/**
 * FeaturedPromo — shows a currently active promotion.
 * Fetches active promos within the current date range, picks one randomly (or by display_order).
 *
 * Variants:
 * - "card": compact sidebar card
 * - "banner": full-width banner for between sections
 * - "hero": large hero-style with image
 */
export function FeaturedPromo({ variant = 'card' }: { variant?: 'card' | 'banner' | 'hero' }) {
  const [promo, setPromo] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    async function load() {
      // Get promos that are active and within date range (or no dates = always active)
      const { data } = await (supabase as any)
        .from('promotions')
        .select('promo_id, title, subtitle, description, promo_type, org_id, image_url, cta_text, cta_href, color')
        .eq('is_active', true)
        .or('start_date.is.null,start_date.lte.' + today)
        .or('end_date.is.null,end_date.gte.' + today)
        .order('display_order', { ascending: true })
        .limit(10)

      if (data && data.length > 0) {
        // Pick random from active promos
        const pick = data[Math.floor(Math.random() * data.length)]

        // If there's an org_id, fetch org details
        if (pick.org_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('org_name, logo_url')
            .eq('org_id', pick.org_id)
            .single()
          if (org) {
            pick.org_name = (org as any).org_name
            pick.logo_url = (org as any).logo_url
          }
        }

        setPromo(pick)
      }
      setLoading(false)
    }

    load()
  }, [])

  if (loading || !promo) return null

  const color = promo.color || '#C75B2A'
  const typeLabel = TYPE_LABELS[promo.promo_type] || 'Featured'
  const href = promo.cta_href || '#'

  if (variant === 'banner') {
    return (
      <div className="relative overflow-hidden border border-brand-border" style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #EDE8E0 100%)' }}>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #C75B2A, #D5D0C8, #C75B2A)' }} />
        <div className="flex items-center gap-5 p-5">
          {promo.image_url ? (
            <Image src={promo.image_url} alt="" className="w-20 h-20 object-cover flex-shrink-0 border border-brand-border"  width={800} height={80} />
          ) : promo.logo_url ? (
            <Image src={promo.logo_url} alt="" className="w-16 h-16 object-contain flex-shrink-0 bg-white p-1 border border-brand-border"  width={48} height={64} />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 bg-brand-bg-alt border border-brand-border">
              <Megaphone size={24} className="text-brand-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-brand-accent">{typeLabel}</span>
            <h3 className="text-base font-bold text-brand-text mt-0.5">{promo.title}</h3>
            {promo.subtitle && <p className="text-sm text-brand-muted mt-0.5">{promo.subtitle}</p>}
            {promo.org_name && <p className="text-[10px] font-mono text-brand-muted-light mt-1">{promo.org_name}</p>}
          </div>
          {promo.cta_href && (
            <Link
              href={href}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white flex-shrink-0 hover:opacity-90 transition-opacity bg-brand-accent"
            >
              {promo.cta_text || 'Learn More'}
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className="relative overflow-hidden" style={{ boxShadow: '4px 4px 0 ' + color + '30' }}>
        {promo.image_url && (
          <div className="h-40 overflow-hidden">
            <Image src={promo.image_url} alt="" className="w-full h-full object-cover"  width={800} height={400} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ top: 0, height: '10rem' }} />
          </div>
        )}
        <div className="h-1.5" style={{ backgroundColor: color }} />
        <div className="p-6" style={{ background: promo.image_url ? undefined : color + '08' }}>
          <div className="flex items-center gap-3 mb-3">
            {promo.logo_url && (
              <Image src={promo.logo_url} alt="" className="w-10 h-10 object-contain bg-white p-0.5 border border-brand-border"  width={48} height={40} />
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color }}>{typeLabel}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-brand-text">{promo.title}</h3>
          {promo.subtitle && <p className="text-sm text-brand-muted mt-1">{promo.subtitle}</p>}
          {promo.description && <p className="text-sm text-brand-muted mt-2 leading-relaxed line-clamp-3">{promo.description}</p>}
          {promo.org_name && <p className="text-[11px] font-mono text-brand-muted-light mt-3">{promo.org_name}</p>}
          {promo.cta_href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color }}
            >
              {promo.cta_text || 'Learn More'}
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Default: card variant (sidebar)
  return (
    <div className="bg-white border border-brand-border overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      {promo.image_url && (
        <div className="h-28 overflow-hidden">
          <Image src={promo.image_url} alt="" className="w-full h-full object-cover"  width={800} height={400} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {promo.logo_url && (
            <Image src={promo.logo_url} alt="" className="w-6 h-6 rounded object-contain"  width={48} height={24} />
          )}
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color }}>{typeLabel}</span>
        </div>
        <h4 className="text-sm font-bold text-brand-text">{promo.title}</h4>
        {promo.subtitle && <p className="text-xs text-brand-muted mt-0.5">{promo.subtitle}</p>}
        {promo.description && <p className="text-xs text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">{promo.description}</p>}
        {promo.org_name && <p className="text-[10px] font-mono text-brand-muted-light mt-2">{promo.org_name}</p>}
        {promo.cta_href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-colors hover:underline"
            style={{ color }}
          >
            {promo.cta_text || 'Learn More'}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}
