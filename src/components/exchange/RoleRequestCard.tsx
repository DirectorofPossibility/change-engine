'use client'

import { useState, useEffect } from 'react'

interface RoleRequest {
  id: string
  requested_role: string
  org_name: string | null
  reason: string | null
  status: string
  review_note: string | null
  created_at: string
  reviewed_at: string | null
}

export function RoleRequestCard({ currentRole }: { currentRole: string }) {
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [requestedRole, setRequestedRole] = useState<'neighbor' | 'partner'>('neighbor')
  const [reason, setReason] = useState('')
  const [orgName, setOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(function () {
    fetch('/api/role-request')
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.requests) setRequests(data.requests)
      })
      .catch(function () { /* ignore */ })
  }, [])

  const hasPending = requests.some(function (r) { return r.status === 'pending' })
  const canRequestNeighbor = currentRole === 'user'
  const canRequestPartner = currentRole === 'user' || currentRole === 'neighbor'
  const canRequest = (canRequestNeighbor || canRequestPartner) && !hasPending

  // Already elevated
  if (currentRole === 'admin' || currentRole === 'partner') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/role-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_role: requestedRole,
          reason: reason.trim() || undefined,
          org_name: requestedRole === 'partner' ? orgName.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(data.message)
        setShowForm(false)
        setReason('')
        setOrgName('')
        // Refresh requests
        const refreshRes = await fetch('/api/role-request')
        const refreshData = await refreshRes.json()
        if (refreshData.requests) setRequests(refreshData.requests)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-brand-text mb-4">Community Roles</h2>

      {/* Pending request */}
      {hasPending && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3">
          <p className="text-sm text-yellow-800 font-medium">Your role request is under review</p>
          {requests.filter(function (r) { return r.status === 'pending' }).map(function (r) {
            return (
              <p key={r.id} className="text-xs text-yellow-700 mt-1">
                Requested: <span className="capitalize font-medium">{r.requested_role}</span>
                {r.org_name && <span> for {r.org_name}</span>}
                {' '}on {new Date(r.created_at).toLocaleDateString()}
              </p>
            )
          })}
        </div>
      )}

      {/* Past requests */}
      {requests.filter(function (r) { return r.status !== 'pending' }).length > 0 && (
        <div className="space-y-2 mb-3">
          {requests.filter(function (r) { return r.status !== 'pending' }).slice(0, 3).map(function (r) {
            return (
              <div key={r.id} className={`rounded-lg border p-3 text-sm ${
                r.status === 'approved'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="capitalize font-medium">{r.requested_role}</span>
                  <span className="text-xs capitalize">{r.status}</span>
                </div>
                {r.review_note && <p className="text-xs mt-1 opacity-80">Note: {r.review_note}</p>}
                <p className="text-xs opacity-60 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Request CTA */}
      {canRequest && !showForm && (
        <div className="space-y-2">
          {canRequestNeighbor && (
            <button
              onClick={function () { setRequestedRole('neighbor'); setShowForm(true) }}
              className="block w-full bg-blue-50 rounded-lg border border-blue-200 p-3 text-sm text-blue-700 hover:bg-blue-100 text-left"
            >
              <span className="font-medium">Become a Neighbor</span>
              <span className="block text-xs text-blue-600 mt-0.5">Share resources with the Houston community</span>
            </button>
          )}
          {canRequestPartner && (
            <button
              onClick={function () { setRequestedRole('partner'); setShowForm(true) }}
              className="block w-full bg-green-50 rounded-lg border border-green-200 p-3 text-sm text-green-700 hover:bg-green-100 text-left"
            >
              <span className="font-medium">Partner with us</span>
              <span className="block text-xs text-green-600 mt-0.5">Represent your organization on the Community Exchange</span>
            </button>
          )}
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-brand-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-brand-text capitalize">
            Request {requestedRole} access
          </h3>

          {requestedRole === 'partner' && (
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Organization name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={function (e) { setOrgName(e.target.value) }}
                className="w-full border-2 border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                placeholder="Your organization"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">
              Why would you like this role? <span className="text-brand-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={function (e) { setReason(e.target.value) }}
              rows={2}
              className="w-full border-2 border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
              placeholder="Tell us a bit about how you'd like to contribute"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={function () { setShowForm(false); setError(null) }}
              className="px-4 py-2 text-brand-muted text-sm hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
