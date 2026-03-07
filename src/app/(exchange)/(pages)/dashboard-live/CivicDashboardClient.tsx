'use client'

import { useState } from 'react'
import type { AirQualityData, WeatherAlert, BayouLevel } from '@/lib/data/civic-dashboard'

interface CivicDashboardClientProps {
  airQuality: AirQualityData | null
  alerts: WeatherAlert[]
  bayouLevels: BayouLevel[]
}

function getAqiInfo(aqi: number) {
  if (aqi <= 50) return { label: 'Good', color: '#22c55e', bgColor: '#f0fdf4' }
  if (aqi <= 100) return { label: 'Moderate', color: '#eab308', bgColor: '#fefce8' }
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316', bgColor: '#fff7ed' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', bgColor: '#fef2f2' }
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7', bgColor: '#faf5ff' }
  return { label: 'Hazardous', color: '#7f1d1d', bgColor: '#fef2f2' }
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'Extreme': return 'bg-red-100 text-red-800'
    case 'Severe': return 'bg-orange-100 text-orange-800'
    case 'Moderate': return 'bg-yellow-100 text-yellow-800'
    case 'Minor': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getLevelColor(level: number | null) {
  if (level === null) return '#9ca3af'
  if (level < 10) return '#22c55e'
  if (level < 20) return '#eab308'
  if (level < 30) return '#f97316'
  return '#ef4444'
}

function getLevelLabel(level: number | null) {
  if (level === null) return 'No data'
  if (level < 10) return 'Normal'
  if (level < 20) return 'Elevated'
  if (level < 30) return 'High'
  return 'Flood Stage'
}

function formatTime(dateTime: string | null | undefined) {
  if (!dateTime) return 'Unknown'
  try {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateTime
  }
}

export function CivicDashboardClient({ airQuality, alerts, bayouLevels }: CivicDashboardClientProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Record<number, boolean>>({})

  function toggleAlert(index: number) {
    setExpandedAlerts(function (prev) {
      const next = { ...prev }
      next[index] = !next[index]
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* Air Quality Section */}
      <section>
        <h2 className="text-xl font-semibold text-brand-text mb-4">Air Quality</h2>
        {airQuality ? (
          <div className="bg-white rounded-xl border-2 border-brand-border p-6">
            <div className="flex items-start gap-6 flex-wrap">
              <div
                className="flex flex-col items-center justify-center w-28 h-28 rounded-xl"
                style={{ backgroundColor: getAqiInfo(airQuality.aqi).bgColor }}
              >
                <span
                  className="text-4xl font-bold"
                  style={{ color: getAqiInfo(airQuality.aqi).color }}
                >
                  {airQuality.aqi}
                </span>
                <span className="text-xs font-medium text-brand-muted mt-1">AQI</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: getAqiInfo(airQuality.aqi).color }}
                  />
                  <span className="font-semibold text-brand-text">
                    {getAqiInfo(airQuality.aqi).label}
                  </span>
                </div>
                {airQuality.dominentPol && (
                  <p className="text-sm text-brand-muted">
                    Dominant pollutant: <span className="font-medium">{airQuality.dominentPol.toUpperCase()}</span>
                  </p>
                )}
                {airQuality.station && (
                  <p className="text-sm text-brand-muted">
                    Station: {airQuality.station}
                  </p>
                )}
                {airQuality.time && (
                  <p className="text-sm text-brand-muted mt-1">
                    Last updated: {formatTime(airQuality.time)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-brand-border p-6">
            <p className="text-brand-muted">Air quality data unavailable</p>
          </div>
        )}
      </section>

      {/* Weather Alerts Section */}
      <section>
        <h2 className="text-xl font-semibold text-brand-text mb-4">Weather Alerts</h2>
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-brand-border p-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-brand-text font-medium">No active weather alerts</span>
            </div>
            <p className="text-sm text-brand-muted mt-1">Harris County has no active weather warnings at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(function (alert, index) {
              const isExpanded = expandedAlerts[index] || false
              return (
                <div key={index} className="bg-white rounded-xl border-2 border-brand-border p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-brand-text">{alert.event}</h3>
                        <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + getSeverityStyle(alert.severity)}>
                          {alert.severity}
                        </span>
                      </div>
                      {alert.headline && (
                        <p className="text-sm text-brand-text mb-2">{alert.headline}</p>
                      )}
                      {alert.description && (
                        <div>
                          <p className="text-sm text-brand-muted">
                            {isExpanded ? alert.description : alert.description.slice(0, 150) + (alert.description.length > 150 ? '...' : '')}
                          </p>
                          {alert.description.length > 150 && (
                            <button
                              onClick={function () { toggleAlert(index) }}
                              className="text-sm text-brand-accent hover:underline mt-1"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                      {alert.expires && (
                        <p className="text-xs text-brand-muted mt-2">
                          Expires: {formatTime(alert.expires)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Bayou Water Levels Section */}
      <section>
        <h2 className="text-xl font-semibold text-brand-text mb-4">Bayou Water Levels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bayouLevels.map(function (gauge) {
            return (
              <div key={gauge.siteId} className="bg-white rounded-xl border-2 border-brand-border p-6">
                <h3 className="text-sm font-semibold text-brand-text mb-3 min-h-[2.5rem]">
                  {gauge.name}
                </h3>
                {gauge.level !== null ? (
                  <div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: getLevelColor(gauge.level) }}
                      >
                        {gauge.level.toFixed(1)}
                      </span>
                      <span className="text-sm text-brand-muted">{gauge.unit}</span>
                    </div>
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                      style={{
                        color: getLevelColor(gauge.level),
                        backgroundColor: getLevelColor(gauge.level) + '15',
                      }}
                    >
                      {getLevelLabel(gauge.level)}
                    </span>
                    {gauge.dateTime && (
                      <p className="text-xs text-brand-muted mt-1">
                        {formatTime(gauge.dateTime)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No data</p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
