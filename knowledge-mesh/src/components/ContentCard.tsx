"use client";

interface Props { title: string; children: React.ReactNode; }

export default function ContentCard({ title, children }: Props) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </div>
  );
}
