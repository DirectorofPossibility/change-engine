'use client'

import { useState } from 'react'
import { approveRoleRequest, denyRoleRequest } from './role-request-actions'

interface RoleRequestItem {
  id: string
  user_id: string
  requested_role: string
  org_name: string | null
  reason: string | null
  status: string
  created_at: string
  user_display_name: string | null
  user_email: string | null
  user_role: string
}

export function RoleRequestQueue({ initialRequests }: { initialRequests: RoleRequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)
  const [denyingId, setDenyingId] = useState<string | null>(null)
  const [denyNote, setDenyNote] = useState('')

  if (requests.length === 0) return null

  async function handleApprove(id: string) {
    setLoading(id)
    const res = await approveRoleRequest(id)
    if ('error' in res) {
      alert(res.error)
    } else {
      setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
    }
    setLoading(null)
  }

  async function handleDeny(id: string) {
    setLoading(id)
    const res = await denyRoleRequest(id, denyNote || undefined)
    if ('error' in res) {
      alert(res.error)
    } else {
      setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
    }
    setDenyingId(null)
    setDenyNote('')
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden mb-6">
      <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-yellow-800">
          Pending Role Requests ({requests.length})
        </h2>
      </div>
      <div className="divide-y divide-brand-border">
        {requests.map(function (r) {
          const isLoading = loading === r.id
          const isDenying = denyingId === r.id
          return (
            <div key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-text">
                    {r.user_display_name || r.user_email || 'Unknown user'}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {r.user_email} — currently <span className="capitalize font-medium">{r.user_role}</span>
                  </p>
                  <p className="text-sm mt-1">
                    Requesting: <span className="capitalize font-semibold text-brand-accent">{r.requested_role}</span>
                    {r.org_name && <span className="text-brand-muted"> for {r.org_name}</span>}
                  </p>
                  {r.reason && (
                    <p className="text-xs text-brand-muted mt-1 italic">&ldquo;{r.reason}&rdquo;</p>
                  )}
                  <p className="text-xs text-brand-muted mt-1">
                    Submitted {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isLoading ? (
                    <span className="text-xs text-brand-muted">Processing...</span>
                  ) : isDenying ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={denyNote}
                        onChange={function (e) { setDenyNote(e.target.value) }}
                        placeholder="Reason (optional)"
                        className="border border-brand-border rounded-md px-2 py-1 text-xs w-48 focus:outline-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={function () { handleDeny(r.id) }}
                          className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md"
                        >
                          Confirm Deny
                        </button>
                        <button
                          onClick={function () { setDenyingId(null); setDenyNote('') }}
                          className="text-xs text-brand-muted hover:underline px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={function () { handleApprove(r.id) }}
                        className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md"
                      >
                        Approve
                      </button>
                      <button
                        onClick={function () { setDenyingId(r.id) }}
                        className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
