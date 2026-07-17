"""Ingestion service: combines project fields, embeds, and upserts into pgvector."""

from __future__ import annotations
import time
from typing import Any

from .embedding import EmbeddingProvider
from .utils import get_logger, get_supabase_client, sanitize_text, timer

logger = get_logger("ingestion")


class IngestionService:
    """Handles embedding generation and vector storage for projects.

    Responsibilities:
        - Build rich searchable documents from project fields
        - Generate embeddings via the injected EmbeddingProvider
        - Upsert into project_embeddings (deduplicated by project_id)
        - Support bulk reindex of all published projects
    """

    def __init__(self, embedding_provider: EmbeddingProvider):
        self._embedder = embedding_provider
        self._supabase = get_supabase_client()

    def build_document(self, project: dict[str, Any]) -> str:
        """Combine all searchable fields into a single rich text document.

        The document is structured with field labels so the embedding
        captures the semantic role of each piece of information.
        """
        parts = []

        title = sanitize_text(project.get("title"))
        if title:
            parts.append(f"Startup: {title}")

        tagline = sanitize_text(project.get("tagline"))
        if tagline:
            parts.append(f"Tagline: {tagline}")

        category = sanitize_text(project.get("category"))
        if category:
            parts.append(f"Category: {category}")

        description = sanitize_text(project.get("description"))
        if description:
            parts.append(f"Description: {description}")

        problem = sanitize_text(project.get("problem"))
        if problem:
            parts.append(f"Problem: {problem}")

        solution = sanitize_text(project.get("solution"))
        if solution:
            parts.append(f"Solution: {solution}")

        tech_stack = project.get("tech_stack") or []
        if isinstance(tech_stack, str):
            tech_stack = [t.strip() for t in tech_stack.replace("{", "").replace("}", "").split(",") if t.strip()]
        if tech_stack:
            parts.append(f"Tech Stack: {', '.join(tech_stack)}")

        funding = project.get("funding_goal")
        if funding:
            parts.append(f"Funding Goal: ${float(funding):,.0f}")

        founder = sanitize_text(project.get("founder_name"))
        if founder:
            parts.append(f"Founded by: {founder}")

        university = sanitize_text(project.get("founder_university"))
        if university:
            parts.append(f"University: {university}")

        return ". ".join(parts)

    def build_metadata(self, project: dict[str, Any]) -> dict:
        """Extract structured metadata for JSONB storage and filtering."""
        tech_stack = project.get("tech_stack") or []
        if isinstance(tech_stack, str):
            tech_stack = [t.strip() for t in tech_stack.replace("{", "").replace("}", "").split(",") if t.strip()]

        return {
            "category": sanitize_text(project.get("category")),
            "tech_stack": tech_stack,
            "funding_goal": float(project.get("funding_goal") or 0),
            "founder_name": sanitize_text(project.get("founder_name")),
            "founder_university": sanitize_text(project.get("founder_university")),
            "status": project.get("status", "draft"),
            "title": sanitize_text(project.get("title")),
            "tagline": sanitize_text(project.get("tagline")),
        }

    def ingest_project(self, project_id: str) -> bool:
        """Fetch a project from the database, embed it, and upsert into pgvector.

        Args:
            project_id: UUID of the project to ingest.

        Returns:
            True if successfully ingested, False otherwise.
        """
        logger.info(f"Ingesting project", extra={"project_id": project_id})

        try:
            # 1. Fetch project from the projects table
            with timer() as t_fetch:
                resp = (
                    self._supabase.table("projects")
                    .select("*")
                    .eq("id", project_id)
                    .single()
                    .execute()
                )
            project = resp.data
            if not project:
                logger.warning(f"Project not found", extra={"project_id": project_id})
                return False

            logger.info(f"Project fetched", extra={
                "project_id": project_id,
                "latency_ms": t_fetch["ms"],
            })

            # 2. Build searchable document
            document = self.build_document(project)
            if len(document) < 10:
                logger.warning(
                    "Project has insufficient content for embedding",
                    extra={"project_id": project_id},
                )
                return False

            metadata = self.build_metadata(project)

            # 3. Generate embedding
            with timer() as t_embed:
                embedding = self._embedder.embed_text(document)

            logger.info(f"Embedding generated", extra={
                "project_id": project_id,
                "latency_ms": t_embed["ms"],
            })

            # 4. Upsert into project_embeddings (UNIQUE on project_id prevents duplicates)
            with timer() as t_upsert:
                self._supabase.table("project_embeddings").upsert(
                    {
                        "project_id": project_id,
                        "content": document,
                        "embedding": embedding,
                        "metadata": metadata,
                    },
                    on_conflict="project_id",
                ).execute()

            logger.info(f"Project ingested successfully", extra={
                "project_id": project_id,
                "latency_ms": t_upsert["ms"],
            })
            return True

        except Exception as e:
            logger.error(
                f"Ingestion failed: {e}",
                extra={"project_id": project_id, "error_type": type(e).__name__},
                exc_info=True,
            )
            return False

    def delete_project(self, project_id: str) -> bool:
        """Remove a project's embedding from the vector store.

        Note: CASCADE on the FK also handles this automatically when the
        project row is deleted, but this method allows explicit cleanup.
        """
        try:
            self._supabase.table("project_embeddings").delete().eq(
                "project_id", project_id
            ).execute()
            logger.info(f"Embedding deleted", extra={"project_id": project_id})
            return True
        except Exception as e:
            logger.error(f"Delete failed: {e}", extra={"project_id": project_id})
            return False

    def reindex_all(self) -> tuple[int, int]:
        """Re-embed and upsert ALL published projects.

        Returns:
            (success_count, failure_count)
        """
        logger.info("Starting full reindex of all published projects")

        try:
            resp = (
                self._supabase.table("projects")
                .select("id")
                .eq("status", "published")
                .execute()
            )
            projects = resp.data or []
        except Exception as e:
            logger.error(f"Failed to fetch projects for reindex: {e}")
            return 0, 0

        total = len(projects)
        success = 0
        failed = 0

        logger.info(f"Reindexing {total} published projects")

        for i, proj in enumerate(projects):
            project_id = proj["id"]
            try:
                ok = self.ingest_project(project_id)
                if ok:
                    success += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Reindex error for {project_id}: {e}")
                failed += 1

            # Rate limiting: ~5 projects/second to avoid Gemini API limits
            if (i + 1) % 5 == 0:
                time.sleep(1.0)

            if (i + 1) % 50 == 0:
                logger.info(f"Reindex progress: {i + 1}/{total} ({success} ok, {failed} fail)")

        logger.info(f"Reindex complete: {success}/{total} succeeded, {failed} failed")
        return success, failed
