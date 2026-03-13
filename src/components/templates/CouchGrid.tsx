import Link from 'next/link'
import Image from 'next/image'
import { Geo } from '@/components/geo/sacred'

interface CouchItem {
  id: string
  href: string
  title: string
  dek?: string
  type?: string
  meta?: string
  imageUrl?: string
  isFeature?: boolean
}

interface CouchGridProps {
  items: CouchItem[]
  themeColor: string
  themeLt?: string
  geoType?: string
}

/**
 * Editorial "From the Couch" grid.
 * Feature item spans 2 rows on left, 4 side items on right.
 * Matches the .couch-grid spec from the design system.
 */
export function CouchGrid({ items, themeColor, themeLt, geoType = 'seed_of_life' }: CouchGridProps) {
  if (items.length === 0) return null

  const feature = items.find(i => i.isFeature) || items[0]
  const sides = items.filter(i => i !== feature).slice(0, 4)
  const lt = themeLt || `${themeColor}18`

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] border border-rule-inner">
      {/* Feature */}
      <div className="md:row-span-2 md:border-r border-rule-inner flex flex-col">
        {/* Illustration */}
        <div
          className="aspect-[3/2] flex items-center justify-center relative overflow-hidden border-b border-rule-inner"
          style={{ background: lt }}
        >
          {feature.imageUrl ? (
            <Image
              src={feature.imageUrl}
              alt={feature.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute opacity-[0.18] animate-[spin_60s_linear_infinite]">
              <Geo type={geoType} size={180} color={themeColor} />
            </div>
          )}
        </div>
        {/* Body */}
        <div className="p-6 flex-1">
          {feature.type && (
            <span className="font-mono text-[0.6875rem] tracking-[0.18em] uppercase text-dim block mb-1">
              {feature.type}
            </span>
          )}
          <Link href={feature.href}>
            <h3 className="font-display text-[1.1rem] font-bold leading-tight mb-2 hover:underline">
              {feature.title}
            </h3>
          </Link>
          {feature.dek && (
            <p className="font-body italic text-[0.78rem] leading-relaxed text-dim">
              {feature.dek}
            </p>
          )}
          {feature.meta && (
            <span className="font-mono text-[0.6875rem] text-faint mt-3 block">
              {feature.meta}
            </span>
          )}
        </div>
      </div>

      {/* Side reads */}
      {sides.map((item, i) => (
        <Link
          key={item.id}
          href={item.href}
          className="group border-b border-rule p-5 flex flex-col gap-2 hover:bg-paper transition-colors"
          style={{ borderWidth: i < sides.length - 1 ? '1.5px' : 0 }}
        >
          {item.type && (
            <span className="font-mono text-[0.6875rem] tracking-[0.18em] uppercase text-dim">
              {item.type}
            </span>
          )}
          <h4 className="font-display text-[0.88rem] font-bold leading-tight group-hover:underline line-clamp-2">
            {item.title}
          </h4>
          {item.meta && (
            <span className="font-mono text-[0.6875rem] text-faint">
              {item.meta}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
