/**
 * @fileoverview Circular center card component for The Change Engine homepage.
 *
 * Redesigned with a circle motif: displays each of the 4 Centers as a large
 * circular badge with an SVG image background, the center name, its guiding
 * question, and a resource count. Links to the center detail page.
 *
 * @see {@link CENTERS} for available center definitions.
 */
import Link from 'next/link'
import Image from 'next/image'

/** Map of center names to their SVG image paths. */
const CENTER_IMAGES: Record<string, string> = {
  Learning: '/images/centers/learning.svg',
  Action: '/images/centers/action.svg',
  Resource: '/images/centers/resource.svg',
  Accountability: '/images/centers/accountability.svg',
}

interface CenterCardProps {
  /** Display name of the center (e.g., 'Learning'). */
  name: string
  /** Emoji fallback icon for the center. */
  emoji: string
  /** Guiding question for this center (e.g., 'How can I understand?'). */
  question: string
  /** URL slug used to build the center detail route. */
  slug: string
  /** Number of resources in this center. */
  count: number
}

/**
 * Circular center card with SVG image, name, question, and resource count.
 *
 * Features a large circular image area with the center's SVG illustration,
 * the center name and guiding question below, and a resource count badge.
 * The card uses hover effects including shadow and slight scale-up.
 *
 * @param props - {@link CenterCardProps}
 */
export function CenterCard({ name, emoji, question, slug, count }: CenterCardProps) {
  const imageSrc = CENTER_IMAGES[name]

  return (
    <Link
      href={'/centers/' + slug}
      className="flex flex-col items-center p-6 bg-white border border-brand-border
                 hover:border-ink hover:scale-[1.02] transition-all duration-200 text-center group"
    >
      {/* Circular image area */}
      <div className="relative mb-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-brand-border
                        group-hover:border-ink transition-shadow">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-brand-bg flex items-center justify-center">
              <span className="text-4xl">{emoji}</span>
            </div>
          )}
        </div>
        {/* Resource count badge */}
        {count > 0 && (
          <span className="absolute -bottom-1 -right-1 min-w-[28px] h-7 flex items-center justify-center
                           rounded-full bg-brand-accent text-white text-xs font-bold px-1.5 shadow">
            {count}
          </span>
        )}
      </div>
      <h3 className="font-bold text-brand-text mb-1">{name}</h3>
      <p className="text-sm text-brand-muted">{question}</p>
    </Link>
  )
}
