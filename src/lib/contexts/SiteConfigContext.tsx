'use client'

import { createContext, useContext } from 'react'
import type { SiteConfigMap } from '@/lib/data/site-config'

const SiteConfigContext = createContext<SiteConfigMap>({})

export function SiteConfigProvider({ config, children }: { config: SiteConfigMap; children: React.ReactNode }) {
  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>
}

/** Check if a site feature is enabled. Defaults to true if key not found. */
export function useSiteConfig(key: string): boolean {
  const config = useContext(SiteConfigContext)
  return config[key] ?? true
}

/** Get the full config map. */
export function useSiteConfigMap(): SiteConfigMap {
  return useContext(SiteConfigContext)
}
