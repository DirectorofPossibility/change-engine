import type { Database } from '@/lib/supabase/database.types'

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type LifeSituation = Tables<'life_situations'>
export type ElectedOfficial = Tables<'elected_officials'>
export type Service211 = Tables<'services_211'>
export type LearningPath = Tables<'learning_paths'>
export type Organization = Tables<'organizations'>
export type GovernmentLevel = Tables<'government_levels'>
export type ContentPublished = Tables<'content_published'>

export interface ExchangeStats {
  resources: number
  services: number
  officials: number
  learningPaths: number
}

export interface ServiceWithOrg extends Service211 {
  org_name?: string
}
