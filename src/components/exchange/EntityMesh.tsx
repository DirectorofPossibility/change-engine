/**
 * @fileoverview Knowledge mesh connections panel for entity profile pages.
 *
 * Shows how an entity (content, official, policy, service, or organization)
 * connects to other entities through shared focus areas. Renders focus area
 * pills and linked cards for related content, officials, policies, and services.
 *
 * This is a server component — it fetches mesh data directly from Supabase.
 * Embed it in any entity detail page to show the wayfinder mesh.
 *
 * @datasource {@link getEntityMeshProfile} from `@/lib/data/exchange`
 */

import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getEntityMeshProfile } from '@/lib/data/exchange'

interface EntityMeshProps {
  /** Entity type for junction table lookup. */
  entityType: 'content' | 'official' | 'policy' | 'service' | 'organization'
  /** Entity ID to look up focus areas. */
  entityId: string
}

/**
 * Knowledge mesh connections for an entity.
 *
 * Fetches related entities via shared focus areas and renders them as
 * linked cards grouped by type. Shows focus area pills with pathway colors.
 *
 * @param props - {@link EntityMeshProps}
 */
export async function EntityMesh({ entityType, entityId }: EntityMeshProps) {
  const mesh = await getEntityMeshProfile(entityType, entityId)

  const hasFocusAreas = mesh.focusAreas.length > 0
  const hasRelated =
    mesh.relatedContent.length > 0 ||
    mesh.relatedOfficials.length > 0 ||
    mesh.relatedPolicies.length > 0 ||
    mesh.relatedServices.length > 0

  if (!hasFocusAreas && !hasRelated) return null

  return (
    <section className="mt-10 pt-8 border-t border-brand-border">
      <h3 className="font-serif text-xl font-semibold mb-4">Connected Through the Community</h3>

      {/* Focus area pills */}
      {hasFocusAreas && (
        <div className="flex flex-wrap gap-2 mb-6">
          {mesh.focusAreas.map(function (fa) {
            const themeKey = fa.theme_id as keyof typeof THEMES | null
            const color = themeKey ? THEMES[themeKey]?.color : '#8B7E74'
            return (
              <Link
                key={fa.focus_id}
                href={'/explore/focus/' + fa.focus_id}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors hover:shadow-sm"
                style={{
                  backgroundColor: (color || '#8B7E74') + '10',
                  color: color || '#8B7E74',
                  borderColor: (color || '#8B7E74') + '25',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color || '#8B7E74' }}
                />
                {fa.focus_area_name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Related entities grid */}
      {hasRelated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mesh.relatedContent.map(function (c) {
            return (
              <Link
                key={c.id}
                href={'/content/' + c.id}
                className="block bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold">
                  {c.center || 'Resource'}
                </span>
                <p className="text-sm font-medium mt-1 line-clamp-2">{c.title_6th_grade || 'Untitled'}</p>
              </Link>
            )
          })}

          {mesh.relatedOfficials.map(function (o) {
            return (
              <Link
                key={o.official_id}
                href={'/officials/' + o.official_id}
                className="block bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] uppercase tracking-wider text-teal-600 font-semibold">
                  {o.level || 'Official'}
                </span>
                <p className="text-sm font-medium mt-1">{o.official_name}</p>
                {o.title && <p className="text-xs text-brand-muted mt-0.5">{o.title}</p>}
              </Link>
            )
          })}

          {mesh.relatedPolicies.map(function (p) {
            return (
              <Link
                key={p.policy_id}
                href={'/policies/' + p.policy_id}
                className="block bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">
                  {p.status || 'Policy'}
                </span>
                <p className="text-sm font-medium mt-1 line-clamp-2">{p.policy_name}</p>
              </Link>
            )
          })}

          {mesh.relatedServices.map(function (s) {
            return (
              <Link
                key={s.service_id}
                href={'/services/' + s.service_id}
                className="block bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">
                  Service
                </span>
                <p className="text-sm font-medium mt-1 line-clamp-2">{s.service_name}</p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
