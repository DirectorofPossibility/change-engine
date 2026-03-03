/**
 * @fileoverview SSR-safe dynamic imports for Leaflet map components.
 *
 * Leaflet accesses `window` and `document` at import time, which causes
 * errors during Next.js server-side rendering. This module uses
 * `next/dynamic` with `ssr: false` to lazily load the three entry-point
 * map components only on the client.
 *
 * The barrel `index.ts` re-exports these dynamic versions so that all
 * consumer pages get SSR safety automatically with zero code changes.
 */
import dynamic from 'next/dynamic'

export const ClusteredMap = dynamic(
  () => import('./ClusteredMap').then(mod => mod.ClusteredMap),
  { ssr: false }
)

export const InteractiveMap = dynamic(
  () => import('./InteractiveMap').then(mod => mod.InteractiveMap),
  { ssr: false }
)

export const SingleLocationMap = dynamic(
  () => import('./SingleLocationMap').then(mod => mod.SingleLocationMap),
  { ssr: false }
)
