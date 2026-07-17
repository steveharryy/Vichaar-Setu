"""RAG Pipeline for Smart Deal Flow & Investor Matchmaker."""

from .schemas import (
    IngestRequest, IngestResponse,
    SearchRequest, SearchResponse, SearchFilters,
    ProjectMatch, ReindexResponse, HealthResponse,
)
from .service import RAGService
from .embedding import EmbeddingProvider, GeminiEmbeddingProvider

__all__ = [
    "RAGService",
    "EmbeddingProvider",
    "GeminiEmbeddingProvider",
    "IngestRequest",
    "IngestResponse",
    "SearchRequest",
    "SearchResponse",
    "SearchFilters",
    "ProjectMatch",
    "ReindexResponse",
    "HealthResponse",
]
