import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getEntityMeshProfile } from '@/lib/data/exchange'

interface EntityMeshProps {
  entityType: 'content' | 'official' | 'policy' | 'service' | 'organization'
  entityId: string
}

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
      <h3 className="font-display text-xl font-semibold mb-4">Connected Through the Community</h3>

      {/* Focus areas — comma-separated italic text */}
      {hasFocusAreas && (
        <div className="mb-6">
          <span className="text-xs italic text-brand-muted leading-relaxed">
            {mesh.focusAreas.map(function (fa, i) {
              const themeKey = fa.theme_id as keyof typeof THEMES | null
              const color = themeKey ? THEMES[themeKey]?.color : '#8B7E74'
              return (
                <span key={fa.focus_id}>
                  {i > 0 && <span className="mx-1">&middot;</span>}
                  <Link
                    href={'/explore/focus/' + fa.focus_id}
                    className="hover:underline transition-colors"
                    style={{ color: color || '#8B7E74' }}
                  >
                    {fa.focus_area_name}
                  </Link>
                </span>
              )
            })}
          </span>
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
                className="block bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
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
                className="block bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
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
                className="block bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
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
                className="block bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
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
