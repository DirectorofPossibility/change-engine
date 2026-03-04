-- Knowledge Base / Research Library
-- Tables for document storage, chunking, and chat

-- ── kb_documents ──
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT DEFAULT '',
  key_points TEXT[] DEFAULT '{}',
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'published', 'rejected')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  theme_ids TEXT[] DEFAULT '{}',
  focus_area_ids TEXT[] DEFAULT '{}',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kb_documents_status ON kb_documents(status);
CREATE INDEX IF NOT EXISTS idx_kb_documents_search ON kb_documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_kb_documents_tags ON kb_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_documents_themes ON kb_documents USING GIN(theme_ids);
CREATE INDEX IF NOT EXISTS idx_kb_documents_created ON kb_documents(created_at DESC);

-- Auto-generate search vector from title + summary + key_points
CREATE OR REPLACE FUNCTION kb_documents_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_points, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_documents_search_update
  BEFORE INSERT OR UPDATE ON kb_documents
  FOR EACH ROW EXECUTE FUNCTION kb_documents_search_trigger();

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON kb_documents FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated insert" ON kb_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role full access" ON kb_documents USING (auth.jwt() ->> 'role' = 'service_role');

-- ── kb_chunks ──
CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  page_start INTEGER,
  page_end INTEGER,
  search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON kb_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_search ON kb_chunks USING GIN(search_vector);

CREATE OR REPLACE FUNCTION kb_chunks_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_chunks_search_update
  BEFORE INSERT OR UPDATE ON kb_chunks
  FOR EACH ROW EXECUTE FUNCTION kb_chunks_search_trigger();

ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read chunks" ON kb_chunks FOR SELECT USING (
  EXISTS (SELECT 1 FROM kb_documents WHERE kb_documents.id = kb_chunks.document_id AND kb_documents.status = 'published')
);
CREATE POLICY "Service role chunks" ON kb_chunks USING (auth.jwt() ->> 'role' = 'service_role');

-- ── kb_chat_sessions ──
CREATE TABLE IF NOT EXISTS kb_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_chat_sessions_user ON kb_chat_sessions(user_id);

ALTER TABLE kb_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read sessions" ON kb_chat_sessions FOR SELECT USING (
  user_id = auth.uid() OR user_id IS NULL
);
CREATE POLICY "Anyone insert sessions" ON kb_chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role sessions" ON kb_chat_sessions USING (auth.jwt() ->> 'role' = 'service_role');

-- ── kb_chat_messages ──
CREATE TABLE IF NOT EXISTS kb_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES kb_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_chat_messages_session ON kb_chat_messages(session_id);

ALTER TABLE kb_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read messages" ON kb_chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM kb_chat_sessions
    WHERE kb_chat_sessions.id = kb_chat_messages.session_id
    AND (kb_chat_sessions.user_id = auth.uid() OR kb_chat_sessions.user_id IS NULL)
  )
);
CREATE POLICY "Anyone insert messages" ON kb_chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role messages" ON kb_chat_messages USING (auth.jwt() ->> 'role' = 'service_role');

-- ── Storage bucket ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kb-documents', 'kb-documents', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated upload kb docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kb-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Service role read kb docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kb-documents');
