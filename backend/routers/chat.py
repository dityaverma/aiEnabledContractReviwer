"""
POST /api/chat — AI lawyer conversation
"""
import os, httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic

router = APIRouter()

SYSTEM = """You are an expert AI legal assistant. Contract context: {ctx}
Be concise, practical, legally precise. Max 160 words. Always recommend consulting a lawyer for binding decisions."""


class Msg(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Msg]
    contract_context: str = ""
    provider: str = "claude"
    api_key: Optional[str] = None


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(400, "No messages.")
    
    # Use provided key or fallback to env
    key = req.api_key or os.getenv(f"{req.provider.upper()}_API_KEY", "")
    if not key and req.provider != "demo":
        raise HTTPException(400, f"API key for {req.provider} not provided and not found in environment.")

    try:
        reply = ""
        context = req.contract_context[:1000] or "None"
        system_prompt = SYSTEM.format(ctx=context)

        if req.provider == "claude":
            client = anthropic.Anthropic(api_key=key)
            msg = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=600,
                system=system_prompt,
                messages=[{"role": m.role, "content": m.content} for m in req.messages[-20:]],
            )
            reply = msg.content[0].text

        elif req.provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            # Prepare Gemini contents format
            contents = []
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append({"role": "model", "parts": [{"text": "I am ready to assist with your contract analysis."}]})
            for m in req.messages[-20:]:
                role = "model" if m.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": m.content}]})

            async with httpx.AsyncClient() as client:
                res = await client.post(url, json={
                    "contents": contents,
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 600}
                })
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Gemini error: {res.text}")
                data = res.json()
                reply = data['candidates'][0]['content']['parts'][0]['text']

        elif req.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            msgs = [{"role": "system", "content": system_prompt}]
            for m in req.messages[-20:]:
                role = "assistant" if m.role == "assistant" else "user"
                msgs.append({"role": role, "content": m.content})

            async with httpx.AsyncClient() as client:
                res = await client.post(url, 
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": msgs,
                        "temperature": 0.3,
                        "max_tokens": 600
                    })
                if res.status_code != 200:
                    raise HTTPException(res.status_code, f"Groq error: {res.text}")
                data = res.json()
                reply = data['choices'][0]['message']['content']
        
        else:
             raise HTTPException(400, f"Unsupported provider: {req.provider}")

        return {"reply": reply}

    except Exception as e:
        raise HTTPException(502, f"AI Provider error: {str(e)}")

