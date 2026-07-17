"""Retrieval service: vector search, keyword search, hybrid search with RRF re-ranking."""

from __future__ import annotations
from typing import Any

from .embedding import EmbeddingProvider
from .schemas import ProjectMatch, SearchFilters
from .utils import get_logger, get_supabase_client, timer

logger = get_logger("retrieval")


class RetrievalService:
    """Handles semantic search, keyword search, and hybrid retrieval.

    Implements Reciprocal Rank Fusion (RRF) to combine vector similarity
    and full-text keyword relevance into a single ranked list.
    """

    # RRF constant (controls how much weight lower-ranked results get)
    RRF_K = 60

    def __init__(self, embedding_provider: EmbeddingProvider):
        self._embedder = embedding_provider
        self._supabase = get_supabase_client()

    def vector_search(
        self,
        query_embedding: list[float],
        filters: SearchFilters | None = None,
    ) -> list[dict[str, Any]]:
        """Perform cosine similarity search via the match_projects RPC function."""
        f = filters or SearchFilters()

        params: dict[str, Any] = {
            "query_embedding": query_embedding,
            "match_threshold": f.match_threshold,
            "match_count": f.match_count,
        }

        if f.category:
            params["filter_category"] = f.category
        if f.min_funding is not None:
            params["filter_min_funding"] = f.min_funding
        if f.max_funding is not None:
            params["filter_max_funding"] = f.max_funding
        if f.tech_stack:
            params["filter_tech"] = f.tech_stack

        with timer() as t:
            resp = self._supabase.rpc("match_projects", params).execute()

        results = resp.data or []
        logger.info(
            f"Vector search returned {len(results)} results",
            extra={"latency_ms": t["ms"], "match_count": len(results)},
        )
        return results

    def keyword_search(
        self,
        query: str,
        match_count: int = 10,
    ) -> list[dict[str, Any]]:
        """Perform full-text keyword search via the keyword_search_projects RPC."""
        try:
            with timer() as t:
                resp = self._supabase.rpc("keyword_search_projects", {
                    "search_query": query,
                    "match_count": match_count,
                }).execute()

            results = resp.data or []
            logger.info(
                f"Keyword search returned {len(results)} results",
                extra={"latency_ms": t["ms"], "match_count": len(results)},
            )
            return results
        except Exception as e:
            logger.warning(f"Keyword search failed: {e}. Falling back to empty search results.")
            return []

    def _reciprocal_rank_fusion(
        self,
        vector_results: list[dict],
        keyword_results: list[dict],
    ) -> list[dict]:
        """Combine vector and keyword results using Reciprocal Rank Fusion.

        RRF Score = Σ  1 / (k + rank_i)

        This gives higher weight to items that appear near the top of
        BOTH result lists, without requiring score normalization.
        """
        scores: dict[str, float] = {}
        result_map: dict[str, dict] = {}

        # Score vector results
        for rank, item in enumerate(vector_results):
            pid = str(item["project_id"])
            scores[pid] = scores.get(pid, 0.0) + 1.0 / (self.RRF_K + rank + 1)
            if pid not in result_map:
                result_map[pid] = item

        # Score keyword results
        for rank, item in enumerate(keyword_results):
            pid = str(item["project_id"])
            scores[pid] = scores.get(pid, 0.0) + 1.0 / (self.RRF_K + rank + 1)
            if pid not in result_map:
                # Keyword results may not have 'similarity', set a placeholder
                item["similarity"] = item.get("rank", 0.5)
                result_map[pid] = item

        # Sort by combined RRF score descending
        sorted_pids = sorted(scores.keys(), key=lambda pid: scores[pid], reverse=True)

        fused = []
        for pid in sorted_pids:
            entry = result_map[pid]
            entry["rrf_score"] = round(scores[pid], 6)
            fused.append(entry)

        return fused

    def enrich_results(self, matches: list[dict]) -> list[ProjectMatch]:
        """Join raw search results with the projects table for full metadata."""
        if not matches:
            return []

        project_ids = [str(m["project_id"]) for m in matches]

        try:
            with timer() as t:
                resp = (
                    self._supabase.table("projects")
                    .select(
                        "id, title, tagline, category, tech_stack, "
                        "funding_goal, founder_name, status"
                    )
                    .in_("id", project_ids)
                    .execute()
                )

            project_map = {str(p["id"]): p for p in (resp.data or [])}
            logger.info(
                f"Enriched {len(project_map)} projects",
                extra={"latency_ms": t["ms"]},
            )
        except Exception as e:
            logger.error(f"Enrichment query failed: {e}")
            project_map = {}

        enriched: list[ProjectMatch] = []
        for match in matches:
            pid = str(match["project_id"])
            proj = project_map.get(pid, {})

            tech = proj.get("tech_stack") or []
            if isinstance(tech, str):
                tech = [t.strip() for t in tech.replace("{", "").replace("}", "").split(",") if t.strip()]

            enriched.append(ProjectMatch(
                project_id=pid,
                title=proj.get("title", ""),
                tagline=proj.get("tagline", ""),
                category=proj.get("category", ""),
                tech_stack=tech,
                funding_goal=float(proj.get("funding_goal") or 0),
                founder_name=proj.get("founder_name", ""),
                similarity=round(float(match.get("similarity", 0)), 4),
                content=match.get("content", ""),
            ))

        return enriched

    def search(
        self,
        query: str,
        filters: SearchFilters | None = None,
    ) -> list[ProjectMatch]:
        """Full hybrid search pipeline:
        1. Generate query embedding
        2. Run vector search (semantic)
        3. Run keyword search (lexical)
        4. Fuse results with RRF
        5. Enrich with full project data
        """
        f = filters or SearchFilters()

        # 1. Generate query embedding
        with timer() as t_embed:
            query_embedding = self._embedder.embed_text(query)

        logger.info("Query embedding generated", extra={"latency_ms": t_embed["ms"]})

        # 2. Vector search
        vector_results = self.vector_search(query_embedding, f)

        # 3. Keyword search
        keyword_results = self.keyword_search(query, f.match_count)

        # 4. Reciprocal Rank Fusion
        fused = self._reciprocal_rank_fusion(vector_results, keyword_results)

        # Trim to requested count
        fused = fused[: f.match_count]

        # 5. Enrich with project metadata
        enriched = self.enrich_results(fused)

        logger.info(
            f"Hybrid search complete: {len(enriched)} results",
            extra={"query": query[:100], "match_count": len(enriched)},
        )

        return enriched
