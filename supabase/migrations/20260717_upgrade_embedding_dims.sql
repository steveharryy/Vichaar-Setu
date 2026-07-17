-- =============================================================================
-- RAG Pipeline: Fix for gemini-embedding-001 (768 dims via outputDimensionality)
-- Vichaar-Setu | Migration: 20260717_fix_rag_functions
-- =============================================================================

-- 1. Clear old embeddings (generated with wrong model, incompatible)
DELETE FROM public.project_embeddings;

-- 2. Recreate match_projects RPC (keeps vector(768), same as original)
DROP FUNCTION IF EXISTS match_projects;

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
        (1 - (pe.embedding <=> match_projects.query_embedding))::FLOAT AS similarity,
        pe.content,
        pe.metadata
    FROM public.project_embeddings pe
    WHERE
        pe.embedding IS NOT NULL
        AND (1 - (pe.embedding <=> match_projects.query_embedding)) >= match_threshold
        AND (filter_category IS NULL OR pe.metadata->>'category' ILIKE '%' || filter_category || '%')
        AND (filter_min_funding IS NULL OR (pe.metadata->>'funding_goal')::decimal >= filter_min_funding)
        AND (filter_max_funding IS NULL OR (pe.metadata->>'funding_goal')::decimal <= filter_max_funding)
        AND (filter_tech IS NULL OR pe.metadata->'tech_stack' @> to_jsonb(filter_tech)::jsonb)
    ORDER BY pe.embedding <=> match_projects.query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 3. Recreate keyword_search_projects RPC
DROP FUNCTION IF EXISTS keyword_search_projects;

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
