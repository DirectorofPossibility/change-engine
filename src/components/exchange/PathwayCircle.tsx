/**
 * @fileoverview Circular pathway browsing component for The Change Engine.
 *
 * Renders a single pathway as a clickable circle with the pathway's theme
 * color, an SVG image, the pathway name, and an optional
 * resource count badge. Designed for the Yelp-style horizontal category
 * row on the homepage and pathways listing page.
 *
 * @see {@link THEMES} for available pathway definitions.
 */
import Link from 'next/link'
import Image from 'next/image'

/** Map of pathway theme IDs to their SVG image filenames. */
const PATHWAY_IMAGES: Record<string, string> = {
  THEME_01: '/images/pathways/health.svg',
  THEME_02: '/images/pathways/families.svg',
  THEME_03: '/images/pathways/neighborhood.svg',
  THEME_04: '/images/pathways/voice.svg',
  THEME_05: '/images/pathways/money.svg',
  THEME_06: '/images/pathways/planet.svg',
  THEME_07: '/images/pathways/bigger-we.svg',
}

interface PathwayCircleProps {
  /** Pathway theme ID (e.g., 'THEME_01'). */
  id: string
  /** Display name for the pathway (e.g., 'Our Health'). */
  name: string
  /** Theme color hex value used for the circle background fallback. */
  color: string
  /** URL slug used to build the pathway detail route. */
  slug: string
  /** Number of resources in this pathway, shown as a small badge. */
  count?: number
}

/**
 * Circular pathway browsing component with image, name, and count badge.
 *
 * Used in horizontal scrollable rows (like Yelp category icons) to let
 * users browse pathways visually. On hover, the circle scales up with a
 * shadow effect.
 *
 * @param props - {@link PathwayCircleProps}
 */
export function PathwayCircle({ id, name, color, slug, count }: PathwayCircleProps) {
  const imageSrc = PATHWAY_IMAGES[id]

  return (
    <Link
      href={'/pathways/' + slug}
      className="flex-shrink-0 flex flex-col items-center gap-2 group"
    >
      <div className="relative">
        {/* Circle container */}
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center
                     shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200
                     ring-2 ring-white ring-offset-2"
          style={{ backgroundColor: color }}
        >
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {/* Resource count badge */}
        {count != null && count > 0 && (
          <span
            className="absolute -bottom-1 -right-1 min-w-[24px] h-6 flex items-center justify-center
                       rounded-full bg-brand-text text-white text-xs font-bold px-1.5 shadow"
          >
            {count}
          </span>
        )}
      </div>
      <span className="text-xs sm:text-sm font-medium text-brand-text text-center leading-tight max-w-[96px]">
        {name}
      </span>
    </Link>
  )
}
