const STATUS_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  auto_approved: { dot: 'bg-green-500', text: 'text-green-700', label: 'Auto-Approved' },
  approved: { dot: 'bg-green-500', text: 'text-green-700', label: 'Approved' },
  pending: { dot: 'bg-yellow-500', text: 'text-yellow-700', label: 'Pending' },
  flagged: { dot: 'bg-red-500', text: 'text-red-700', label: 'Flagged' },
  rejected: { dot: 'bg-gray-400', text: 'text-gray-600', label: 'Rejected' },
  classified: { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Classified' },
  success: { dot: 'bg-green-500', text: 'text-green-700', label: 'Success' },
  error: { dot: 'bg-red-500', text: 'text-red-700', label: 'Error' },
  partial: { dot: 'bg-yellow-500', text: 'text-yellow-700', label: 'Partial' },
}

interface StatusBadgeProps {
  status: string | null
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-brand-muted text-xs">-</span>
  const config = STATUS_CONFIG[status] || { dot: 'bg-gray-400', text: 'text-gray-600', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
