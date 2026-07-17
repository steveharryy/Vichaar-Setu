"""Pydantic schemas for the RAG pipeline."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


# ─── Ingestion ────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    """Request to ingest (embed + index) a single project."""
    project_id: str = Field(..., description="UUID of the project to ingest")


class IngestResponse(BaseModel):
    """Response after ingesting a project."""
    success: bool
    project_id: str
    message: str = ""


# ─── Search ───────────────────────────────────────────────────────────────────

class SearchFilters(BaseModel):
    """Optional filters to narrow semantic search results."""
    category: Optional[str] = Field(None, description="Filter by startup category")
    min_funding: Optional[float] = Field(None, description="Minimum funding goal (USD)")
    max_funding: Optional[float] = Field(None, description="Maximum funding goal (USD)")
    tech_stack: Optional[str] = Field(None, description="Required technology in stack")
    match_threshold: float = Field(0.3, ge=0.0, le=1.0, description="Minimum cosine similarity")
    match_count: int = Field(10, ge=1, le=50, description="Max results to return")


class SearchRequest(BaseModel):
    """Investor natural-language search query with optional filters."""
    query: str = Field(..., min_length=3, max_length=2000, description="Natural language search query")
    filters: Optional[SearchFilters] = None


class ProjectMatch(BaseModel):
    """A single project result from the RAG search."""
    project_id: str
    title: str = ""
    tagline: str = ""
    category: str = ""
    tech_stack: list[str] = []
    funding_goal: float = 0
    founder_name: str = ""
    similarity: float = 0.0
    content: str = ""


class SearchResponse(BaseModel):
    """Full RAG search response with AI-generated answer and matched projects."""
    answer: str = Field("", description="AI-generated investment analysis (Markdown)")
    matched_projects: list[ProjectMatch] = []
    total_matches: int = 0
    latency_ms: float = 0.0
    query: str = ""


# ─── Reindex ──────────────────────────────────────────────────────────────────

class ReindexResponse(BaseModel):
    """Response from bulk reindex operation."""
    success: bool
    total_indexed: int = 0
    failed: int = 0
    message: str = ""


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """RAG subsystem health status."""
    status: str = "healthy"
    embedding_provider: str = ""
    vector_count: int = 0
    db_connected: bool = False
