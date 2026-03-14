/**
 * @fileoverview AI "Break It Down" endpoint.
 * Generates a plain-language breakdown of content or policy items using Claude.
 *
 * POST body: { title, summary, type: 'content' | 'policy' }
 * Returns: { breakdown: string } — markdown-formatted plain-language explanation
 */

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Basic abuse prevention — require same-origin requests
  const origin = req.headers.get('origin') || ''
  const referer = req.headers.get('referer') || ''
  if (!origin.includes('changeengine.us') && !referer.includes('changeengine.us') && !origin.includes('localhost')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  let body: { title?: string; summary?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, summary, type } = body
  if (!title || !type) {
    return NextResponse.json({ error: 'title and type are required' }, { status: 400 })
  }

  const isPolicy = type === 'policy'

  const systemPrompt = isPolicy
    ? `You are a civic educator helping Houston residents understand public policy. Write in plain English at a 6th-grade reading level. Be balanced, empowering, and concise. Use asset-based language — focus on what people can do, not what's wrong.`
    : `You are a community guide helping Houston residents understand local news and resources. Write in plain English at a 6th-grade reading level. Be warm, empowering, and concise. Use asset-based language — focus on strengths, opportunities, and what's available.`

  const userPrompt = isPolicy
    ? `Break down this policy for a community member:

Title: ${title}
${summary ? `Summary: ${summary}` : ''}

Respond with exactly 3 sections using these headers:
## What it does
(1-2 sentences explaining the policy simply)

## Who it affects
(1-2 sentences about who benefits or is impacted)

## Two perspectives
(One sentence for, one sentence against — both respectful)`
    : `Break down this story for a community member:

Title: ${title}
${summary ? `Summary: ${summary}` : ''}

Respond with exactly 3 sections using these headers:
## What it means
(1-2 sentences explaining the key point simply)

## Why it matters
(1-2 sentences on community impact)

## What you can do
(1-2 concrete, empowering next steps)`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic API error:', res.status, errText)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await res.json()
    const breakdown = data.content?.[0]?.text || ''

    return NextResponse.json({ breakdown })
  } catch (err) {
    console.error('Breakdown API error:', err)
    return NextResponse.json({ error: 'Failed to generate breakdown' }, { status: 500 })
  }
}
