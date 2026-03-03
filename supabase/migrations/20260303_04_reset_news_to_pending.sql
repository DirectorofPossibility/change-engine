/**
 * Reset all published content back to pending review.
 *
 * Context: content_published holds NEWS (articles, videos, research, reports,
 * DIY activities, courses) — these are newsfeed items that flow per-pathway,
 * NOT community resources. Resources are separate object types: services_211,
 * organizations, benefit_programs, etc.
 *
 * This migration:
 * 1. Deactivates all content_published rows (is_active = false)
 * 2. Resets corresponding content_review_queue entries to 'pending'
 *
 * Content data is preserved — nothing is deleted. Items will need to be
 * re-approved through the review queue once the front-end properly presents
 * them as newsfeed items per pathway/theme.
 */

-- Step 1: Deactivate all published content
UPDATE content_published
SET is_active = false,
    is_featured = false
WHERE is_active = true;

-- Step 2: Reset review queue entries for all published content back to pending
UPDATE content_review_queue
SET review_status = 'pending',
    reviewed_at = NULL,
    reviewed_by = NULL,
    reviewer_notes = 'Reset: news content requires re-review for newsfeed presentation'
WHERE inbox_id IN (
  SELECT inbox_id FROM content_published WHERE inbox_id IS NOT NULL
)
AND review_status IN ('approved', 'auto_approved');
