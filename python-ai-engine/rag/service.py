"""RAG Service: orchestrates the full ingest → retrieve → generate pipeline."""

from __future__ import annotations
import time

from .embedding import EmbeddingProvider, GeminiEmbeddingProvider
from .ingestion import IngestionService
from .retrieval import RetrievalService
from .prompts import build_search_prompt, INVESTOR_SEARCH_SYSTEM
from .schemas import (
    IngestResponse,
    SearchRequest,
    SearchResponse,
    ReindexResponse,
    HealthResponse,
)
from .utils import get_logger, get_supabase_client, timer

logger = get_logger("service")


class RAGService:
    """Top-level orchestrator for the RAG pipeline.

    Coordinates:
        - Ingestion (embed + store)
        - Retrieval (hybrid search + RRF)
        - Generation (Gemini RAG answer)

    Usage:
        service = RAGService()
        result = service.search(SearchRequest(query="AI healthcare startups"))
    """

    def __init__(self, embedding_provider: EmbeddingProvider | None = None):
        self._embedder = embedding_provider or GeminiEmbeddingProvider()
        self._ingestion = IngestionService(self._embedder)
        self._retrieval = RetrievalService(self._embedder)
        self._supabase = get_supabase_client()

    # ─── Search (full RAG pipeline) ──────────────────────────────────────

    def search(self, request: SearchRequest) -> SearchResponse:
        """Execute the complete RAG pipeline:
        1. Hybrid retrieval (vector + keyword + metadata filters)
        2. Build context-aware prompt
        3. Generate analysis via Gemini
        4. Return structured response
        """
        start_time = time.perf_counter()

        logger.info(f"RAG search started", extra={"query": request.query[:100]})

        # 1. Retrieve matching projects
        with timer() as t_retrieval:
            matches = self._retrieval.search(request.query, request.filters)

        logger.info(
            f"Retrieval complete: {len(matches)} matches",
            extra={"latency_ms": t_retrieval["ms"]},
        )

        # 2. Build RAG prompt
        prompt = build_search_prompt(request.query, matches)

        # 3. Generate answer via Gemini
        with timer() as t_generation:
            answer = self._call_gemini(prompt)

        logger.info(
            "Gemini generation complete",
            extra={"latency_ms": t_generation["ms"]},
        )

        total_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return SearchResponse(
            answer=answer,
            matched_projects=matches,
            total_matches=len(matches),
            latency_ms=total_ms,
            query=request.query,
        )

    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini for RAG generation using the existing multi-model fallback.

        Reuses the same call_gemini_rest pattern from main.py but with
        the system prompt prepended for role-based instruction.
        """
        import os
        import requests as http_requests
        import json
        import re

        api_key = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("Gemini API key not found")
            return "⚠️ AI analysis unavailable — Gemini API key not configured."

        # Prepend system instructions to the prompt
        full_prompt = f"{INVESTOR_SEARCH_SYSTEM}\n\n{prompt}"

        models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]

        for model in models:
            try:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model}:generateContent?key={api_key}"
                )
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,  # Low temp for factual analysis
                        "maxOutputTokens": 4096,
                    },
                }
                resp = http_requests.post(url, json=payload, timeout=60)

                if resp.status_code == 429:
                    logger.warning(f"Rate limited on {model}, trying next model")
                    continue

                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]

                logger.info(f"Gemini response from {model}", extra={"provider": model})
                return text

            except Exception as e:
                logger.warning(f"Gemini {model} failed: {e}")
                continue

        return "⚠️ AI analysis temporarily unavailable. Please try again in a moment."

    # ─── Ingestion ────────────────────────────────────────────────────────

    def ingest(self, project_id: str) -> IngestResponse:
        """Ingest a single project into the vector store."""
        ok = self._ingestion.ingest_project(project_id)
        return IngestResponse(
            success=ok,
            project_id=project_id,
            message="Project indexed successfully" if ok else "Ingestion failed",
        )

    def delete(self, project_id: str) -> bool:
        """Remove a project's embedding from the vector store."""
        return self._ingestion.delete_project(project_id)

    def reindex(self) -> ReindexResponse:
        """Reindex all published projects."""
        success, failed = self._ingestion.reindex_all()
        return ReindexResponse(
            success=failed == 0,
            total_indexed=success,
            failed=failed,
            message=f"Reindexed {success} projects ({failed} failures)",
        )

    # ─── Health ───────────────────────────────────────────────────────────

    def health(self) -> HealthResponse:
        """Check RAG subsystem health."""
        db_ok = False
        vector_count = 0

        try:
            resp = (
                self._supabase.table("project_embeddings")
                .select("id", count="exact")
                .execute()
            )
            vector_count = resp.count or 0
            db_ok = True
        except Exception as e:
            logger.error(f"Health check DB error: {e}")

        return HealthResponse(
            status="healthy" if db_ok else "degraded",
            embedding_provider=self._embedder.model_name,
            vector_count=vector_count,
            db_connected=db_ok,
        )
