/**
 * Claude API wrappers and translation helper for the ingestion pipeline.
 */

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

export function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return JSON.parse(text.substring(start, end + 1))
}

export async function callClaude(system: string, user: string, maxTokens = 3000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (data.error) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(data.error.message || 'Claude API error')
      }
      return data.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries exceeded')
}

const TRANSLATE_SYSTEM = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.
Translate civic content simplified to a 5th/6th-grade reading level.
CRITICAL: Maintain reading level, keep proper nouns in original form, use Southern Vietnamese dialect for Vietnamese.
Respond with JSON only. No markdown, no backticks.`

export async function translateItem(
  title: string,
  summary: string,
  langCode: string,
  langName: string,
): Promise<{ title: string; summary: string }> {
  const raw = await callClaude(
    TRANSLATE_SYSTEM,
    `Translate to ${langName}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
    2000,
  )
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}
