/**
 * @fileoverview Feature flags for phased platform rollout.
 *
 * Controls which routes are visible in navigation and accessible to users.
 * Set NEXT_PUBLIC_LAUNCH_PHASE in .env.local to control the active phase.
 *
 * Phases:
 *   mvp      — Core civic compass + content feed + officials + search
 *   update1  — Neighborhoods, polling, services, organizations
 *   update2  — Events, opportunities, campaigns, voter tools
 *   update3  — Elections, policies, benefits, learning paths
 *   update4  — User accounts, adventures, guides, TIRZ, teen hub
 *   full     — Everything enabled (default for development)
 */

export type LaunchPhase = 'mvp' | 'update1' | 'update2' | 'update3' | 'update4' | 'full'

/**
 * Routes grouped by launch phase. Each phase includes all previous phases.
 * Routes not listed here are always enabled (about, contact, login, etc.).
 */
const PHASE_ROUTES: Record<LaunchPhase, string[]> = {
  mvp: [
    // Core experience — the Compass links to all of these
    '/compass',
    '/search',
    '/officials',
    '/news',
    '/library',
    '/pathways',
    '/content',
    '/services',
    '/organizations',
    '/opportunities',
    '/polling-places',
    '/elections',
    '/donate',
    '/centers',
    // Auth + account
    '/about',
    '/contact',
    '/help',
    '/login',
    '/signup',
    '/reset-password',
    '/me',
    '/goodthings',
    '/privacy',
    '/terms',
    '/accessibility',
    '/chat',
    '/my-area',
  ],
  update1: [
    '/neighborhoods',
    '/super-neighborhoods',
    '/geography',
    '/districts',
    '/agencies',
    '/explore',
    '/calendar',
    '/call-your-senators',
    '/community',
  ],
  update2: [
    '/campaigns',
    '/foundations',
    '/stories',
    '/action',
    '/policies',
    '/governance',
    '/ballot',
    '/candidates',
  ],
  update3: [
    '/benefits',
    '/learn',
    '/learning-paths',
    '/bookshelf',
    '/collections',
    '/data',
    '/resources',
    '/dashboard-live',
    '/knowledge-graph',
    '/quizzes',
  ],
  update4: [
    '/adventures',
    '/guides',
    '/tirz',
    '/teens',
    '/events',
    '/explore/knowledge-base',
  ],
  full: [],
}

// Always-enabled routes (auth, API, static, admin)
const ALWAYS_ENABLED_PREFIXES = [
  '/api/',
  '/auth/',
  '/_next/',
  '/dashboard',
  '/images/',
  '/geo/',
]

const ALWAYS_ENABLED_EXACT = [
  '/',
  '/account-locked',
]

/**
 * Get the current launch phase from environment.
 * Defaults to 'full' in development, 'mvp' in production if not set.
 */
export function getLaunchPhase(): LaunchPhase {
  const env = process.env.NEXT_PUBLIC_LAUNCH_PHASE as LaunchPhase | undefined
  if (env && env in PHASE_ROUTES) return env
  return process.env.NODE_ENV === 'development' ? 'full' : 'full'
}

/**
 * Get all enabled routes for a given phase (cumulative).
 */
export function getEnabledRoutes(phase?: LaunchPhase): string[] {
  const p = phase || getLaunchPhase()
  const phases: LaunchPhase[] = ['mvp', 'update1', 'update2', 'update3', 'update4', 'full']
  const phaseIndex = phases.indexOf(p)

  const routes: string[] = []
  for (let i = 0; i <= phaseIndex; i++) {
    const phaseRoutes = PHASE_ROUTES[phases[i]]
    for (let j = 0; j < phaseRoutes.length; j++) {
      if (routes.indexOf(phaseRoutes[j]) === -1) {
        routes.push(phaseRoutes[j])
      }
    }
  }
  return routes
}

/**
 * Check if a route is enabled in the current launch phase.
 */
export function isRouteEnabled(pathname: string, phase?: LaunchPhase): boolean {
  // Always-enabled routes
  if (ALWAYS_ENABLED_EXACT.includes(pathname)) return true
  if (ALWAYS_ENABLED_PREFIXES.some(p => pathname.startsWith(p))) return true

  // Full phase = everything enabled
  const p = phase || getLaunchPhase()
  if (p === 'full') return true

  const enabled = getEnabledRoutes(p)

  // Check exact match
  if (enabled.indexOf(pathname) !== -1) return true

  // Check prefix match (e.g., /officials/lookup matches /officials)
  for (let i = 0; i < enabled.length; i++) {
    if (pathname.startsWith(enabled[i] + '/')) return true
  }

  return false
}

/**
 * Filter navigation items based on current launch phase.
 * Use in nav components to hide links to disabled features.
 */
export function filterNavItems<T extends { href: string }>(items: T[], phase?: LaunchPhase): T[] {
  const p = phase || getLaunchPhase()
  if (p === 'full') return items
  return items.filter(item => isRouteEnabled(item.href, p))
}

/**
 * Check if an entire nav section should be visible.
 * A section is visible if at least one of its items is enabled.
 */
export function isSectionVisible(items: { href: string }[], phase?: LaunchPhase): boolean {
  const p = phase || getLaunchPhase()
  if (p === 'full') return true
  return items.some(item => isRouteEnabled(item.href, p))
}

/**
 * Get human-readable label for a launch phase.
 */
export function getPhaseLabel(phase: LaunchPhase): string {
  const labels: Record<LaunchPhase, string> = {
    mvp: 'MVP — The Compass',
    update1: 'Update 1 — Your Neighborhood',
    update2: 'Update 2 — Take Action',
    update3: 'Update 3 — Go Deeper',
    update4: 'Update 4 — Community',
    full: 'Full Platform',
  }
  return labels[phase]
}

/**
 * Get the phase that enables a specific route.
 */
export function getRoutePhase(pathname: string): LaunchPhase {
  const phases: LaunchPhase[] = ['mvp', 'update1', 'update2', 'update3', 'update4']
  for (const phase of phases) {
    for (const route of PHASE_ROUTES[phase]) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return phase
      }
    }
  }
  return 'full'
}
