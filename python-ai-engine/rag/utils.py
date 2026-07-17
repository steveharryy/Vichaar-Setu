"""Shared utilities: logging, Supabase client, text sanitization, timing."""

from __future__ import annotations
import os
import re
import time
import logging
import json
from contextlib import contextmanager
from typing import Generator

from supabase import create_client, Client


# ─── Structured Logger ────────────────────────────────────────────────────────

class JSONFormatter(logging.Formatter):
    """Outputs log records as single-line JSON for structured log aggregation."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        # Merge extra fields set via logger.info("msg", extra={...})
        for key in ("latency_ms", "project_id", "query", "token_usage",
                     "match_count", "provider", "error_type", "batch_size"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val
        return json.dumps(log_entry, default=str)


def get_logger(name: str) -> logging.Logger:
    """Return a logger with JSON-structured output."""
    logger = logging.getLogger(f"rag.{name}")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


# ─── Supabase Client (Singleton) ──────────────────────────────────────────────

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a singleton Supabase client using service role credentials.

    Environment variables:
        SUPABASE_URL — Supabase project URL
        SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the RAG pipeline. "
            "Add them to your .env file or Render environment variables."
        )

    _supabase_client = create_client(url, key)
    return _supabase_client


# ─── Text Sanitization ───────────────────────────────────────────────────────

# Patterns that could indicate prompt injection attempts
_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?above",
    r"system\s*:\s*",
    r"<\s*/?script",
    r"javascript\s*:",
    r"\bexec\s*\(",
    r"\beval\s*\(",
    r"DROP\s+TABLE",
    r"DELETE\s+FROM",
    r"INSERT\s+INTO",
    r"UPDATE\s+.*\s+SET",
]

_INJECTION_RE = re.compile(
    "|".join(_INJECTION_PATTERNS),
    re.IGNORECASE,
)


def sanitize_text(text: str | None) -> str:
    """Strip None values and collapse excessive whitespace."""
    if not text:
        return ""
    # Collapse whitespace runs to single spaces
    return re.sub(r"\s+", " ", text).strip()


def sanitize_prompt(text: str) -> str:
    """Remove known prompt-injection patterns from user input.

    Does NOT block the request — silently strips dangerous fragments
    so the rest of the query is still usable.
    """
    cleaned = _INJECTION_RE.sub("", text)
    return sanitize_text(cleaned)


# ─── Timing ──────────────────────────────────────────────────────────────────

@contextmanager
def timer() -> Generator[dict, None, None]:
    """Context manager that measures elapsed wall-clock time in milliseconds.

    Usage:
        with timer() as t:
            do_work()
        print(t["ms"])  # e.g. 142.3
    """
    result: dict = {"ms": 0.0}
    start = time.perf_counter()
    try:
        yield result
    finally:
        result["ms"] = round((time.perf_counter() - start) * 1000, 2)
