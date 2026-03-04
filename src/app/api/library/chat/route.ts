/**
 * @fileoverview RAG chat API for the Knowledge Base.
 *
 * Accepts a user message and optional session_id, searches chunks for
 * relevant context, builds a Claude prompt, and returns the response
 * with source citations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchChunks } from '@/lib/data/library'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
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

export async function POST(req: NextRequest) {
  try {
    // Auth + account status check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: profileRow } = await supabase
      .from('user_profiles')
      .select('account_status')
      .eq('auth_id', user.id)
      .single()

    const acctStatus = (profileRow as any)?.account_status
    if (acctStatus === 'read_only' || acctStatus === 'locked') {
      return NextResponse.json({ error: 'Your account does not have chat permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { message, session_id } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create session
    let sessionId = session_id
    if (!sessionId) {
      const sessions = await supaRest('POST', 'kb_chat_sessions', {
        title: message.slice(0, 100),
      })
      sessionId = sessions?.[0]?.id
    }

    // Get conversation history for context
    let conversationHistory: { role: string; content: string }[] = []
    if (session_id) {
      const messages = await supaRest(
        'GET',
        `kb_chat_messages?session_id=eq.${session_id}&order=created_at.asc&limit=20&select=role,content`
      )
      conversationHistory = messages ?? []
    }

    // Search for relevant chunks
    const relevantChunks = await searchChunks(message, 10)

    // Build context from chunks
    const context = relevantChunks.map(function (chunk, i) {
      return `[Source ${i + 1}: "${chunk.document_title}" (page ${chunk.page_start ?? '?'})]\n${chunk.content}`
    }).join('\n\n---\n\n')

    // Build Claude messages
    const systemPrompt = `You are a knowledgeable research assistant for The Change Engine, a Houston civic platform.
You help community members explore documents from the community research library.
Use asset-based language — focus on strengths, opportunities, and community resources.
Write at a 6th-grade reading level when possible.

When answering:
- Base your answers on the provided source documents
- Cite sources using [Source N] format when referencing specific information
- If the sources don't contain relevant information, say so honestly
- Be helpful, warm, and encouraging
- Keep answers concise but thorough

${context ? 'CONTEXT FROM LIBRARY DOCUMENTS:\n\n' + context : 'No relevant documents found in the library for this query.'}`

    const claudeMessages = [
      ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    // Call Claude
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
        system: systemPrompt,
        messages: claudeMessages,
      }),
      signal: AbortSignal.timeout(30000),
    })

    const data = await res.json()
    if (data.error) {
      throw new Error(data.error.message || 'Claude API error')
    }

    const assistantMessage = data.content?.[0]?.text || 'I was unable to generate a response.'

    // Build sources array
    const sources = relevantChunks.map(function (chunk) {
      return {
        document_id: chunk.document_id,
        chunk_id: chunk.id,
        title: chunk.document_title || 'Untitled',
        page: chunk.page_start,
      }
    })

    // Save messages to session
    if (sessionId) {
      await supaRest('POST', 'kb_chat_messages', [
        {
          session_id: sessionId,
          role: 'user',
          content: message,
          sources: [],
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: assistantMessage,
          sources,
        },
      ])
    }

    return NextResponse.json({
      message: assistantMessage,
      sources,
      session_id: sessionId,
    })
  } catch (err) {
    console.error('Library chat error:', err)
    return NextResponse.json(
      { error: 'Chat failed: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
