// Air Quality - using AQICN public API (no key needed for basic feed)
export async function getHoustonAirQuality() {
  try {
    const res = await fetch('https://api.waqi.info/feed/houston/?token=demo', { next: { revalidate: 1800 } })
    const json = await res.json()
    if (json.status === 'ok') {
      return {
        aqi: json.data.aqi as number,
        dominentPol: json.data.dominentpol as string,
        time: json.data.time?.s as string | undefined,
        station: json.data.city?.name as string | undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

// NWS Weather Alerts for Harris County
export async function getWeatherAlerts() {
  try {
    const res = await fetch('https://api.weather.gov/alerts/active?zone=TXC201', {
      next: { revalidate: 900 },
      headers: { 'User-Agent': 'TheChangeEngine/1.0 (hello@thechangelab.net)' },
    })
    const json = await res.json()
    return (json.features || []).slice(0, 5).map(function (f: any) {
      return {
        event: f.properties?.event as string,
        headline: f.properties?.headline as string,
        severity: f.properties?.severity as string,
        description: (f.properties?.description || '').slice(0, 300) as string,
        expires: f.properties?.expires as string,
      }
    })
  } catch {
    return []
  }
}

export type WeatherAlert = {
  event: string
  headline: string
  severity: string
  description: string
  expires: string
}

export type BayouLevel = {
  name: string
  siteId: string
  level: number | null
  unit: string
  dateTime: string | null
}

export type AirQualityData = {
  aqi: number
  dominentPol: string
  time: string | undefined
  station: string | undefined
}

// USGS Bayou Water Levels - key Houston gauges
export async function getBayouLevels(): Promise<BayouLevel[]> {
  const gauges = [
    { id: '08074000', name: 'Buffalo Bayou at Shepherd Dr' },
    { id: '08074500', name: 'White Oak Bayou at Heights Blvd' },
    { id: '08075000', name: 'Brays Bayou at Main St' },
    { id: '08075400', name: 'Sims Bayou at Hiram Clarke' },
  ]
  try {
    const siteIds = gauges.map(function (g) { return g.id }).join(',')
    const res = await fetch(
      'https://waterservices.usgs.gov/nwis/iv/?sites=' + siteIds + '&parameterCd=00065&format=json',
      { next: { revalidate: 900 } }
    )
    const json = await res.json()
    const timeSeries = json.value?.timeSeries || []
    return gauges.map(function (gauge) {
      const series = timeSeries.find(function (ts: any) {
        return ts.sourceInfo?.siteCode?.[0]?.value === gauge.id
      })
      const latest = series?.values?.[0]?.value?.[0]
      return {
        name: gauge.name,
        siteId: gauge.id,
        level: latest ? parseFloat(latest.value) : null,
        unit: 'ft',
        dateTime: latest?.dateTime || null,
      }
    })
  } catch {
    return []
  }
}
