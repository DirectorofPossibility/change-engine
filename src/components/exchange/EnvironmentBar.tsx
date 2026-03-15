import { getHoustonAirQuality, getWeatherAlerts, getBayouLevels, getHoustonWeather } from '@/lib/data/civic-dashboard'

function aqiLabel(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-700', bg: 'bg-green-50' }
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-50' }
  if (aqi <= 150) return { label: 'Sensitive', color: 'text-orange-700', bg: 'bg-orange-50' }
  return { label: 'Unhealthy', color: 'text-red-700', bg: 'bg-red-50' }
}

function bayouStatus(levels: Array<{ level: number | null }>): { label: string; color: string; bg: string } {
  const maxLevel = Math.max(...levels.map(function (l) { return l.level ?? 0 }))
  if (maxLevel < 15) return { label: 'Normal', color: 'text-green-700', bg: 'bg-green-50' }
  if (maxLevel < 25) return { label: 'Elevated', color: 'text-yellow-700', bg: 'bg-yellow-50' }
  return { label: 'High', color: 'text-red-700', bg: 'bg-red-50' }
}

export async function EnvironmentBar() {
  const [airQuality, alerts, bayouLevels, weather] = await Promise.all([
    getHoustonAirQuality(),
    getWeatherAlerts(),
    getBayouLevels(),
    getHoustonWeather(),
  ])

  const hasData = airQuality || alerts.length > 0 || bayouLevels.length > 0 || weather
  if (!hasData) return null

  const aqi = airQuality ? aqiLabel(airQuality.aqi) : null
  const bayou = bayouLevels.length > 0 ? bayouStatus(bayouLevels) : null
  const hasAlerts = alerts.length > 0
  const alertSeverity = hasAlerts ? alerts[0].severity : null

  return (
    <div className="bg-white border-b border-brand-border">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-brand-border">
          {/* Temperature */}
          <div className="py-2.5 px-3 text-center">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-semibold">Houston</p>
            {weather ? (
              <p className="text-sm font-bold text-brand-text">{weather.temperature}°F</p>
            ) : (
              <p className="text-xs text-brand-muted">—</p>
            )}
            {weather?.shortForecast && (
              <p className="text-xs text-brand-muted truncate">{weather.shortForecast}</p>
            )}
          </div>

          {/* Air Quality */}
          <div className="py-2.5 px-3 text-center">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-semibold">Air Quality</p>
            {aqi && airQuality ? (
              <>
                <p className={'text-sm font-bold ' + aqi.color}>{airQuality.aqi} AQI</p>
                <p className={'text-xs font-medium ' + aqi.color}>{aqi.label}</p>
              </>
            ) : (
              <p className="text-xs text-brand-muted">—</p>
            )}
          </div>

          {/* Bayou Levels */}
          <div className="py-2.5 px-3 text-center">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-semibold">Bayou Levels</p>
            {bayou ? (
              <>
                <p className={'text-sm font-bold ' + bayou.color}>{bayou.label}</p>
                <p className="text-xs text-brand-muted">{bayouLevels.length} gauges</p>
              </>
            ) : (
              <p className="text-xs text-brand-muted">—</p>
            )}
          </div>

          {/* NWS Alerts */}
          <div className="py-2.5 px-3 text-center">
            <p className="text-xs uppercase tracking-wider text-brand-muted font-semibold">Alerts</p>
            {hasAlerts ? (
              <>
                <p className={`text-sm font-bold ${alertSeverity === 'Extreme' || alertSeverity === 'Severe' ? 'text-red-700' : 'text-yellow-700'}`}>
                  {alerts.length} active
                </p>
                <p className="text-xs text-brand-muted truncate">{alerts[0].event}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-green-700">None</p>
                <p className="text-xs text-green-600">All clear</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
