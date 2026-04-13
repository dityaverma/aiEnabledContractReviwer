"""
POST /api/analyze — Full AI contract analysis
"""
import os, json, httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic

router = APIRouter()

PROMPT = """You are an expert legal AI. Analyze this contract carefully.
Respond ONLY with valid JSON — no markdown, no backticks, no extra text.

{{
  "summary": "2-3 sentence plain-English summary",
  "risk_score": <1.0-10.0>,
  "risk_level": "Low"|"Medium"|"High",
  "clauses": [{{"name":"...","risk":"high|medium|low","type":"Payment/Termination/Liability/NDA/Delivery/IP/Jurisdiction/Other","text":"one-sentence extract"}}],
  "obligations": [{{"party":"...","action":"...","deadline":"specific/Undefined/Vague"}}],
  "issues": [{{"severity":"high|medium|low","title":"...","desc":"..."}}],
  "recommendations": ["..."]
}}

Contract:
{text}"""


class AnalyzeRequest(BaseModel):
    text: str
    provider: str = "claude"
    api_key: Optional[str] = None


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if len(req.text.strip()) < 50:
        raise HTTPException(400, "Contract text too short.")
    
    # Use provided key or fallback to env
    key = req.api_key or os.getenv(f"{req.provider.upper()}_API_KEY", "")
    if not key and req.provider != "demo":
        raise HTTPException(400, f"API key for {req.provider} not provided and not found in environment.")

    try:
        raw_response = ""
        
        if req.provider == "claude":
            client = anthropic.Anthropic(api_key=key)
            msg = client.messages.create(
                model="claude-3-5-haiku-20241022", # Updated to a real model name
                max_tokens=2000,
                messages=[{"role": "user", "content": PROMPT.format(text=req.text[:4000])}],
            )
            raw_response = msg.content[0].text

        elif req.provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json={
                    "contents": [{"parts": [{"text": PROMPT.format(text=req.text[:4000])}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2000}
                })
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Gemini error: {res.text}")
                data = res.json()
                raw_response = data['candidates'][0]['content']['parts'][0]['text']

        elif req.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            async with httpx.AsyncClient() as client:
                res = await client.post(url, 
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [{"role": "user", "content": PROMPT.format(text=req.text[:4000])}],
                        "temperature": 0.2
                    })
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Groq error: {res.text}")
                data = res.json()
                raw_response = data['choices'][0]['message']['content']
        
        else:
            raise HTTPException(400, f"Unsupported provider: {req.provider}")

        # Basic JSON extraction
        clean = raw_response.replace("```json","").replace("```","").strip()
        start = clean.index("{")
        end = clean.rindex("}") + 1
        return json.loads(clean[start:end])

    except json.JSONDecodeError:
        raise HTTPException(500, "AI returned invalid JSON — try again.")
    except Exception as e:
        raise HTTPException(502, f"AI Provider error: {str(e)}")

