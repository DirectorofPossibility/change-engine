"use client";

import { Organization } from "@/data/types";

interface Props { org: Organization | null; }

export default function OrgDetail({ org }: Props) {
  if (!org) {
    return <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-gray-800 text-sm text-gray-600">Select an organization to view details</div>;
  }
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-lg font-semibold">{org.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{org.summary}</p>
      {org.focus_areas && org.focus_areas.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {org.focus_areas.map((area) => (<span key={area} className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">{area}</span>))}
          </div>
        </div>
      )}
      {org.website && (<a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-blue-400 hover:underline">Visit website &rarr;</a>)}
    </div>
  );
}
