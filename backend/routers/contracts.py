"""
GET/POST/DELETE /api/contracts — in-memory contract store
Replace with SQLAlchemy + PostgreSQL for production.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# In-memory store (resets on server restart — use DB for persistence)
_store: dict = {}


class ContractIn(BaseModel):
    name: str
    type: str = "General"
    risk_score: float = 0.0
    risk_level: str = "Unknown"
    status: str = "analyzed"
    analysis: dict = {}
    text: str = ""


@router.get("/contracts")
async def list_contracts():
    items = sorted(_store.values(), key=lambda x: x["created_at"], reverse=True)
    return {"contracts": items, "total": len(items)}


@router.get("/contracts/{cid}")
async def get_contract(cid: str):
    c = _store.get(cid)
    if not c:
        raise HTTPException(404, "Not found.")
    return c


@router.post("/contracts", status_code=201)
async def create_contract(body: ContractIn):
    cid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": cid,
        "name": body.name,
        "type": body.type,
        "risk_score": body.risk_score,
        "risk_level": body.risk_level,
        "status": body.status,
        "analysis": body.analysis,
        "text": body.text,
        "created_at": now,
    }
    _store[cid] = record
    return record


@router.delete("/contracts/{cid}")
async def delete_contract(cid: str):
    if cid not in _store:
        raise HTTPException(404, "Not found.")
    del _store[cid]
    return {"deleted": True, "id": cid}
