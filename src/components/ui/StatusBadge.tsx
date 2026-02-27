const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  auto_approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Auto-Approved' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  flagged: { bg: 'bg-red-50', text: 'text-red-700', label: 'Flagged' },
  rejected: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Rejected' },
  classified: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Classified' },
  success: { bg: 'bg-green-50', text: 'text-green-700', label: 'Success' },
  error: { bg: 'bg-red-50', text: 'text-red-700', label: 'Error' },
  partial: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Partial' },
}

interface StatusBadgeProps {
  status: string | null
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-brand-muted text-xs">-</span>
  const config = STATUS_CONFIG[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
