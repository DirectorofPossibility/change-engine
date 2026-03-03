interface GuideSection { id: string; title: string; content: string; icon?: string }

export function TableOfContents({ sections }: { sections: GuideSection[] }) {
  if (sections.length < 3) return null
  return (
    <nav className="bg-white rounded-xl border border-brand-border p-4 mb-6">
      <h3 className="font-serif text-sm font-semibold text-brand-text mb-2">In this guide</h3>
      <ol className="space-y-1.5 list-decimal list-inside">
        {sections.map(s => (
          <li key={s.id}>
            <a href={'#section-' + s.id} className="text-sm text-brand-accent hover:underline">{s.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
