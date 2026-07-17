"""Embedding providers with abstract interface for future swappability.

Supports:
    - Gemini text-embedding-004 (default, 768 dimensions)
    - Abstract base class for OpenAI / Cohere / Voyage AI drop-in replacement
"""

from __future__ import annotations
import os
import time
import requests
from abc import ABC, abstractmethod

from .utils import get_logger, timer

logger = get_logger("embedding")

# ─── Abstract Interface ──────────────────────────────────────────────────────


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers.

    To switch from Gemini to another provider (OpenAI, Cohere, Voyage AI),
    implement this interface and inject it into RAGService.
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Human-readable model identifier."""
        ...

    @property
    @abstractmethod
    def dimensions(self) -> int:
        """Dimensionality of the output vectors."""
        ...

    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text string.

        Args:
            text: Input text to embed.

        Returns:
            List of floats representing the embedding vector.

        Raises:
            EmbeddingError: If embedding generation fails after retries.
        """
        ...

    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts.

        Args:
            texts: List of input texts.

        Returns:
            List of embedding vectors (one per input text).

        Raises:
            EmbeddingError: If batch embedding fails after retries.
        """
        ...


class EmbeddingError(Exception):
    """Raised when embedding generation fails."""
    pass


# ─── Gemini Implementation ───────────────────────────────────────────────────

# Gemini embedding API configuration
_GEMINI_EMBED_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:embedContent?key={key}"
)
_GEMINI_BATCH_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:batchEmbedContents?key={key}"
)
_GEMINI_MODEL = "gemini-embedding-001"
_GEMINI_DIMENSIONS = 768
_MAX_RETRIES = 3
_TIMEOUT_SECONDS = 30
_BATCH_SIZE = 100  # Gemini API limit per batch request


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Google Gemini text-embedding-004 provider.

    Features:
        - 768-dimensional embeddings
        - Automatic retries with exponential backoff
        - Batch support (up to 100 texts per request)
        - Structured latency logging
    """

    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not self._api_key:
            logger.warning("Gemini API key not found. RAG pipeline will run in demo/fallback mode.")

    @property
    def model_name(self) -> str:
        return _GEMINI_MODEL

    @property
    def dimensions(self) -> int:
        return _GEMINI_DIMENSIONS

    def embed_text(self, text: str) -> list[float]:
        """Generate a single embedding with retry logic."""
        if not self._api_key:
            import hashlib
            h = hashlib.sha256(text.encode()).digest()
            mock_values = []
            for i in range(768):
                idx = i % len(h)
                mock_values.append(float(h[idx]) / 255.0 - 0.5)
            return mock_values

        url = _GEMINI_EMBED_URL.format(model=_GEMINI_MODEL, key=self._api_key)
        payload = {
            "model": f"models/{_GEMINI_MODEL}",
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_DOCUMENT",
            "outputDimensionality": _GEMINI_DIMENSIONS,
        }

        last_error: Exception | None = None
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                with timer() as t:
                    resp = requests.post(
                        url,
                        json=payload,
                        timeout=_TIMEOUT_SECONDS,
                    )

                if resp.status_code == 429:
                    # Rate limited — backoff and retry
                    wait = 2 ** attempt
                    logger.warning(
                        f"Rate limited (429), retrying in {wait}s (attempt {attempt}/{_MAX_RETRIES})"
                    )
                    time.sleep(wait)
                    continue

                resp.raise_for_status()
                data = resp.json()
                values = data["embedding"]["values"]

                logger.info(
                    "Embedding generated",
                    extra={
                        "latency_ms": t["ms"],
                        "provider": _GEMINI_MODEL,
                    },
                )
                return values

            except requests.exceptions.Timeout as e:
                last_error = e
                logger.warning(f"Timeout on attempt {attempt}/{_MAX_RETRIES}")
                time.sleep(2 ** attempt)
            except requests.exceptions.RequestException as e:
                last_error = e
                logger.warning(f"Request error on attempt {attempt}/{_MAX_RETRIES}: {e}")
                time.sleep(2 ** attempt)
            except (KeyError, IndexError) as e:
                last_error = e
                logger.error(f"Unexpected response structure: {e}")
                break  # Don't retry on malformed responses

        raise EmbeddingError(
            f"Failed to generate embedding after {_MAX_RETRIES} attempts: {last_error}"
        )

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts using batch API.

        Automatically splits into chunks of _BATCH_SIZE (100) per request.
        """
        if not self._api_key:
            return [self.embed_text(t) for t in texts]

        all_embeddings: list[list[float]] = []

        for chunk_start in range(0, len(texts), _BATCH_SIZE):
            chunk = texts[chunk_start : chunk_start + _BATCH_SIZE]
            url = _GEMINI_BATCH_URL.format(model=_GEMINI_MODEL, key=self._api_key)

            requests_payload = [
                {
                    "model": f"models/{_GEMINI_MODEL}",
                    "content": {"parts": [{"text": t}]},
                    "taskType": "RETRIEVAL_DOCUMENT",
                    "outputDimensionality": _GEMINI_DIMENSIONS,
                }
                for t in chunk
            ]

            last_error: Exception | None = None
            for attempt in range(1, _MAX_RETRIES + 1):
                try:
                    with timer() as t:
                        resp = requests.post(
                            url,
                            json={"requests": requests_payload},
                            timeout=_TIMEOUT_SECONDS * 2,  # Longer timeout for batch
                        )

                    if resp.status_code == 429:
                        wait = 2 ** attempt
                        logger.warning(f"Batch rate limited, retrying in {wait}s")
                        time.sleep(wait)
                        continue

                    resp.raise_for_status()
                    data = resp.json()
                    batch_embeddings = [
                        emb["values"]
                        for emb in data["embeddings"]
                    ]
                    all_embeddings.extend(batch_embeddings)

                    logger.info(
                        f"Batch embedding generated ({len(chunk)} texts)",
                        extra={
                            "latency_ms": t["ms"],
                            "batch_size": len(chunk),
                            "provider": _GEMINI_MODEL,
                        },
                    )
                    break  # Success — move to next chunk

                except requests.exceptions.Timeout as e:
                    last_error = e
                    logger.warning(f"Batch timeout attempt {attempt}/{_MAX_RETRIES}")
                    time.sleep(2 ** attempt)
                except requests.exceptions.RequestException as e:
                    last_error = e
                    logger.warning(f"Batch request error attempt {attempt}: {e}")
                    time.sleep(2 ** attempt)
                except (KeyError, IndexError) as e:
                    last_error = e
                    logger.error(f"Batch response parse error: {e}")
                    break
            else:
                raise EmbeddingError(
                    f"Batch embedding failed after {_MAX_RETRIES} attempts: {last_error}"
                )

        return all_embeddings
