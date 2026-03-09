/**
 * @fileoverview Client component for creating and editing partner events.
 *
 * Provides a form with opportunity name, description, dates, location fields,
 * virtual flag, registration URL, spots available, and focus area multi-select.
 *
 * Calls server actions from ./actions.ts on submit.
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent, deleteEvent } from './actions'

const THEMES: Record<string, { name: string }> = {
  THEME_01: { name: 'Health' },
  THEME_02: { name: 'Families' },
  THEME_03: { name: 'Neighborhood' },
  THEME_04: { name: 'Voice' },
  THEME_05: { name: 'Money' },
  THEME_06: { name: 'Planet' },
  THEME_07: { name: 'The Bigger We' },
}

interface FocusArea {
  focus_id: string
  focus_area_name: string
  theme_id: string | null
}

interface EventType {
  name: string
  category: string
}

interface EventData {
  opportunity_id: string
  opportunity_name: string
  description_5th_grade: string | null
  event_type: string | null
  start_date: string | null
  end_date: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  is_virtual: string | null
  registration_url: string | null
  spots_available: number | null
  focus_area_ids: string | null
}

interface EventFormClientProps {
  event?: EventData | null
  focusAreas: FocusArea[]
  eventTypes?: EventType[]
}

export default function EventFormClient({ event, focusAreas, eventTypes = [] }: EventFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!event

  const [opportunityName, setOpportunityName] = useState(event?.opportunity_name || '')
  const [eventType, setEventType] = useState(event?.event_type || '')
  const [description, setDescription] = useState(event?.description_5th_grade || '')
  const [startDate, setStartDate] = useState(event?.start_date?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(event?.end_date?.slice(0, 10) || '')
  const [address, setAddress] = useState(event?.address || '')
  const [city, setCity] = useState(event?.city || '')
  const [state, setState] = useState(event?.state || 'TX')
  const [zipCode, setZipCode] = useState(event?.zip_code || '')
  const [isVirtual, setIsVirtual] = useState(event?.is_virtual === 'true')
  const [registrationUrl, setRegistrationUrl] = useState(event?.registration_url || '')
  const [spotsAvailable, setSpotsAvailable] = useState<string>(
    event?.spots_available != null ? String(event.spots_available) : ''
  )

  // Parse focus_area_ids from comma-separated string
  const initialFocusAreas = event?.focus_area_ids
    ? event.focus_area_ids.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(initialFocusAreas)

  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function toggleFocusArea(focusId: string) {
    setSelectedFocusAreas((prev) =>
      prev.includes(focusId)
        ? prev.filter((id) => id !== focusId)
        : [...prev, focusId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!opportunityName.trim()) {
      setError('Event name is required.')
      return
    }

    const formData = new FormData()
    formData.set('opportunity_name', opportunityName.trim())
    formData.set('event_type', eventType)
    formData.set('description_5th_grade', description.trim())
    formData.set('start_date', startDate)
    formData.set('end_date', endDate)
    formData.set('address', address.trim())
    formData.set('city', city.trim())
    formData.set('state', state.trim())
    formData.set('zip_code', zipCode.trim())
    formData.set('is_virtual', isVirtual ? 'true' : 'false')
    formData.set('registration_url', registrationUrl.trim())
    formData.set('spots_available', spotsAvailable)
    formData.set('focus_area_ids', selectedFocusAreas.join(','))

    startTransition(async () => {
      try {
        if (isEditing && event) {
          const result = await updateEvent(event.opportunity_id, formData)
          if (result?.error) {
            setError(result.error)
            return
          }
        } else {
          const result = await createEvent(formData)
          if (result?.error) {
            setError(result.error)
            return
          }
        }
        router.push('/dashboard/partner/events')
        router.refresh()
      } catch {
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  async function handleDelete() {
    if (!event) return
    startTransition(async () => {
      try {
        const result = await deleteEvent(event.opportunity_id)
        if (result?.error) {
          setError(result.error)
          return
        }
        router.push('/dashboard/partner/events')
        router.refresh()
      } catch {
        setError('Failed to delete event.')
      }
    })
  }

  // Group focus areas by theme
  const focusAreasByTheme: Record<string, FocusArea[]> = {}
  focusAreas.forEach((fa) => {
    const key = fa.theme_id || 'other'
    if (!focusAreasByTheme[key]) focusAreasByTheme[key] = []
    focusAreasByTheme[key].push(fa)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Event Name */}
      <div>
        <label htmlFor="opportunity_name" className="block text-sm font-medium text-brand-text mb-1">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          id="opportunity_name"
          type="text"
          value={opportunityName}
          onChange={(e) => setOpportunityName(e.target.value)}
          placeholder="Community cleanup, Workshop, Town hall..."
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          required
        />
      </div>

      {/* Event Type */}
      <div>
        <label htmlFor="event_type" className="block text-sm font-medium text-brand-text mb-1">
          Event Type
        </label>
        {eventTypes.length > 0 ? (
          <select
            id="event_type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          >
            <option value="">Select a type...</option>
            {Object.entries(
              eventTypes.reduce<Record<string, EventType[]>>((acc, et) => {
                if (!acc[et.category]) acc[et.category] = []
                acc[et.category].push(et)
                return acc
              }, {})
            ).map(([category, types]) => (
              <optgroup key={category} label={category}>
                {types.map((et) => (
                  <option key={et.name} value={et.name}>{et.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        ) : (
          <input
            id="event_type"
            type="text"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Workshop, Town Hall, Art Show..."
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description_5th_grade" className="block text-sm font-medium text-brand-text mb-1">
          Description
        </label>
        <textarea
          id="description_5th_grade"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the event in clear, accessible language"
          rows={5}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
        <p className="text-xs text-brand-muted mt-1">
          Write at a 5th-grade reading level so it is accessible to all community members.
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-brand-text mb-1">
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-brand-text mb-1">
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
      </div>

      {/* Virtual Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="is_virtual"
          type="checkbox"
          checked={isVirtual}
          onChange={(e) => setIsVirtual(e.target.checked)}
          className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent/30"
        />
        <label htmlFor="is_virtual" className="text-sm font-medium text-brand-text">
          This is a virtual event
        </label>
      </div>

      {/* Location Fields */}
      {!isVirtual && (
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-brand-text mb-1">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-brand-text mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Houston"
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-brand-text mb-1">
                State
              </label>
              <input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="TX"
                maxLength={2}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-brand-text mb-1">
                ZIP Code
              </label>
              <input
                id="zip_code"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="77001"
                maxLength={10}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Registration URL */}
      <div>
        <label htmlFor="registration_url" className="block text-sm font-medium text-brand-text mb-1">
          Registration URL
        </label>
        <input
          id="registration_url"
          type="url"
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://example.com/register"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
      </div>

      {/* Spots Available */}
      <div>
        <label htmlFor="spots_available" className="block text-sm font-medium text-brand-text mb-1">
          Spots Available
        </label>
        <input
          id="spots_available"
          type="number"
          value={spotsAvailable}
          onChange={(e) => setSpotsAvailable(e.target.value)}
          placeholder="Leave blank for unlimited"
          min={0}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
      </div>

      {/* Focus Areas Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Focus Areas
        </label>
        <div className="bg-white border border-brand-border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
          {Object.entries(focusAreasByTheme).map(([tId, areas]) => {
            const themeName = (THEMES as any)[tId]?.name || 'Other'
            return (
              <div key={tId}>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
                  {themeName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {areas.map((fa) => (
                    <button
                      key={fa.focus_id}
                      type="button"
                      onClick={() => toggleFocusArea(fa.focus_id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedFocusAreas.includes(fa.focus_id)
                          ? 'bg-brand-accent text-white border-brand-accent'
                          : 'bg-white text-brand-text border-brand-border hover:border-brand-accent'
                      }`}
                    >
                      {fa.focus_area_name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {focusAreas.length === 0 && (
            <p className="text-sm text-brand-muted">No focus areas available.</p>
          )}
        </div>
        {selectedFocusAreas.length > 0 && (
          <p className="text-xs text-brand-muted mt-1">
            {selectedFocusAreas.length} focus area{selectedFocusAreas.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-brand-border">
        <div>
          {isEditing && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-3 py-1.5 border border-brand-border rounded-lg hover:bg-brand-bg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete Event
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/partner/events')}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-bg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEditing
                ? 'Update Event'
                : 'Create Event'}
          </button>
        </div>
      </div>
    </form>
  )
}
