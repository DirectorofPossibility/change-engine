import { MapPin, Clock, Accessibility, Car, Bus } from 'lucide-react'

interface VotingLocationCardProps {
  name: string
  address: string | null
  city: string | null
  locationType: string | null
  hoursEarlyVoting: string | null
  hoursElectionDay: string | null
  isAccessible: string | null
  hasParking: string | null
  transitAccessible: string | null
  hasCurbside: string | null
}

export function VotingLocationCard({
  name, address, city, locationType,
  hoursEarlyVoting, hoursElectionDay,
  isAccessible, hasParking, transitAccessible, hasCurbside,
}: VotingLocationCardProps) {
  const fullAddress = [address, city].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-xl border border-brand-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-brand-text text-sm">{name}</h4>
        {locationType && (
          <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-muted">{locationType}</span>
        )}
      </div>
      {fullAddress && (
        <p className="flex items-center gap-1.5 text-xs text-brand-muted mb-2">
          <MapPin size={12} className="shrink-0" /> {fullAddress}
        </p>
      )}
      <div className="space-y-1 text-xs text-brand-muted mb-3">
        {hoursEarlyVoting && (
          <p className="flex items-center gap-1.5"><Clock size={12} /> Early voting: {hoursEarlyVoting}</p>
        )}
        {hoursElectionDay && (
          <p className="flex items-center gap-1.5"><Clock size={12} /> Election day: {hoursElectionDay}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-brand-muted">
        {isAccessible === 'Yes' && <span className="flex items-center gap-1"><Accessibility size={12} /> Accessible</span>}
        {hasParking === 'Yes' && <span className="flex items-center gap-1"><Car size={12} /> Parking</span>}
        {transitAccessible === 'Yes' && <span className="flex items-center gap-1"><Bus size={12} /> Transit</span>}
        {hasCurbside === 'Yes' && <span className="flex items-center gap-1">Curbside</span>}
      </div>
    </div>
  )
}
