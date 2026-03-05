import { NextRequest, NextResponse } from 'next/server'
import { recordArticleVote, getArticleVotes } from '@/lib/data/library'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentId, vote, sessionId } = body

    if (!documentId || !vote || !sessionId) {
      return NextResponse.json(
        { error: 'documentId, vote, and sessionId are required' },
        { status: 400 }
      )
    }

    if (vote !== 'helpful' && vote !== 'not_helpful') {
      return NextResponse.json(
        { error: 'vote must be "helpful" or "not_helpful"' },
        { status: 400 }
      )
    }

    const result = await recordArticleVote(documentId, vote, sessionId)
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
    }

    // Return updated counts
    const counts = await getArticleVotes(documentId)
    return NextResponse.json(counts)
  } catch (err) {
    console.error('Vote API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const counts = await getArticleVotes(documentId)
    return NextResponse.json(counts)
  } catch (err) {
    console.error('Vote API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
