"use client";

interface Props { children: React.ReactNode; }

export default function DetailPanel({ children }: Props) {
  return <aside className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">{children}</aside>;
}
