/**
 * @fileoverview Client component for creating and editing partner guides.
 *
 * Provides a full guide form with title, auto-generated slug, description,
 * HTML content, theme/pathway selection, engagement level, hero image URL,
 * focus area multi-select, and a dynamic sections builder.
 *
 * Calls server actions from ./actions.ts on submit.
 */

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGuide, updateGuide, deleteGuide } from './actions'

const THEMES: Record<string, { name: string; color: string }> = {
  THEME_01: { name: 'Our Health', color: '#e53e3e' },
  THEME_02: { name: 'Our Families', color: '#dd6b20' },
  THEME_03: { name: 'Our Neighborhood', color: '#d69e2e' },
  THEME_04: { name: 'Our Voice', color: '#38a169' },
  THEME_05: { name: 'Our Money', color: '#3182ce' },
  THEME_06: { name: 'Our Planet', color: '#319795' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5' },
}

const ENGAGEMENT_LEVELS = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'education', label: 'Education' },
  { value: 'action', label: 'Action' },
  { value: 'advocacy', label: 'Advocacy' },
  { value: 'leadership', label: 'Leadership' },
]

interface FocusArea {
  focus_id: string
  focus_area_name: string
  theme_id: string | null
}

interface Section {
  title: string
  content: string
}

interface GuideData {
  guide_id: string
  title: string
  slug: string
  description: string | null
  content_html: string | null
  hero_image_url: string | null
  theme_id: string | null
  engagement_level: string | null
  sections: Section[] | null
  focus_area_ids: string[] | null
}

interface GuideFormClientProps {
  guide?: GuideData | null
  focusAreas: FocusArea[]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function GuideFormClient({ guide, focusAreas }: GuideFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!guide

  const [title, setTitle] = useState(guide?.title || '')
  const [slug, setSlug] = useState(guide?.slug || '')
  const [description, setDescription] = useState(guide?.description || '')
  const [contentHtml, setContentHtml] = useState(guide?.content_html || '')
  const [heroImageUrl, setHeroImageUrl] = useState(guide?.hero_image_url || '')
  const [themeId, setThemeId] = useState(guide?.theme_id || '')
  const [engagementLevel, setEngagementLevel] = useState(guide?.engagement_level || '')
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(guide?.focus_area_ids || [])
  const [sections, setSections] = useState<Section[]>(
    guide?.sections && Array.isArray(guide.sections) ? guide.sections : []
  )
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEditing) {
      setSlug(generateSlug(value))
    }
  }

  function addSection() {
    setSections([...sections, { title: '', content: '' }])
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index))
  }

  function updateSection(index: number, field: 'title' | 'content', value: string) {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  function toggleFocusArea(focusId: string) {
    setSelectedFocusAreas((prev) =>
      prev.includes(focusId)
        ? prev.filter((id) => id !== focusId)
        : [...prev, focusId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    const formData = new FormData()
    formData.set('title', title.trim())
    formData.set('slug', slug || generateSlug(title))
    formData.set('description', description.trim())
    formData.set('content_html', contentHtml)
    formData.set('hero_image_url', heroImageUrl.trim())
    formData.set('theme_id', themeId)
    formData.set('engagement_level', engagementLevel)
    formData.set('focus_area_ids', JSON.stringify(selectedFocusAreas))
    formData.set('sections', JSON.stringify(sections.filter((s) => s.title.trim() || s.content.trim())))

    startTransition(async () => {
      try {
        if (isEditing && guide) {
          const result = await updateGuide(guide.guide_id, formData)
          if (result?.error) {
            setError(result.error)
            return
          }
        } else {
          const result = await createGuide(formData)
          if (result?.error) {
            setError(result.error)
            return
          }
        }
        router.push('/dashboard/partner/guides')
        router.refresh()
      } catch {
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  async function handleDelete() {
    if (!guide) return
    startTransition(async () => {
      try {
        const result = await deleteGuide(guide.guide_id)
        if (result?.error) {
          setError(result.error)
          return
        }
        router.push('/dashboard/partner/guides')
        router.refresh()
      } catch {
        setError('Failed to delete guide.')
      }
    })
  }

  // Group focus areas by theme
  const focusAreasByTheme: Record<string, FocusArea[]> = {}
  focusAreas.forEach((fa) => {
    const key = fa.theme_id || 'other'
    if (!focusAreasByTheme[key]) focusAreasByTheme[key] = []
    focusAreasByTheme[key].push(fa)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-brand-text mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter guide title"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-brand-text mb-1">
          Slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto-generated-from-title"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-muted bg-brand-bg/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent font-mono text-sm"
        />
        <p className="text-xs text-brand-muted mt-1">Auto-generated from title. Edit only if needed.</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-brand-text mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this guide"
          rows={3}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
      </div>

      {/* Content HTML */}
      <div>
        <label htmlFor="content_html" className="block text-sm font-medium text-brand-text mb-1">
          Content (HTML)
        </label>
        <textarea
          id="content_html"
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          placeholder="<p>Guide content goes here...</p>"
          rows={8}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent font-mono text-sm"
        />
      </div>

      {/* Hero Image URL */}
      <div>
        <label htmlFor="hero_image_url" className="block text-sm font-medium text-brand-text mb-1">
          Hero Image URL
        </label>
        <input
          id="hero_image_url"
          type="url"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
        {heroImageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-brand-border w-48 h-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl}
              alt="Hero preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
      </div>

      {/* Theme / Pathway */}
      <div>
        <label htmlFor="theme_id" className="block text-sm font-medium text-brand-text mb-1">
          Pathway
        </label>
        <select
          id="theme_id"
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        >
          <option value="">Select a pathway</option>
          {Object.entries(THEMES).map(([id, theme]) => (
            <option key={id} value={id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      {/* Engagement Level */}
      <div>
        <label htmlFor="engagement_level" className="block text-sm font-medium text-brand-text mb-1">
          Engagement Level
        </label>
        <select
          id="engagement_level"
          value={engagementLevel}
          onChange={(e) => setEngagementLevel(e.target.value)}
          className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        >
          <option value="">Select engagement level</option>
          {ENGAGEMENT_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Focus Areas Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">
          Focus Areas
        </label>
        <div className="bg-white border border-brand-border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
          {Object.entries(focusAreasByTheme).map(([tId, areas]) => {
            const themeName = (THEMES as any)[tId]?.name || 'Other'
            return (
              <div key={tId}>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
                  {themeName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {areas.map((fa) => (
                    <button
                      key={fa.focus_id}
                      type="button"
                      onClick={() => toggleFocusArea(fa.focus_id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedFocusAreas.includes(fa.focus_id)
                          ? 'bg-brand-accent text-white border-brand-accent'
                          : 'bg-white text-brand-text border-brand-border hover:border-brand-accent'
                      }`}
                    >
                      {fa.focus_area_name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {focusAreas.length === 0 && (
            <p className="text-sm text-brand-muted">No focus areas available.</p>
          )}
        </div>
        {selectedFocusAreas.length > 0 && (
          <p className="text-xs text-brand-muted mt-1">
            {selectedFocusAreas.length} focus area{selectedFocusAreas.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Sections Builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-brand-text">
            Sections
          </label>
          <button
            type="button"
            onClick={addSection}
            className="text-sm text-brand-accent hover:underline"
          >
            + Add Section
          </button>
        </div>
        {sections.length === 0 ? (
          <p className="text-sm text-brand-muted bg-brand-bg/50 rounded-lg p-4 text-center">
            No sections yet. Sections let you organize your guide into parts.
          </p>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-brand-bg/30 border border-brand-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-muted uppercase">
                    Section {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="Section title"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent text-sm"
                />
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(index, 'content', e.target.value)}
                  placeholder="Section content"
                  rows={4}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-brand-border">
        <div>
          {isEditing && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-3 py-1.5 border border-brand-border rounded-lg hover:bg-brand-bg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete Guide
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/partner/guides')}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-bg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEditing
                ? 'Update Guide'
                : 'Create Guide'}
          </button>
        </div>
      </div>

      {isEditing && (
        <p className="text-xs text-brand-muted">
          Updating a guide will reset its review status to pending.
        </p>
      )}
    </form>
  )
}
