'use server'

import { createClient } from '@/lib/supabase/server'
import { searchAll } from '@/lib/data/search'

export async function lookupZipAction(zip: string) {
  if (!zip || zip.length !== 5) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, neighborhood_name, council_district, population, median_income, zip_codes')
    .ilike('zip_codes', '%' + zip + '%')

  if (!data || data.length === 0) return null

  // Validate in JS that the ZIP actually matches (not just a substring)
  const match = data.find(function (n) {
    if (!n.zip_codes) return false
    const zips = n.zip_codes.split(',').map(function (z) { return z.trim() })
    return zips.indexOf(zip) !== -1
  })

  if (!match) return null

  // Also fetch officials for this council district
  let officials: { official_name: string; title: string | null; level: string | null }[] = []
  if (match.council_district) {
    const { data: offData } = await supabase
      .from('elected_officials')
      .select('official_name, title, level')
      .eq('district_id', match.council_district)
      .limit(6)
    officials = offData ?? []
  }

  return {
    neighborhood_name: match.neighborhood_name,
    neighborhood_id: match.neighborhood_id,
    council_district: match.council_district,
    population: match.population,
    median_income: match.median_income,
    officials,
  }
}

export async function searchCircleAction(query: string) {
  if (!query || query.trim().length === 0) return null
  const results = await searchAll(query.trim())
  return results
}
