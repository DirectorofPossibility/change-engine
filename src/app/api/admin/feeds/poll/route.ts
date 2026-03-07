import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { feed_id } = await request.json()
  if (!feed_id) return NextResponse.json({ error: 'Missing feed_id' }, { status: 400 })

  const supabase = await createClient()

  // Get feed details
  const { data: feed } = await (supabase as any)
    .from('rss_feeds')
    .select('*')
    .eq('id', feed_id)
    .single()

  if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 })

  try {
    // Call the intake API to trigger RSS polling for this specific feed
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'rss_feed',
        feed_url: feed.feed_url,
        feed_name: feed.feed_name,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      // Update error count
      await (supabase as any)
        .from('rss_feeds')
        .update({
          error_count: (feed.error_count || 0) + 1,
          last_error: errText.slice(0, 500),
        })
        .eq('id', feed_id)
      return NextResponse.json({ message: 'Poll failed: ' + errText.slice(0, 200) }, { status: 500 })
    }

    const result = await res.json()

    // Update last_polled and reset error count
    await (supabase as any)
      .from('rss_feeds')
      .update({
        last_polled: new Date().toISOString(),
        error_count: 0,
        last_error: null,
        last_item_count: result.items_found || 0,
      })
      .eq('id', feed_id)

    return NextResponse.json({
      message: `Polled ${feed.feed_name}: ${result.items_found || 0} items found, ${result.items_new || 0} new`,
      items_found: result.items_found || 0,
      items_new: result.items_new || 0,
    })
  } catch (err: any) {
    await (supabase as any)
      .from('rss_feeds')
      .update({
        error_count: (feed.error_count || 0) + 1,
        last_error: err.message?.slice(0, 500) || 'Unknown error',
      })
      .eq('id', feed_id)

    return NextResponse.json({ message: 'Poll error: ' + (err.message || 'Unknown') }, { status: 500 })
  }
}
