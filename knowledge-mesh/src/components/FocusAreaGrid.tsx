"use client";

import { Organization } from "@/data/types";
import OrgCard from "./OrgCard";

interface Props {
  organizations: Organization[];
  loading: boolean;
  selectedOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  accentColor: string;
}

export default function FocusAreaGrid({ organizations, loading, selectedOrg, onSelectOrg, accentColor }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (<div key={n} className="h-20 animate-pulse rounded-lg bg-gray-800/60" />))}
      </div>
    );
  }
  if (organizations.length === 0) {
    return <p className="rounded-lg border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">No organizations found for this domain yet.</p>;
  }
  return (
    <div className="space-y-2">
      {organizations.map((org) => (
        <OrgCard key={org.id} org={org} isSelected={selectedOrg?.id === org.id} onSelect={() => onSelectOrg(org)} accentColor={accentColor} />
      ))}
    </div>
  );
}
