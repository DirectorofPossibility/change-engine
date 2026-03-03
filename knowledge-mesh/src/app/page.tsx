"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { domains } from "@/data/domains";
import { Organization } from "@/data/types";
import FlowerLogo from "@/components/FlowerLogo";
import StatsBar from "@/components/StatsBar";
import FocusAreaGrid from "@/components/FocusAreaGrid";
import OrgDetail from "@/components/OrgDetail";

export default function Home() {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDomain) {
      setOrganizations([]);
      setSelectedOrg(null);
      return;
    }
    setLoading(true);
    setSelectedOrg(null);
    supabase
      .from("organizations")
      .select("*")
      .eq("domain_id", activeDomain)
      .then(({ data, error }) => {
        if (error) {
          console.error("Supabase error:", error);
          setOrganizations([]);
        } else {
          setOrganizations((data as Organization[]) || []);
        }
        setLoading(false);
      });
  }, [activeDomain]);

  const activeDomainData = domains.find((d) => d.id === activeDomain) || null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Knowledge Mesh</h1>
          <span className="text-sm text-gray-500">AI Ecosystem Explorer</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
          <FlowerLogo activeDomain={activeDomain} onSelectDomain={(id) => setActiveDomain(id === activeDomain ? null : id)} />
          <StatsBar domain={activeDomainData} orgCount={organizations.length} loading={loading} />
        </div>
        {activeDomainData && (
          <p className="mx-auto mt-8 max-w-2xl text-center text-gray-400">{activeDomainData.description}</p>
        )}
        {activeDomain && (
          <div className="mt-10 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <FocusAreaGrid organizations={organizations} loading={loading} selectedOrg={selectedOrg} onSelectOrg={setSelectedOrg} accentColor={activeDomainData?.color || "#6366f1"} />
            </div>
            <div className="lg:col-span-3">
              <OrgDetail org={selectedOrg} />
            </div>
          </div>
        )}
        {!activeDomain && <p className="mt-16 text-center text-gray-600">Click a petal to explore a domain</p>}
      </div>
    </main>
  );
}
