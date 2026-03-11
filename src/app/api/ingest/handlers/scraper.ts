/**
 * URL scraping, HTML stripping, metadata extraction, and link parsing.
 *
 * Includes SSRF protection via {@link validateUrl}.
 */

export function stripHtml(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|blockquote|section|article)[^>]*>/gi, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n\n')
  return text.trim()
}

export function extractMeta(html: string, pageUrl?: string): { title: string; description: string; image: string; domain: string } {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)?.[1]
  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1]
  let image = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i)?.[1]
    || ''
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]

  if (!image) {
    const skipPattern = /1x1|pixel|track|logo|icon|avatar|favicon|badge|spacer|spinner|button/i
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
    let imgMatch
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[0]
      const imgSrc = imgMatch[1]
      if (skipPattern.test(imgSrc) || skipPattern.test(src)) continue
      if (imgSrc.startsWith('data:') || imgSrc.endsWith('.svg')) continue
      const widthMatch = src.match(/width="(\d+)"/i)
      const heightMatch = src.match(/height="(\d+)"/i)
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue
      if (heightMatch && parseInt(heightMatch[1]) < 50) continue
      try {
        image = pageUrl ? new URL(imgSrc, pageUrl).href : imgSrc
        break
      } catch {
        continue
      }
    }
  }

  return {
    title: ogTitle || titleTag || '',
    description: ogDesc || '',
    image,
    domain: '',
  }
}

export function extractLinks(html: string, baseUrl: string): { external: Array<{url: string; anchor: string; domain: string}>; internal: Array<{url: string; anchor: string; slug: string}> } {
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi
  const external: Array<{url: string; anchor: string; domain: string}> = []
  const internal: Array<{url: string; anchor: string; slug: string}> = []
  const baseDomain = new URL(baseUrl).hostname

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const anchor = match[2].replace(/<[^>]+>/g, '').trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) continue

    try {
      const url = new URL(href, baseUrl)
      const domain = url.hostname
      if (domain === baseDomain || domain.endsWith('.' + baseDomain)) {
        const slug = url.pathname.replace(/\/$/, '').split('/').pop() || ''
        if (slug && anchor) internal.push({ url: url.href, anchor, slug })
      } else if (anchor && url.protocol.startsWith('http')) {
        external.push({ url: url.href, anchor, domain })
      }
    } catch { /* invalid URL, skip */ }
  }

  return { external, internal }
}

/**
 * Validate a URL for safety before fetching (SSRF protection).
 */
export function validateUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed')
  }
  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Internal/private URLs are not allowed')
  }
}

/**
 * Fetch a URL, extract its text content, metadata, and links.
 */
export async function scrapeUrl(url: string): Promise<{
  fullText: string
  meta: { title: string; description: string; image: string; domain: string }
  externalLinks: Array<{url: string; anchor: string; domain: string}>
  internalLinks: Array<{url: string; anchor: string; slug: string}>
  downloadLinks: Array<{url: string; anchor: string}>
}> {
  validateUrl(url)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ChangeEngine/1.0; +https://changeengine.us)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const html = await res.text()
  const meta = extractMeta(html, url)
  meta.domain = new URL(url).hostname

  const fullText = stripHtml(html)
  const { external, internal } = extractLinks(html, url)

  const downloadLinks = external
    .filter(l => /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|zip)$/i.test(l.url))
    .map(l => ({ url: l.url, anchor: l.anchor }))

  return { fullText, meta, externalLinks: external, internalLinks: internal, downloadLinks }
}
