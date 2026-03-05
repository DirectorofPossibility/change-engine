/**
 * @fileoverview OpenAI embedding generation for semantic search.
 *
 * Uses text-embedding-3-small (1536 dimensions) for generating vector
 * embeddings of KB document chunks and search queries.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const MAX_BATCH_SIZE = 100

/** Generate a single embedding vector. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [result] = await generateEmbeddings([text])
  return result
}

/** Generate embeddings for multiple texts in batches. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (texts.length === 0) return []

  const results: number[][] = []

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE)
    // Truncate each text to ~8000 tokens (~32000 chars) to stay within model limits
    const truncated = batch.map(t => t.slice(0, 32000))

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncated,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI embeddings API error: ${res.status} ${errText}`)
    }

    const data = await res.json()
    const sorted = data.data.sort((a: any, b: any) => a.index - b.index)
    results.push(...sorted.map((d: any) => d.embedding))
  }

  return results
}
