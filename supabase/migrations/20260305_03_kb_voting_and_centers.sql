-- Add center_id column to kb_documents for grouping articles by center within a pathway
ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS center_id TEXT;

-- Create voting table for "Was this helpful?" feature
CREATE TABLE IF NOT EXISTS kb_article_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (document_id, session_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kb_article_votes_document ON kb_article_votes(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_center ON kb_documents(center_id);

-- RLS: public read, anyone can insert (anonymous voting)
ALTER TABLE kb_article_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read votes" ON kb_article_votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can vote" ON kb_article_votes
  FOR INSERT WITH CHECK (true);
