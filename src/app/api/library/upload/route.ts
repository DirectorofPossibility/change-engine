/**
 * @fileoverview Upload API for Knowledge Base documents.
 *
 * Accepts multipart form data with a PDF file, uploads to Supabase Storage,
 * and creates a kb_documents row with status 'pending'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // Generate storage path
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${timestamp}_${safeName}`

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from('kb-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Upload failed: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Parse user-provided tags
    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Create document record
    const { data: doc, error: insertError } = await supabase
      .from('kb_documents' as any)
      .insert({
        title: title || file.name.replace(/\.pdf$/i, ''),
        file_path: storagePath,
        file_size: file.size,
        status: 'pending',
        uploaded_by: user.id,
        tags,
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
      document_id: (doc as any).id,
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
