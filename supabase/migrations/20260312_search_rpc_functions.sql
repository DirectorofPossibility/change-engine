-- RPC functions for Chance chatbot search
-- hybrid_search: semantic + FTS on kb_chunks
-- multi_source_search: semantic on kb_chunks + FTS across 5 entity tables

-- Drop any existing overloads
DROP FUNCTION IF EXISTS hybrid_search(TEXT, vector, INT, FLOAT8, FLOAT8);
DROP FUNCTION IF EXISTS hybrid_search(TEXT, TEXT, INT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS hybrid_search(TEXT, TEXT, INT, FLOAT8, FLOAT8);
DROP FUNCTION IF EXISTS multi_source_search(TEXT, vector, INT);
DROP FUNCTION IF EXISTS multi_source_search(TEXT, TEXT, INT);

-- ============================================================
-- hybrid_search: semantic + FTS on kb_chunks
-- ============================================================
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding TEXT,
  match_count INT DEFAULT 10,
  fts_weight FLOAT DEFAULT 0.3,
  semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  fts_rank FLOAT,
  semantic_score FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_embedding vector(1536);
  v_tsquery tsquery;
BEGIN
  v_embedding := query_embedding::vector(1536);
  v_tsquery := plainto_tsquery('english', query_text);

  RETURN QUERY
  WITH semantic AS (
    SELECT
      c.id,
      c.document_id AS doc_id,
      c.content AS chunk_content,
      jsonb_build_object(
        'chunk_index', c.chunk_index,
        'page_start', c.page_start,
        'page_end', c.page_end
      ) AS chunk_meta,
      1 - (c.embedding <=> v_embedding) AS sem_score
    FROM kb_chunks c
    JOIN kb_documents d ON d.id = c.document_id
    WHERE d.status = 'published'
    ORDER BY c.embedding <=> v_embedding
    LIMIT match_count * 3
  ),
  fts AS (
    SELECT
      c.id,
      ts_rank_cd(c.search_vector, v_tsquery) AS rank
    FROM kb_chunks c
    JOIN kb_documents d ON d.id = c.document_id
    WHERE d.status = 'published'
      AND c.search_vector @@ v_tsquery
  ),
  combined AS (
    SELECT
      s.id,
      s.doc_id,
      s.chunk_content,
      s.chunk_meta,
      COALESCE(f.rank, 0)::FLOAT AS f_rank,
      s.sem_score::FLOAT,
      (semantic_weight * s.sem_score + fts_weight * COALESCE(f.rank, 0))::FLOAT AS c_score
    FROM semantic s
    LEFT JOIN fts f ON f.id = s.id
  )
  SELECT
    combined.id,
    combined.doc_id,
    combined.chunk_content,
    combined.chunk_meta,
    combined.f_rank,
    combined.sem_score,
    combined.c_score
  FROM combined
  ORDER BY combined.c_score DESC
  LIMIT match_count;
END;
$$;

-- ============================================================
-- multi_source_search: semantic on kb_chunks + FTS on entity tables
-- ============================================================
CREATE OR REPLACE FUNCTION multi_source_search(
  query_text TEXT,
  query_embedding TEXT,
  match_count INT DEFAULT 15
)
RETURNS TABLE (
  source_type TEXT,
  source_id TEXT,
  title TEXT,
  content TEXT,
  score FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_embedding vector(1536);
  v_tsquery tsquery;
  per_source INT;
BEGIN
  v_embedding := query_embedding::vector(1536);
  v_tsquery := plainto_tsquery('english', query_text);
  per_source := GREATEST(match_count / 3, 5);

  RETURN QUERY
  SELECT * FROM (
    (SELECT
      'kb_document'::TEXT AS source_type,
      d.id::TEXT AS source_id,
      d.title AS title,
      c.content AS content,
      (0.7 * (1 - (c.embedding <=> v_embedding)) + 0.3 * COALESCE(ts_rank_cd(c.search_vector, v_tsquery), 0))::FLOAT AS score,
      jsonb_build_object('page_start', c.page_start, 'chunk_id', c.id) AS metadata
    FROM kb_chunks c
    JOIN kb_documents d ON d.id = c.document_id
    WHERE d.status = 'published'
    ORDER BY c.embedding <=> v_embedding
    LIMIT per_source)

    UNION ALL

    (SELECT
      'content'::TEXT,
      cp.id::TEXT,
      cp.title_6th_grade,
      cp.summary_6th_grade,
      ts_rank_cd(cp.fts, v_tsquery)::FLOAT,
      jsonb_build_object('content_type', cp.content_type, 'pathway', cp.pathway_primary, 'source_url', cp.source_url)
    FROM content_published cp
    WHERE cp.is_active = true
      AND cp.fts @@ v_tsquery
    ORDER BY ts_rank_cd(cp.fts, v_tsquery) DESC
    LIMIT per_source)

    UNION ALL

    (SELECT
      'service'::TEXT,
      s.service_id::TEXT,
      s.service_name,
      COALESCE(s.description_5th_grade, s.service_name),
      ts_rank_cd(s.fts, v_tsquery)::FLOAT,
      jsonb_build_object('phone', s.phone, 'website', s.website, 'address', s.address)
    FROM services_211 s
    WHERE s.fts @@ v_tsquery
    ORDER BY ts_rank_cd(s.fts, v_tsquery) DESC
    LIMIT per_source)

    UNION ALL

    (SELECT
      'organization'::TEXT,
      o.org_id::TEXT,
      COALESCE(o.title_6th_grade, o.org_name),
      COALESCE(o.summary_6th_grade, o.description_5th_grade, o.mission_statement),
      ts_rank_cd(o.fts, v_tsquery)::FLOAT,
      jsonb_build_object('website', o.website, 'city', o.city)
    FROM organizations o
    WHERE o.fts @@ v_tsquery
    ORDER BY ts_rank_cd(o.fts, v_tsquery) DESC
    LIMIT per_source)

    UNION ALL

    (SELECT
      'official'::TEXT,
      eo.official_id::TEXT,
      eo.official_name,
      COALESCE(eo.description_5th_grade, eo.title || ' - ' || COALESCE(eo.party, '')),
      ts_rank_cd(eo.fts, v_tsquery)::FLOAT,
      jsonb_build_object('title', eo.title, 'party', eo.party, 'gov_level', eo.gov_level_id)
    FROM elected_officials eo
    WHERE eo.fts @@ v_tsquery
    ORDER BY ts_rank_cd(eo.fts, v_tsquery) DESC
    LIMIT per_source)

    UNION ALL

    (SELECT
      'policy'::TEXT,
      p.policy_id::TEXT,
      COALESCE(p.title_6th_grade, p.policy_name),
      COALESCE(p.summary_6th_grade, p.summary_5th_grade),
      ts_rank_cd(p.fts, v_tsquery)::FLOAT,
      jsonb_build_object('status', p.status, 'level', p.level, 'source_url', p.source_url)
    FROM policies p
    WHERE p.fts @@ v_tsquery
    ORDER BY ts_rank_cd(p.fts, v_tsquery) DESC
    LIMIT per_source)
  ) AS all_results
  ORDER BY all_results.score DESC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION hybrid_search TO anon, authenticated;
GRANT EXECUTE ON FUNCTION multi_source_search TO anon, authenticated;
