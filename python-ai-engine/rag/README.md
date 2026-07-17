# Smart Deal Flow & Investor Matchmaker (RAG Pipeline)

An enterprise-grade, clean-architecture Retrieval-Augmented Generation (RAG) system integrated into **Vichaar-Setu** for matching investors with student startup projects.

---

## 🏗️ Architecture Overview

The RAG pipeline operates on a **hybrid retrieval** architecture with **Reciprocal Rank Fusion (RRF)** re-ranking before utilizing Google Gemini to generate high-fidelity investment summaries.

```
┌─────────────────┐      HTTP POST      ┌─────────────────┐      HTTP POST      ┌─────────────────────┐
│  React Frontend │ ──────────────────> │ Express Backend │ ──────────────────> │  Python AI Engine   │
│ (SmartSearch UI)│                     │ (Proxy Router)  │                     │ (FastAPI App)       │
└─────────────────┘                     └─────────────────┘                     └─────────────────────┘
                                                                                           │
                                                                                           │
                                   ┌──────────────────────┐  Vector / Lexical RPC          │
                                   │ Supabase PostgreSQL  │ <──────────────────────────────┘
                                   │ (pgvector DB Extension)│
                                   └──────────────────────┘
```

---

## 📂 Module Folder Structure

The implementation is located inside `python-ai-engine/rag/` and adheres to Clean Architecture:

```
python-ai-engine/rag/
├── __init__.py           # Package initialization & public API exports
├── embedding.py          # Abstract EmbeddingProvider ABC & Gemini text-embedding-004
├── ingestion.py          # Text chunk building, structured metadata mapping, & DB upserts
├── retrieval.py          # Vector RPC search, lexical FTS, & Reciprocal Rank Fusion
├── prompts.py            # Factual, system prompts with prompt-injection sanitization
├── service.py            # End-to-end RAG workflow orchestrator & Gemini LLM caller
├── schemas.py            # Pydantic request/response data contracts
└── utils.py              # Performance timing context, JSON structured logger, & Client factories
```

---

## 🔑 Environment Variables

Make sure the following variables are configured in your development `.env` and production settings (Render & Vercel):

### Python AI Engine (Render/Local)
* `SUPABASE_URL` - Supabase project URL (for database inserts).
* `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS for writing embeddings).
* `VITE_GEMINI_API_KEY` - Google Gemini API Key.

### Express Backend (Render/Vercel)
* `PYTHON_ENGINE_URL` - Public URL of the FastAPI app (e.g., `https://vichaar-setu-1.onrender.com`).

---

## 📡 REST API Documentation

### 1. Ingest a Project
* **Endpoint:** `POST /api/rag/ingest`
* **Request:**
  ```json
  { "project_id": "8fa84f70-d98c-4a30-8025-06d9539316be" }
  ```
* **Description:** Extracts all text fields from a project, generates a 768-dimension embedding via `text-embedding-004`, and upserts it into `project_embeddings`. Called automatically via database hooks.

### 2. Semantic Search
* **Endpoint:** `POST /api/rag/search`
* **Request:**
  ```json
  {
    "query": "I want SaaS fintech startups solving fraud detection",
    "filters": {
      "category": "FinTech",
      "min_funding": 50000,
      "max_funding": 500000,
      "tech_stack": "React"
    }
  }
  ```
* **Response:**
  ```json
  {
    "answer": "### Executive Summary\n...",
    "matched_projects": [
      {
        "project_id": "...",
        "title": "Securify",
        "tagline": "Fraud detection AI",
        "similarity": 0.84,
        "tech_stack": ["React", "Python"],
        "funding_goal": 150000
      }
    ],
    "total_matches": 1,
    "latency_ms": 1150.4
  }
  ```

### 3. Bulk Reindex
* **Endpoint:** `POST /api/rag/reindex`
* **Description:** Reads all published projects in the database, generates embeddings, and indexes them with rate-limiting backoffs.

---

## 🔄 Sequence Diagram

```
[User/Investor]        [React UI]          [Express API]       [FastAPI RAG]        [PostgreSQL]
       │                   │                     │                   │                   │
       │─── Input Search ──>                     │                   │                   │
       │    Query          │─── POST Search ────>│                   │                   │
       │                   │    (Query + Filter) │─── POST Search ──>│                   │
       │                   │                     │    Forward        │── Embed Query ───>│ (Gemini API)
       │                   │                     │                   │<─ Return Vector ──│
       │                   │                     │                   │                   │
       │                   │                     │                   │─── rpc similarity ─> [project_embeddings]
       │                   │                     │                   │<── Retrieve top-K ─┘
       │                   │                     │                   │                   │
       │                   │                     │                   │─── Enrich Data ───> [projects table]
       │                   │                     │                   │<── Project Rows ──┘
       │                   │                     │                   │                   │
       │                   │                     │                   │─── Compile RAG ──> [Google Gemini]
       │                   │                     │                   │<── VC Evaluation ─┘
       │                   │                     │<── JSON Response ─│                   │
       │                   │<── JSON Response ───│                   │                   │
       │<── Display UI ────│                   │                   │                   │
```

---

## 🛠️ Ingestion & Deletion Lifecycles (Auto-Sync)
To ensure the vector database remains perfectly synchronized with raw project tables, Vichaar-Setu implements **non-blocking web hooks** at the database operation level (`backend/api/db.ts`):
* **Project Creation/Update:** Fires an asynchronous request to `/api/rag/ingest` to compute and upsert vectors.
* **Project Deletion:** Fires a request to `/api/rag/project/:id` to wipe corresponding embeddings.

---

## 🚀 Deployment Guide

### Database Setup
1. Open the Supabase SQL editor.
2. Open [supabase/migrations/20260716_rag_pgvector.sql](file:///c:/Users/Dell/Downloads/Vichaar-Setu-main/Vichaar-Setu-main/supabase/migrations/20260716_rag_pgvector.sql).
3. Execute the full migration script to enable the vector extension, create tables, indices, and install searching RPC functions.

### AI Engine (FastAPI)
1. Set Python runtime version to `3.11` (configured in `runtime.txt`).
2. Run `pip install -r requirements.txt` to install `supabase` and `httpx`.
3. Add the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your environment configurations.

---

## 🧪 Testing Guide

To verify your pipeline setup manually:

### 1. Check Subsystem Health
```bash
curl http://localhost:8000/api/rag/health
```

### 2. Trigger Bulk Indexing
```bash
curl -X POST http://localhost:8000/api/rag/reindex
```

### 3. Run a Query
```bash
curl -X POST http://localhost:8000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find fintech computer vision startups"}'
```
