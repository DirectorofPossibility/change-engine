/**
 * @fileoverview Client component for interactive user management.
 *
 * Provides search, role filtering, and role management actions including:
 * - Assign Partner (with organization dropdown)
 * - Make Admin
 * - Promote to Neighbor
 * - Revoke to User
 */
'use client'

import { useState } from 'react'
import { assignPartnerRole, assignAdminRole, revokeToUser, promoteToNeighbor, setAccountStatus } from './actions'
import type { UserProfile, Organization } from './page'

const ROLES = ['all', 'user', 'neighbor', 'partner', 'admin'] as const

const ROLE_BADGE_STYLES: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  neighbor: 'bg-blue-100 text-blue-700',
  partner: 'bg-green-100 text-green-700',
  admin: 'bg-red-100 text-red-700',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  read_only: 'bg-yellow-100 text-yellow-700',
  locked: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  read_only: 'Read-Only',
  locked: 'Locked',
}

export function UsersClient({
  initialUsers,
  organizations,
}: {
  initialUsers: UserProfile[]
  organizations: Organization[]
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [assigningPartner, setAssigningPartner] = useState<string | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)

  // Build an org lookup for display
  const orgMap: Record<string, string> = {}
  for (const org of organizations) {
    orgMap[org.org_id] = org.org_name
  }

  const filtered = users.filter((u) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const matchesName = u.display_name?.toLowerCase().includes(q)
      const matchesEmail = u.email?.toLowerCase().includes(q)
      if (!matchesName && !matchesEmail) return false
    }
    // Role filter
    if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) return false
    return true
  })

  async function handleAssignPartner(userId: string) {
    if (!selectedOrg) return alert('Please select an organization.')
    setLoading(userId)
    const res = await assignPartnerRole(userId, selectedOrg)
    if ('error' in res) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'partner', org_id: selectedOrg } : u))
    }
    setAssigningPartner(null)
    setSelectedOrg('')
    setLoading(null)
  }

  async function handleMakeAdmin(userId: string) {
    if (!window.confirm('Promote this user to admin? They will have full dashboard access.')) return
    setLoading(userId)
    const res = await assignAdminRole(userId)
    if ('error' in res) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u))
    }
    setLoading(null)
  }

  async function handlePromoteNeighbor(userId: string) {
    setLoading(userId)
    const res = await promoteToNeighbor(userId)
    if ('error' in res) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'neighbor' } : u))
    }
    setLoading(null)
  }

  async function handleRevoke(userId: string) {
    if (!window.confirm('Revoke this user\'s role? They will lose elevated access.')) return
    setLoading(userId)
    const res = await revokeToUser(userId)
    if ('error' in res) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'user', org_id: null } : u))
    }
    setLoading(null)
  }

  async function handleSetStatus(userId: string, status: 'active' | 'read_only' | 'locked') {
    if (status === 'locked' && !window.confirm('Lock this account? The user will be blocked from logging in.')) return
    setLoading(userId)
    const res = await setAccountStatus(userId, status)
    if ('error' in res) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, account_status: status } : u))
    }
    setLoading(null)
  }

  // Count by role for the filter bar
  const roleCounts: Record<string, number> = { all: users.length }
  for (const u of users) {
    const r = u.role || 'user'
    roleCounts[r] = (roleCounts[r] || 0) + 1
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text">User Management</h1>
        <span className="text-sm text-brand-muted">{users.length} total users</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
        />
        <div className="flex gap-1">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                roleFilter === role
                  ? 'bg-brand-accent text-white border-brand-accent'
                  : 'bg-white text-brand-muted border-brand-border hover:border-brand-accent/50'
              }`}
            >
              {role} ({roleCounts[role] || 0})
            </button>
          ))}
        </div>
        <span className="text-sm text-brand-muted ml-auto">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const role = (user.role || 'user') as string
                const status = (user.account_status || 'active') as string
                const isLoading = loading === user.id
                const isAssigningPartner = assigningPartner === user.id

                return (
                  <tr
                    key={user.id}
                    className="border-b border-brand-border/50 hover:bg-brand-bg/50"
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-brand-text">
                      {user.display_name || <span className="text-brand-muted italic">No name</span>}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-brand-muted">
                      {user.email || '-'}
                    </td>

                    {/* Role & Status Badges */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.user}`}>
                          {role}
                        </span>
                        {status !== 'active' && (
                          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE_STYLES[status] || ''}`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {user.org_id ? (orgMap[user.org_id] || user.org_id) : '-'}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {isLoading ? (
                        <span className="text-xs text-brand-muted">Saving...</span>
                      ) : isAssigningPartner ? (
                        /* Partner assignment inline form */
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedOrg}
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            className="border border-brand-border rounded-md px-2 py-1 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                          >
                            <option value="">Select org...</option>
                            {organizations.map((org) => (
                              <option key={org.org_id} value={org.org_id}>
                                {org.org_name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignPartner(user.id)}
                            className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setAssigningPartner(null); setSelectedOrg('') }}
                            className="text-xs text-brand-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* Action buttons */
                        <div className="flex gap-2 flex-wrap">
                          {role !== 'admin' && (
                            <button
                              onClick={() => setAssigningPartner(user.id)}
                              className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors"
                            >
                              Assign Partner
                            </button>
                          )}
                          {role !== 'admin' && (
                            <button
                              onClick={() => handleMakeAdmin(user.id)}
                              className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                          {role !== 'neighbor' && role !== 'admin' && (
                            <button
                              onClick={() => handlePromoteNeighbor(user.id)}
                              className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                            >
                              Make Neighbor
                            </button>
                          )}
                          {role !== 'user' && (
                            <button
                              onClick={() => handleRevoke(user.id)}
                              className="text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
                            >
                              Revoke Role
                            </button>
                          )}
                          {/* Account status actions */}
                          {status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSetStatus(user.id, 'read_only')}
                                className="text-xs text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-2 py-1 rounded-md transition-colors"
                              >
                                Set Read-Only
                              </button>
                              <button
                                onClick={() => handleSetStatus(user.id, 'locked')}
                                className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                              >
                                Lock Account
                              </button>
                            </>
                          )}
                          {status === 'read_only' && (
                            <>
                              <button
                                onClick={() => handleSetStatus(user.id, 'active')}
                                className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => handleSetStatus(user.id, 'locked')}
                                className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                              >
                                Lock Account
                              </button>
                            </>
                          )}
                          {status === 'locked' && (
                            <button
                              onClick={() => handleSetStatus(user.id, 'active')}
                              className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
