-- =============================================================================
-- RAG Pipeline: pgvector Infrastructure for Smart Deal Flow
-- Vichaar-Setu | Migration: 20260716_rag_pgvector
-- =============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Embeddings table (one embedding per project, UNIQUE constraint prevents duplicates)
CREATE TABLE IF NOT EXISTS public.project_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HNSW index for fast approximate nearest neighbor search (cosine similarity)
CREATE INDEX IF NOT EXISTS idx_project_embeddings_vector
ON public.project_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- 4. GIN index on metadata for JSONB filtering
CREATE INDEX IF NOT EXISTS idx_project_embeddings_metadata
ON public.project_embeddings USING gin (metadata jsonb_path_ops);

-- 5. GIN index on tsvector for full-text keyword search
CREATE INDEX IF NOT EXISTS idx_project_embeddings_fts
ON public.project_embeddings USING gin (search_vector);

-- 6. RPC function: Vector similarity search with metadata filtering
CREATE OR REPLACE FUNCTION match_projects(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL,
    filter_min_funding DECIMAL DEFAULT NULL,
    filter_max_funding DECIMAL DEFAULT NULL,
    filter_tech TEXT DEFAULT NULL
)
RETURNS TABLE (
    project_id UUID,
    similarity FLOAT,
    content TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.project_id,
        (1 - (pe.embedding <=> query_embedding))::FLOAT AS similarity,
        pe.content,
        pe.metadata
    FROM public.project_embeddings pe
    WHERE
        pe.embedding IS NOT NULL
        AND (1 - (pe.embedding <=> query_embedding)) >= match_threshold
        AND (filter_category IS NULL OR pe.metadata->>'category' ILIKE '%' || filter_category || '%')
        AND (filter_min_funding IS NULL OR (pe.metadata->>'funding_goal')::decimal >= filter_min_funding)
        AND (filter_max_funding IS NULL OR (pe.metadata->>'funding_goal')::decimal <= filter_max_funding)
        AND (filter_tech IS NULL OR pe.metadata->'tech_stack' @> to_jsonb(filter_tech)::jsonb)
    ORDER BY pe.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 7. RPC function: Full-text keyword search
CREATE OR REPLACE FUNCTION keyword_search_projects(
    search_query TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    project_id UUID,
    rank FLOAT,
    content TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.project_id,
        ts_rank_cd(pe.search_vector, websearch_to_tsquery('english', search_query))::FLOAT AS rank,
        pe.content,
        pe.metadata
    FROM public.project_embeddings pe
    WHERE pe.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;

-- 8. Row Level Security (permissive — consistent with existing Vichaar-Setu pattern)
ALTER TABLE public.project_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on project_embeddings"
ON public.project_embeddings FOR SELECT USING (true);

CREATE POLICY "Allow insert on project_embeddings"
ON public.project_embeddings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on project_embeddings"
ON public.project_embeddings FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on project_embeddings"
ON public.project_embeddings FOR DELETE USING (true);

-- 9. Auto-update timestamp trigger
CREATE TRIGGER update_project_embeddings_updated_at
    BEFORE UPDATE ON public.project_embeddings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
