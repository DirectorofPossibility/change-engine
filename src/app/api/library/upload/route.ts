/**
 * @fileoverview Upload API for Knowledge Base documents.
 *
 * Creates a kb_documents row with status 'pending'. The actual PDF is
 * uploaded directly to Supabase Storage from the client to avoid
 * Vercel's 4.5MB serverless body size limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check account status
    const { data: profileRow } = await supabase
      .from('user_profiles')
      .select('account_status')
      .eq('auth_id', user.id)
      .single()

    const acctStatus = (profileRow as any)?.account_status
    if (acctStatus === 'read_only' || acctStatus === 'locked') {
      return NextResponse.json({ error: 'Your account does not have upload permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { storagePath, fileName, fileSize, title, tags } = body as {
      storagePath: string
      fileName: string
      fileSize: number
      title?: string
      tags?: string
    }

    if (!storagePath || !fileName) {
      return NextResponse.json({ error: 'storagePath and fileName are required' }, { status: 400 })
    }

    // Verify the file actually exists in storage
    const { data: fileCheck } = await supabase.storage
      .from('kb-documents')
      .createSignedUrl(storagePath, 10)

    if (!fileCheck?.signedUrl) {
      return NextResponse.json({ error: 'File not found in storage. Upload the file first.' }, { status: 400 })
    }

    // Parse user-provided tags
    const parsedTags = (tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Create document record
    const { data: doc, error: insertError } = await supabase
      .from('kb_documents')
      .insert({
        title: title || fileName.replace(/\.pdf$/i, ''),
        file_path: storagePath,
        file_size: fileSize,
        status: 'pending',
        uploaded_by: user.id,
        tags: parsedTags,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create document record: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document_id: doc?.id,
      message: 'Document uploaded and pending review',
    })
  } catch (err) {
    console.error('Library upload error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
