/**
 * @fileoverview Detect and extract video objects from org pages.
 *
 * Finds YouTube, Vimeo, and self-hosted videos in page HTML.
 * Each video becomes a content_published object linked to the parent org
 * with video_url set for embedding on the object page.
 *
 * Duration/format determines trail placement:
 *   - Short (< 5 min) → Learning stage, quick intro
 *   - Medium (5-20 min) → Resource stage, how-to
 *   - Long (20+ min) → Accountability stage, deep engagement
 */

// ── Video URL extraction ──────────────────────────────────────────────

export interface DetectedVideo {
  /** Embeddable URL for iframe src */
  embedUrl: string
  /** Original URL (for linking) */
  sourceUrl: string
  /** Platform: youtube | vimeo | self-hosted */
  platform: string
  /** Video title if extractable from page context */
  title: string | null
  /** Thumbnail URL if available */
  thumbnail: string | null
  /** Duration in seconds if extractable, null otherwise */
  durationSeconds: number | null
}

/**
 * Extract all embeddable videos from HTML.
 * Finds:
 *   - YouTube embeds (iframe src)
 *   - YouTube links (watch?v=, youtu.be/)
 *   - Vimeo embeds and links
 *   - Self-hosted video tags (<video src="...">)
 */
export function extractVideos(html: string, pageUrl: string): DetectedVideo[] {
  const videos: DetectedVideo[] = []
  const seen = new Set<string>()

  // 1. YouTube iframes
  const ytIframeRegex = /src="(https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})[^"]*)"/gi
  let match
  while ((match = ytIframeRegex.exec(html)) !== null) {
    const videoId = match[2]
    if (seen.has(videoId)) continue
    seen.add(videoId)
    videos.push({
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      platform: 'youtube',
      title: extractNearbyTitle(html, match.index),
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationSeconds: null,
    })
  }

  // 2. YouTube links (watch pages and short URLs)
  const ytLinkRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi
  while ((match = ytLinkRegex.exec(html)) !== null) {
    const videoId = match[1]
    if (seen.has(videoId)) continue
    seen.add(videoId)
    videos.push({
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      platform: 'youtube',
      title: extractNearbyTitle(html, match.index),
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationSeconds: null,
    })
  }

  // 3. Vimeo iframes
  const vimeoIframeRegex = /src="(https?:\/\/player\.vimeo\.com\/video\/(\d+)[^"]*)"/gi
  while ((match = vimeoIframeRegex.exec(html)) !== null) {
    const videoId = match[2]
    if (seen.has(`vimeo-${videoId}`)) continue
    seen.add(`vimeo-${videoId}`)
    videos.push({
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      sourceUrl: `https://vimeo.com/${videoId}`,
      platform: 'vimeo',
      title: extractNearbyTitle(html, match.index),
      thumbnail: null,
      durationSeconds: null,
    })
  }

  // 4. Vimeo links
  const vimeoLinkRegex = /https?:\/\/(?:www\.)?vimeo\.com\/(\d{6,})/gi
  while ((match = vimeoLinkRegex.exec(html)) !== null) {
    const videoId = match[1]
    if (seen.has(`vimeo-${videoId}`)) continue
    seen.add(`vimeo-${videoId}`)
    videos.push({
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      sourceUrl: `https://vimeo.com/${videoId}`,
      platform: 'vimeo',
      title: extractNearbyTitle(html, match.index),
      thumbnail: null,
      durationSeconds: null,
    })
  }

  // 5. HTML5 <video> tags
  const videoTagRegex = /<video[^>]*src="([^"]+\.(?:mp4|webm|ogg))"[^>]*>/gi
  while ((match = videoTagRegex.exec(html)) !== null) {
    let src = match[1]
    try {
      src = new URL(src, pageUrl).href
    } catch { continue }
    if (seen.has(src)) continue
    seen.add(src)
    videos.push({
      embedUrl: src,
      sourceUrl: src,
      platform: 'self-hosted',
      title: extractNearbyTitle(html, match.index),
      thumbnail: null,
      durationSeconds: null,
    })
  }

  // Also check <source> tags inside <video>
  const sourceTagRegex = /<source[^>]*src="([^"]+\.(?:mp4|webm|ogg))"[^>]*>/gi
  while ((match = sourceTagRegex.exec(html)) !== null) {
    let src = match[1]
    try {
      src = new URL(src, pageUrl).href
    } catch { continue }
    if (seen.has(src)) continue
    seen.add(src)
    videos.push({
      embedUrl: src,
      sourceUrl: src,
      platform: 'self-hosted',
      title: extractNearbyTitle(html, match.index),
      thumbnail: null,
      durationSeconds: null,
    })
  }

  return videos
}

/**
 * Try to extract a nearby heading or title for a video.
 * Looks backwards in the HTML for the nearest h1-h4, aria-label, or title attribute.
 */
function extractNearbyTitle(html: string, position: number): string | null {
  // Look at the 500 chars before the video for a heading
  const before = html.substring(Math.max(0, position - 500), position)

  // Check for title= or aria-label= attribute on the iframe/video itself
  const after = html.substring(position, position + 300)
  const titleAttr = after.match(/title="([^"]+)"/i)?.[1]
  if (titleAttr && titleAttr.length > 3 && !titleAttr.toLowerCase().includes('youtube')) {
    return titleAttr
  }

  // Look for nearest heading before the video
  const headings = Array.from(before.matchAll(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/gi))
  if (headings.length > 0) {
    const last = headings[headings.length - 1][1].trim()
    if (last.length > 3 && last.length < 200) return last
  }

  return null
}

/**
 * Estimate center/stage based on video duration.
 */
export function videoDurationToCenter(durationSeconds: number | null): string {
  if (!durationSeconds) return 'Learning'  // Default for unknown duration
  if (durationSeconds < 300) return 'Learning'           // < 5 min → intro/explainer
  if (durationSeconds < 1200) return 'Resource'           // 5-20 min → how-to/guide
  return 'Accountability'                                 // 20+ min → deep dive/town hall
}

/**
 * Estimate time_commitment_id based on video duration.
 */
export function videoDurationToTimeCommitment(durationSeconds: number | null): string | null {
  if (!durationSeconds) return null
  if (durationSeconds < 300) return 'TIME_QUICK'         // < 5 min
  if (durationSeconds < 900) return 'TIME_SHORT'         // 5-15 min
  if (durationSeconds < 1800) return 'TIME_MEDIUM'       // 15-30 min
  if (durationSeconds < 3600) return 'TIME_LONG'         // 30-60 min
  return 'TIME_EXTENDED'                                  // 60+ min
}
