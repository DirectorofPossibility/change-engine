'use client'

import { useState } from 'react'
import type { ApiKey } from '@/lib/types/dashboard'
import { createApiKey, revokeApiKey, deleteApiKey } from './actions'

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const label = form.get('label') as string
    const org_id = (form.get('org_id') as string) || undefined
    const rate_limit = parseInt(form.get('rate_limit_per_day') as string) || 500
    const expires_at = (form.get('expires_at') as string) || undefined

    const result = await createApiKey({
      label,
      org_id,
      rate_limit_per_day: rate_limit,
      expires_at,
    })

    setSaving(false)
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }

    setRawKey(result.rawKey || null)
    setShowCreate(false)
    window.location.reload()
  }

  async function handleRevoke(id: string) {
    const result = await revokeApiKey(id)
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    setKeys(keys.map(k => k.id === id ? { ...k, is_active: false } : k))
  }

  async function handleDelete(id: string) {
    const result = await deleteApiKey(id)
    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }
    setKeys(keys.filter(k => k.id !== id))
    setConfirmDelete(null)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Create API Key
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Manage API keys for programmatic content ingestion via the <code className="bg-gray-100 px-1 rounded">api-ingest</code> endpoint.
      </p>

      {/* Raw key display (shown once after creation) */}
      {rawKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            API key created! Copy it now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono select-all">
              {rawKey}
            </code>
            <button
              onClick={() => copyToClipboard(rawKey)}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setRawKey(null)}
            className="mt-2 text-xs text-green-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Keys table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Key</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Label</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Rate Limit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Requests</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Used</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {keys.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            )}
            {keys.map((key) => (
              <tr key={key.id} className={!key.is_active ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-mono text-xs">{key.key_prefix}</td>
                <td className="px-4 py-3">{key.label}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    key.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {key.expires_at && new Date(key.expires_at) < new Date() && (
                    <span className="ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Expired
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{key.rate_limit_per_day}/day</td>
                <td className="px-4 py-3 text-right">{key.total_requests.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{key.total_items.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {key.is_active && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      className="text-xs text-yellow-600 hover:text-yellow-800"
                    >
                      Revoke
                    </button>
                  )}
                  {confirmDelete === key.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-xs text-red-600 font-medium hover:text-red-800"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(key.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  name="label"
                  required
                  placeholder="e.g. Houston Food Bank API"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID (optional)</label>
                <input
                  name="org_id"
                  placeholder="e.g. ORG-HFB"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (per day)</label>
                <input
                  name="rate_limit_per_day"
                  type="number"
                  defaultValue={500}
                  min={1}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input
                  name="expires_at"
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
