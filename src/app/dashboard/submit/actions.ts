'use server'

import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { error: 'Server configuration missing (SUPABASE_URL or SERVICE_ROLE_KEY)' }
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    return { error: `Edge function ${name} failed (${res.status}): ${text}` }
  }
  return res.json()
}

export async function classifyUrlAction(url: string) {
  return callEdgeFunction('classify-content-v2', { url })
}

export async function csvUploadAction(
  rows: Array<{ url: string; title?: string; description?: string }>
) {
  return callEdgeFunction('csv-upload', { rows })
}

export async function uploadDocumentAction(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No file provided' }
  }

  const filename = file.name
  const ext = filename.split('.').pop()?.toLowerCase()
  let extractedText = ''

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (ext === 'txt') {
      extractedText = buffer.toString('utf-8')
    } else if (ext === 'pdf') {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const pdfData = await parser.getText()
      extractedText = pdfData.text
      await parser.destroy()
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return { error: `Unsupported file type: .${ext}` }
    }
  } catch (err: any) {
    return { error: `Failed to extract text: ${err.message}` }
  }

  if (!extractedText.trim()) {
    return { error: 'No text could be extracted from the document' }
  }

  // Truncate to a reasonable length for the classifier
  const description = extractedText.slice(0, 10000)

  return callEdgeFunction('classify-content-v2', {
    title: filename,
    description,
  })
}
