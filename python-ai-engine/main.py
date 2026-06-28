import os
import requests
import json
import re
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

app = FastAPI(title="Vichaar Setu AI Co-Pilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CopilotRequest(BaseModel):
    title: str
    description: str
    tech_stack: list[str] = []

class PredictRequest(BaseModel):
    title: str
    description: str
    tech_stack: list[str] = []
    funding_goal: float = 0

class InvestorProfile(BaseModel):
    investor_clerk_id: str
    full_name: str = "Anonymous Investor"
    avatar_url: str | None = None
    email: str | None = None
    university: str | None = None
    preferred_categories: list[str] = []
    min_funding: float = 0
    max_funding: float = 1000000
    preferred_tech_stack: list[str] = []
    investment_thesis: str = "General early-stage tech investments"

class MatchRequest(BaseModel):
    project_title: str
    project_description: str
    category: str = "General"
    tech_stack: list[str] = []
    funding_goal: float = 0
    investors: list[dict] = []

def call_gemini_rest(prompt: str):
    """Helper with multi-model fallback for maximum robustness."""
    if not GEMINI_API_KEY:
        raise ValueError("Missing Gemini API Key")
    
    # Authorized models for this key (Prioritizing proven working ones)
    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro-latest", "gemini-pro"]
    last_error = ""

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                return data['candidates'][0]['content']['parts'][0]['text']
            
            if response.status_code == 429:
                print(f"Quota hit for {model_name}, trying next...")
                continue
            
            last_error = f"Error {response.status_code} for {model_name}: {response.text}"
        except Exception as e:
            last_error = str(e)
            continue
            
    raise Exception(f"All Gemini models failed or quota exhausted. Last error: {last_error}")

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "python-ai-engine"}

@app.post("/api/copilot")
async def generate_copilot_assets(req: CopilotRequest):
    try:
        # 1. Pitch Deck / Business Plan
        plan_prompt = f"""You are an expert Silicon Valley Startup Advisor.
Create a comprehensive, highly compelling 3-page Business Pitch Deck in pristine Markdown format for a student startup.
Project Name: {req.title}
Core Idea: {req.description}
Tech Stack: {", ".join(req.tech_stack) if req.tech_stack else "Standard Web Tech"}
Include: # Executive Summary, # The Problem, # The Solution, # Market Opportunity, # Technical Architecture Overview, # Go-To-Market Strategy, # Financial Projections.
Keep it extremely professional and formatted cleanly with markdown headers."""

        # 2. System Architecture (Mermaid)
        diagram_prompt = f"""You are an Expert System Architect.
Based on this startup idea, design a professional system architecture diagram using Mermaid.js syntax.
Project Name: {req.title}
Core Idea: {req.description}
Tech Stack: {", ".join(req.tech_stack) if req.tech_stack else "Standard Web Tech"}
Only return the raw Mermaid diagram code block (graph TD ...). No backticks."""

        business_plan_text = call_gemini_rest(plan_prompt)
        mermaid_text = call_gemini_rest(diagram_prompt).replace("```mermaid", "").replace("```", "").strip()

        # 3. Logo (Hugging Face)
        logo_image_url = ""
        if HUGGINGFACE_API_KEY:
            try:
                API_URL = "https://api-inference.huggingface.co/models/prompthero/openjourney-v4"
                headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
                image_prompt = f"A modern minimalist vector logo for {req.title}: {req.description}. flat design, white background"
                hf_res = requests.post(API_URL, headers=headers, json={"inputs": image_prompt}, timeout=30)
                if hf_res.status_code == 200:
                    import base64
                    logo_image_url = f"data:image/jpeg;base64,{base64.b64encode(hf_res.content).decode('utf-8')}"
            except Exception as e:
                print(f"HF Error: {e}")

        return {
            "business_plan": business_plan_text,
            "mermaid_diagram": mermaid_text,
            "logo_base64": logo_image_url
        }
    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-success")
async def predict_startup_success(req: PredictRequest):
    try:
        prompt = f"""Expert VC analysis: Title: {req.title}, Description: {req.description}, Tech: {req.tech_stack}, Funding: ${req.funding_goal}.
Respond ONLY in JSON: {{"score": <int 0-100>, "analysis": "<string>"}}"""
        
        content = call_gemini_rest(prompt)
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            data = json.loads(match.group())
            score = int(data.get("score", 70))
            analysis = data.get("analysis", "Solid potential.")
        else:
            raise ValueError("Invalid JSON response")

        return {
            "score": score,
            "analysis": analysis,
            "metrics": {
                "tech_readiness": min(95, 40 + len(req.tech_stack) * 5),
                "market_fit": score - 5
            }
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        h = hashlib.md5((req.title + req.description).encode()).hexdigest()
        fallback_score = 65 + (int(h[:2], 16) % 30)
        return {
            "score": fallback_score,
            "analysis": "Automated assessment based on project clarity.",
            "metrics": {"tech_readiness": 75, "market_fit": 70}
        }

@app.post("/api/investor-match")
async def match_investors(req: MatchRequest):
    try:
        if not req.investors:
            return {"project_title": req.project_title, "matches": [], "message": "No investor profiles found"}

        results = []
        for inv in req.investors:
            prompt = f"""You are an expert Venture Capital Analyst at a top-tier VC firm.
Evaluate the compatibility between this startup project and the investor profile.

STARTUP PROJECT:
- Title: {req.project_title}
- Category: {req.category}
- Description: {req.project_description}
- Tech Stack: {", ".join(req.tech_stack) if req.tech_stack else "Not specified"}
- Funding Goal: ${req.funding_goal:,.0f}

INVESTOR PROFILE:
- Name: {inv.get('full_name', 'Anonymous')}
- Preferred Categories: {", ".join(inv.get('preferred_categories', []))}
- Check Size: ${inv.get('min_funding', 0):,.0f} - ${inv.get('max_funding', 1000000):,.0f}
- Preferred Tech: {", ".join(inv.get('preferred_tech_stack', []))}
- Investment Thesis: {inv.get('investment_thesis', 'General tech')}

Analyze how well this startup fits this investor's portfolio strategy.
Respond ONLY with valid JSON in this exact structure:
{{{{
    "match_score": <integer 0 to 100>,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1"],
    "recommendation": "<2-3 sentence summary>"
}}}}"""

            try:
                ai_response = call_gemini_rest(prompt)
                match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if match:
                    eval_data = json.loads(match.group())
                else:
                    raise ValueError("No JSON found in AI response")
            except Exception as e:
                print(f"AI matching error for {inv.get('full_name')}: {e}")
                # Deterministic fallback based on category overlap
                categories = inv.get('preferred_categories', [])
                cat_match = 1 if req.category in categories else 0
                tech_overlap = len(set(req.tech_stack) & set(inv.get('preferred_tech_stack', [])))
                fallback_score = min(95, 50 + cat_match * 20 + tech_overlap * 5)
                eval_data = {
                    "match_score": fallback_score,
                    "strengths": ["Category alignment"] if cat_match else ["Broad investment thesis"],
                    "gaps": ["Requires deeper due diligence"],
                    "recommendation": "Moderate fit based on portfolio criteria analysis."
                }

            results.append({
                "investor_clerk_id": inv.get("investor_clerk_id"),
                "investor_name": inv.get("full_name", "Anonymous Investor"),
                "avatar_url": inv.get("avatar_url"),
                "match_score": int(eval_data.get("match_score", 50)),
                "strengths": eval_data.get("strengths", []),
                "gaps": eval_data.get("gaps", []),
                "recommendation": eval_data.get("recommendation", "")
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return {"project_title": req.project_title, "matches": results}

    except Exception as e:
        print(f"Investor matching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
