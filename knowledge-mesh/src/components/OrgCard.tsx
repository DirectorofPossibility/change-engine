"use client";

import { Organization } from "@/data/types";

interface Props { org: Organization; isSelected: boolean; onSelect: () => void; accentColor: string; }

export default function OrgCard({ org, isSelected, onSelect, accentColor }: Props) {
  return (
    <button onClick={onSelect} className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${isSelected ? "border-transparent bg-gray-800" : "border-gray-800 bg-gray-900 hover:bg-gray-800/60"}`} style={isSelected ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : {}}>
      <span className="block text-sm font-medium">{org.name}</span>
      <span className="mt-1 block text-xs text-gray-500 line-clamp-2">{org.summary}</span>
    </button>
  );
}
