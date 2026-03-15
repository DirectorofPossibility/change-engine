/**
 * @fileoverview Author/source bio section — displayed below article content.
 *
 * Inspired by Greater Good Magazine's author bio pattern:
 *   - Circular avatar (80px)
 *   - Name as link
 *   - Brief professional bio
 *   - Institution affiliation
 *
 * For Change Engine, this can represent:
 *   - Content source organization
 *   - Official who authored a policy
 *   - Organization that provides a service
 */

import Image from 'next/image'
import Link from 'next/link'

interface AuthorBioProps {
  name: string
  bio?: string | null
  imageUrl?: string | null
  href?: string
  institution?: string | null
  role?: string | null
}

export function AuthorBio({ name, bio, imageUrl, href, institution, role }: AuthorBioProps) {
  return (
    <div className="flex gap-4 p-5 bg-paper border border-rule">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {imageUrl ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden">
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center">
            <span className="font-display text-xl font-bold text-white">
              {name[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          {href ? (
            <Link href={href} className="font-display text-base font-bold text-ink hover:text-blue transition-colors">
              {name}
            </Link>
          ) : (
            <span className="font-display text-base font-bold text-ink">{name}</span>
          )}
          {role && (
            <span className="text-xs text-faint">{role}</span>
          )}
        </div>
        {institution && (
          <p className="text-xs text-muted mt-0.5">{institution}</p>
        )}
        {bio && (
          <p className="text-[13px] text-muted leading-relaxed mt-2 line-clamp-3">{bio}</p>
        )}
      </div>
    </div>
  )
}
