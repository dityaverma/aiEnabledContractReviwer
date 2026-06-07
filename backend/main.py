from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from routers import analysis, chat, contracts, upload

app = FastAPI(
    title="Lexis AI API",
    version="1.0.0",
    description="Contract intelligence: clause extraction, loophole detection, risk scoring.",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router,  prefix="/api", tags=["Analysis"])
app.include_router(chat.router,      prefix="/api", tags=["Chat"])
app.include_router(contracts.router, prefix="/api", tags=["Contracts"])
app.include_router(upload.router,    prefix="/api", tags=["Upload"])


@app.get("/", tags=["Health"])
async def root():
    return {"service": "Lexis AI", "version": "1.0.0", "status": "running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "providers": {
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "gemini":    bool(os.getenv("GEMINI_API_KEY")),
            "groq":      bool(os.getenv("GROQ_API_KEY")),
        }
    }
