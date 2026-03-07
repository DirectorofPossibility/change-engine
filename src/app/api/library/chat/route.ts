/**
 * @fileoverview "Chance" chatbot API — multi-source RAG with streaming.
 *
 * Searches across ALL Change Engine data sources (KB docs, services,
 * organizations, published content, elected officials) and streams
 * responses using the Anthropic streaming API with SSE format.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { multiSourceSearch, getDocumentById } from '@/lib/data/library'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Source type labels and link builders ──

const SOURCE_TYPE_LABELS: Record<string, string> = {
  kb_document: 'Research Library',
  service: 'Community Service',
  organization: 'Organization',
  content: 'Published Content',
  official: 'Elected Official',
  policy: 'Policy / Legislation',
  opportunity: 'Opportunity',
  agency: 'Government Agency',
  foundation: 'Foundation',
  guide: 'Guide',
}

function buildSourceLink(sourceType: string, sourceId: string, metadata: Record<string, unknown>): string {
  switch (sourceType) {
    case 'kb_document': return `/library/doc/${sourceId}`
    case 'service': return `/services/${sourceId}`
    case 'organization': return `/organizations/${sourceId}`
    case 'content': return (metadata.source_url as string) || `/content/${sourceId}`
    case 'official': return `/officials/${sourceId}`
    case 'policy': return `/policies/${sourceId}`
    case 'opportunity': return `/opportunities/${sourceId}`
    case 'agency': return `/agencies/${sourceId}`
    case 'foundation': return `/foundations/${sourceId}`
    case 'guide': return `/guides/${(metadata.slug as string) || sourceId}`
    default: return '#'
  }
}

// ── System prompt for Chance ──

const CHANCE_SYSTEM_PROMPT = `You are Chance, a friendly neighborhood guide for The Change Engine in Houston, Texas.

Your personality:
- Warm, encouraging, and genuine — like a helpful neighbor who knows the community well
- You use asset-based language — focus on strengths, opportunities, and what's available
- Write at a 6th-grade reading level so everyone can understand
- You're honest — if you're not sure about something, say so and suggest where to look
- You care about connecting people with the right resources, not just answering questions

Guidelines:
- Always base your answers on the provided source context
- Cite sources using [Source N] format when referencing specific information
- If the sources don't contain relevant info, say so honestly and suggest other ways to find help
- Keep answers concise but thorough — usually 2-4 paragraphs
- If someone writes in Spanish or Vietnamese, respond in their language
- For urgent needs (safety, food, shelter), always mention 211 (dial 2-1-1) as a starting point
- Never make up information — only share what's in your sources`

export async function POST(req: NextRequest) {
  try {
    // Auth check — allow anonymous users but check account status for logged-in users
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('account_status')
        .eq('auth_id', user.id)
        .single()

      const acctStatus = (profileRow as any)?.account_status
      if (acctStatus === 'read_only' || acctStatus === 'locked') {
        return new Response(JSON.stringify({ error: 'Your account does not have chat permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const body = await req.json()
    const { message, session_id, stream = true, doc_id } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get or create session
    let sessionId = session_id
    if (!sessionId && user) {
      try {
        const sessions = await supaRest('POST', 'kb_chat_sessions', {
          user_id: user.id,
          title: message.slice(0, 100),
        })
        sessionId = sessions?.[0]?.id
      } catch { /* anonymous users skip session creation */ }
    }

    // Get conversation history
    let conversationHistory: { role: string; content: string }[] = []
    if (session_id) {
      const messages = await supaRest(
        'GET',
        `kb_chat_messages?session_id=eq.${session_id}&order=created_at.asc&limit=20&select=role,content`
      )
      conversationHistory = messages ?? []
    }

    // If a specific document ID is provided, fetch it directly
    let docContext = ''
    if (doc_id && typeof doc_id === 'string') {
      const doc = await getDocumentById(doc_id)
      if (doc) {
        const chunksText = doc.chunks?.map((c: any) => c.content).join('\n\n') || ''
        docContext = `[Primary Document — Research Library: "${doc.title}"]\n` +
          `Summary: ${doc.summary || ''}\n\n` +
          chunksText.slice(0, 6000)
      }
    }

    // Multi-source search for additional context
    const searchResults = await multiSourceSearch(message, docContext ? 8 : 15)

    // Build context from all source types
    const searchContext = searchResults.map(function (result, i) {
      const typeLabel = SOURCE_TYPE_LABELS[result.source_type] || result.source_type
      return `[Source ${i + 1} — ${typeLabel}: "${result.title}"]\n${result.content.slice(0, 1500)}`
    }).join('\n\n---\n\n')

    const context = docContext
      ? docContext + '\n\n---\n\n' + searchContext
      : searchContext

    // Build full system prompt with context
    const systemWithContext = CHANCE_SYSTEM_PROMPT + '\n\n' +
      (context
        ? 'CONTEXT FROM CHANGE ENGINE DATA SOURCES:\n\n' + context
        : 'No relevant information found in the Change Engine database for this query. Let the user know honestly and suggest they try different search terms or call 211.')

    const claudeMessages = [
      ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    // Build sources array for the response
    const sources = searchResults.map(function (result) {
      return {
        source_type: result.source_type,
        source_id: result.source_id,
        title: result.title,
        link: buildSourceLink(result.source_type, result.source_id, result.metadata),
        score: result.score,
        metadata: result.metadata,
      }
    })

    if (!stream) {
      // Non-streaming fallback
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemWithContext,
          messages: claudeMessages,
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      const assistantMessage = data.content?.[0]?.text || 'I was unable to generate a response.'

      // Save messages
      if (sessionId) {
        await supaRest('POST', 'kb_chat_messages', [
          { session_id: sessionId, role: 'user', content: message, sources: [] },
          { session_id: sessionId, role: 'assistant', content: assistantMessage, sources },
        ])
      }

      return new Response(JSON.stringify({ message: assistantMessage, sources, session_id: sessionId }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Streaming response ──
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        stream: true,
        system: systemWithContext,
        messages: claudeMessages,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!anthropicRes.ok || !anthropicRes.body) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic streaming error: ${anthropicRes.status} ${errText}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        // Send session_id first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session', session_id: sessionId })}\n\n`))

        const reader = anthropicRes.body!.getReader()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (jsonStr === '[DONE]') continue

              try {
                const event = JSON.parse(jsonStr)

                if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                  const text = event.delta.text
                  fullText += text
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'text_delta', text })}\n\n`
                  ))
                }
              } catch { /* skip malformed events */ }
            }
          }

          // Send sources at the end
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
          ))

          // Send done signal
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          ))

          // Save messages to session (async, don't block stream)
          if (sessionId && fullText) {
            supaRest('POST', 'kb_chat_messages', [
              { session_id: sessionId, role: 'user', content: message, sources: [] },
              { session_id: sessionId, role: 'assistant', content: fullText, sources },
            ]).catch(err => console.error('Failed to save chat messages:', err))
          }
        } catch (err) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`
          ))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Library chat error:', err)
    return new Response(
      JSON.stringify({ error: 'Chat failed: ' + (err instanceof Error ? err.message : 'Unknown error') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
