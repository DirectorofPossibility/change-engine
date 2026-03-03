"use client";

import { Domain } from "@/data/types";

interface Props { domain: Domain | null; orgCount: number; loading: boolean; }

export default function StatsBar({ domain, orgCount, loading }: Props) {
  if (!domain) {
    return (
      <div className="flex flex-col items-center gap-2 lg:items-start lg:pt-8">
        <span className="text-3xl font-bold text-gray-300">7</span>
        <span className="text-sm text-gray-500">Domains mapped</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 lg:items-start lg:pt-8">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: domain.color }} />
        <span className="text-lg font-semibold">{domain.label}</span>
      </div>
      <div className="flex gap-6 text-center">
        <div>
          <span className="block text-2xl font-bold">{loading ? "…" : orgCount}</span>
          <span className="text-xs text-gray-500">Organizations</span>
        </div>
      </div>
    </div>
  );
}
