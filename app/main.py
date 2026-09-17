
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.rag import RAGEngine

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Deepan AI Portfolio", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()

@app.on_event("startup")
async def startup_event():
    await rag.initialize()

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "deepan-portfolio"}

@app.get("/api/projects")
async def projects():
    return {
        "projects": [
            {
                "title": "Enterprise Multi-Agent Platform",
                "type": "Enterprise AI / Multi-Agent",
                "description": "Enterprise AI platform with domain-specific agents for HR, invoice analytics, supply-chain traceability, customer engagement and web intelligence.",
                "technologies": ["Python", "FastAPI", "Django", "PostgreSQL", "LangGraph", "RAG", "Milvus", "Docker"],
            },
            {
                "title": "Natural Language → SQL Agent",
                "type": "AI Agent / Backend",
                "description": "Agent workflow that discovers schema, generates SQL from natural language, validates queries, executes them and uses failures for correction and retry.",
                "technologies": ["Python", "LangGraph", "PostgreSQL", "LLMs", "FastAPI"],
            },
            {
                "title": "Onelign AI Studio",
                "type": "Enterprise AI Workspace",
                "description": "Unified AI workspace containing RAG, web search, SQL analytics, architecture generation, legal-document workflows and real-time voice interactions.",
                "technologies": ["FastAPI", "Django", "React", "TypeScript", "LangGraph", "WebSockets"],
            },
            {
                "title": "AI Proposal Automation Platform",
                "type": "AI / Proposal Automation",
                "description": "AI-powered proposal and RFP automation platform with document generation, AI-assisted editing and image generation/editing.",
                "technologies": ["FastAPI", "Python", "LLMs", "Stable Diffusion", "PostgreSQL"],
            },
            {
                "title": "Cricket Analyzer Agent",
                "type": "ML / Analytics",
                "description": "Decision-support platform using cricket data, predictive models, feature engineering and Monte Carlo simulation.",
                "technologies": ["Python", "FastAPI", "PostgreSQL", "scikit-learn", "Monte Carlo"],
            },
            {
                "title": "Face Recognition & Geo-Mapping",
                "type": "Computer Vision / Backend",
                "description": "Facial recognition and vector similarity platform with geo-mapping and OAuth authentication workflows.",
                "technologies": ["Python", "FastAPI", "Pinecone", "OAuth", "PostgreSQL", "Docker"],
            },
        ]
    }

@app.post("/api/chat")
async def chat(payload: dict):
    message = (payload.get("message") or "").strip()
    if not message:
        return {"answer": "Please enter a question.", "sources": []}
    if len(message) > 1000:
        return {"answer": "Please keep the question under 1000 characters.", "sources": []}
    return await rag.answer(message)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root():
    return FileResponse(STATIC_DIR / "index.html")
