import { getThemesWithFocusAreas } from '@/lib/data/dashboard'
import { TaxonomyClient } from './TaxonomyClient'

export default async function TaxonomyPage() {
  const data = await getThemesWithFocusAreas()
  return (
    <TaxonomyClient
      themes={data.themes}
      focusAreas={data.focusAreas}
      sdgs={data.sdgs}
      sdoh={data.sdoh}
      ntee={data.ntee}
      airs={data.airs}
    />
  )
}
