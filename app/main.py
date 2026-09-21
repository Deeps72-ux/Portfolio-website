import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.rag import RAGEngine
from app.contact_agent import ContactAgent

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

# Prevent browsers from caching static files in local dev
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/static") or path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

rag = RAGEngine()
contact_agent = ContactAgent()

@app.on_event("startup")
async def startup_event():
    await rag.initialize()

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "deepan-portfolio",
        "rag_provider": rag.provider,
        "contact_provider": contact_agent.provider,
    }

@app.get("/resume")
@app.get("/api/resume")
async def get_resume():
    resume_path = STATIC_DIR / "Deepan_Kulandaisami_Resume.pdf"
    if not resume_path.exists():
        return {"error": "Resume file not found."}
    return FileResponse(
        resume_path,
        media_type="application/pdf",
        filename="Deepan_Kulandaisami_Resume.pdf",
        headers={
            "Content-Disposition": 'inline; filename="Deepan_Kulandaisami_Resume.pdf"',
            "Cache-Control": "no-cache",
        },
    )

@app.get("/api/projects")
async def projects():
    return {
        "projects": [
            {
                "id": "nexusgraph",
                "title": "NexusGraph: Multi-Agent Orchestrator",
                "type": "Agentic AI / LangGraph",
                "category": "agents",
                "badge": "Agentic Flow",
                "description": "Self-directed multi-agent system coordinating specialized planner, code synthesis, schema validation, and recovery sub-agents with stateful cycles and human-in-the-loop checkpoints.",
                "technologies": ["FastAPI", "LangGraph", "Python", "Qdrant", "PostgreSQL", "WebSockets", "Docker"],
                "demo_url": "https://nexusgraph-multiagent-orchestrator.onrender.com",
                "github_url": "https://github.com/Deeps72-ux/nexusgraph-multiagent-orchestrator",
                "featured": True,
                "is_live": True,
            },
            {
                "id": "documind",
                "title": "DocuMind: Agentic Multimodal RAG",
                "type": "RAG / Document Intelligence",
                "category": "agents",
                "badge": "RAG System",
                "description": "Production-grade document intelligence engine with OCR, layout-aware PDF chunking, hybrid dense/sparse vector retrieval, cross-encoder reranking, and hallucination guardrails.",
                "technologies": ["FastAPI", "LangChain", "Milvus", "PyMuPDF", "Tesseract", "Groq LLM", "Redis"],
                "demo_url": "https://documind.demo.app",
                "github_url": "https://github.com/Deeps72-ux/documind-agentic-rag",
                "featured": True,
                "is_live": False,
            },
            {
                "id": "querygenie",
                "title": "QueryGenie: Self-Healing Text-to-SQL",
                "type": "FastAPI / Database AI",
                "category": "fastapi",
                "badge": "FastAPI Backend",
                "description": "Autonomous text-to-SQL backend service with dynamic schema discovery, AST query validation, sandbox trial execution, and error-feedback loop for query correction.",
                "technologies": ["FastAPI", "PostgreSQL", "LangGraph", "SQLGlot", "Pydantic", "Docker"],
                "demo_url": "https://querygenie.demo.app",
                "github_url": "https://github.com/Deeps72-ux/querygenie-nl-sql-studio",
                "featured": True,
                "is_live": False,
            },
            {
                "id": "omnivoice",
                "title": "OmniVoice: Real-Time Streaming Agent",
                "type": "Voice AI / WebSockets",
                "category": "fastapi",
                "badge": "FastAPI & WebSockets",
                "description": "Ultra low-latency duplex voice agent backend utilizing WebSockets, OpenAI Whisper streaming transcription, asynchronous LLM tool-calling, and speech synthesis.",
                "technologies": ["FastAPI", "WebSockets", "OpenAI Whisper", "Sarvam AI", "FFmpeg", "AsyncIO"],
                "demo_url": "https://omnivoice-streaming-agent.onrender.com/",
                "github_url": "https://github.com/Deeps72-ux/omnivoice-streaming-agent",
                "featured": False,
                "is_live": True,
            },
            {
                "id": "cricpredict",
                "title": "CricPredict: ML Match Analytics",
                "type": "Machine Learning / Analytics",
                "category": "ml",
                "badge": "Machine Learning",
                "description": "Predictive analytics engine analyzing ball-by-ball cricket data. Features real-time win probability curves, batter-bowler match-up models, and 10,000-run Monte Carlo simulations.",
                "technologies": ["Python", "FastAPI", "Scikit-Learn", "Pandas", "NumPy", "XGBoost", "Streamlit"],
                "demo_url": "https://cricpredict.demo.app",
                "github_url": "https://github.com/Deeps72-ux/cricpredict-ml-engine",
                "featured": False,
                "is_live": False,
            },
            {
                "id": "proposalcraft",
                "title": "ProposalCraft: Agentic Proposal Engine",
                "type": "Generative AI / DocGen",
                "category": "agents",
                "badge": "AI Workflow",
                "description": "Agentic pipeline that converts raw client requests and RFP documents into structured business proposals with multi-format export workflows (PDF, PPTX, DOCX).",
                "technologies": ["FastAPI", "Python", "LangGraph", "ReportLab", "python-docx", "Pydantic"],
                "demo_url": "https://proposalcraft.demo.app",
                "github_url": "https://github.com/Deeps72-ux/proposalcraft-agent",
                "featured": False,
                "is_live": False,
            },
        ]
    }

@app.post("/api/chat")
async def chat(payload: dict):
    message = (payload.get("message") or "").strip()
    history = payload.get("history") or []
    if not message:
        return {"answer": "Please enter a question.", "sources": []}
    if len(message) > 1000:
        return {"answer": "Please keep the question under 1000 characters.", "sources": []}
    return await rag.answer(message, history=history)

@app.post("/api/contact/chat")
async def contact_chat(payload: dict):
    message = (payload.get("message") or "").strip()
    history = payload.get("history") or []
    lead = payload.get("lead") or {}
    if not message:
        return {
            "reply": "Hello! I'm Deepan's contact assistant. How can I help connect you with him today?",
            "lead": lead,
            "ready_to_send": False,
        }
    return await contact_agent.chat(message, history=history, current_lead=lead)

@app.post("/api/contact/submit")
async def contact_submit(payload: dict):
    lead = payload.get("lead") or {}
    transcript = payload.get("transcript") or []
    if not lead.get("email") and not lead.get("message"):
        return {"success": False, "error": "Please provide at least an email address or message."}
    
    result = await contact_agent.submit_inquiry(lead, transcript=transcript)
    return {
        "success": True,
        "result": result,
        "message": "Your message has been captured and dispatched to Deepan's Gmail!",
    }

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root():
    return FileResponse(
        STATIC_DIR / "index.html",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )
