"""Prompt engineering for the RAG pipeline.

All prompts include anti-hallucination guardrails — the LLM is instructed
to answer ONLY using retrieved context and explicitly flag missing info.
"""

from __future__ import annotations
from .schemas import ProjectMatch
from .utils import sanitize_prompt


# ─── System Prompt ────────────────────────────────────────────────────────────

INVESTOR_SEARCH_SYSTEM = """You are **DealFlow AI**, a senior investment analyst at a top-tier venture capital firm.

## Your Rules (MUST FOLLOW)
1. **ONLY use the provided startup data.** Never invent, guess, or hallucinate information.
2. If a field is missing or empty, say "Information not available" — do NOT fabricate it.
3. Rank startups by relevance to the investor's search query.
4. For each startup, provide: strengths, risks, and market fit assessment.
5. Compare startups against each other when multiple are returned.
6. Include the similarity score as a percentage alongside each startup.
7. Be concise, specific, and actionable. This is for real investment decisions.
8. Format your response in clean Markdown with headers and bullet points.
9. End with a clear recommendation on which startup(s) to prioritize."""


# ─── Context + Query Template ────────────────────────────────────────────────

INVESTOR_SEARCH_TEMPLATE = """## Investor Search Query
{query}

## Retrieved Startups (Ranked by Relevance)
{context}

## Instructions
Using ONLY the startup data above, provide a detailed investment analysis:

1. **Executive Summary** — Briefly summarize what was found vs what the investor asked for.
2. **Startup Rankings** — Rank each startup by relevance to the query. For each:
   - Match Score (from similarity percentage)
   - Key Strengths (why this fits the investor's criteria)
   - Key Risks (potential concerns)
   - Market Fit Assessment (how well it addresses the query)
3. **Comparative Analysis** — If multiple startups match, compare them head-to-head.
4. **Investment Recommendation** — Which startup(s) should the investor prioritize and why?
5. **Information Gaps** — What critical data is missing that the investor should request?

Respond in well-structured Markdown. Be thorough but concise."""


# ─── Builder ──────────────────────────────────────────────────────────────────

def build_search_prompt(query: str, matches: list[ProjectMatch]) -> str:
    """Build the full RAG prompt from investor query + retrieved context.

    Args:
        query: The investor's natural language search query (sanitized).
        matches: List of ProjectMatch objects from the retrieval stage.

    Returns:
        Formatted prompt string ready to send to Gemini.
    """
    safe_query = sanitize_prompt(query)

    if not matches:
        return (
            f"The investor searched for: \"{safe_query}\"\n\n"
            "No matching startups were found in the database. "
            "Please inform the investor that no projects match their criteria "
            "and suggest they broaden their search terms."
        )

    # Build context block from retrieved matches
    context_parts = []
    for i, m in enumerate(matches, 1):
        tech_str = ", ".join(m.tech_stack) if m.tech_stack else "Not specified"
        funding_str = f"${m.funding_goal:,.0f}" if m.funding_goal else "Not specified"

        block = (
            f"### Startup {i}: {m.title or 'Untitled'}\n"
            f"- **Similarity Score**: {m.similarity * 100:.1f}%\n"
            f"- **Category**: {m.category or 'Not specified'}\n"
            f"- **Tagline**: {m.tagline or 'Not specified'}\n"
            f"- **Tech Stack**: {tech_str}\n"
            f"- **Funding Goal**: {funding_str}\n"
            f"- **Founder**: {m.founder_name or 'Not specified'}\n"
            f"- **Full Description**:\n{m.content or 'No detailed description available.'}\n"
        )
        context_parts.append(block)

    context = "\n---\n".join(context_parts)

    return INVESTOR_SEARCH_TEMPLATE.format(
        query=safe_query,
        context=context,
    )
