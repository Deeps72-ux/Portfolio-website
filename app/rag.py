import json
import logging
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
logger = logging.getLogger("rag")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "knowledge.json"

SYSTEM_PROMPT = """
You are Deepan Kulandaisami's official AI Digital Twin answering visitors, recruiters, colleagues, and engineering managers on his software engineering portfolio.

Persona & Rules:
1. Role & Voice: You speak as the AI Digital Twin of Deepan Kulandaisami. Speak in the first person ("I", "my projects", "my engineering work"), representing his technical background, engineering mindset, and portfolio authentically and enthusiastically.
2. Resume & Downloads:
   - When the user asks for Deepan's resume, CV, or contact sheet, tell them they can download it directly by clicking the "Download Resume" button in the navigation bar/hero section or by opening `/resume`.
3. Real-World Interaction Boundaries & Colleague Recognition:
   - When a user greets you as a friend, acquaintance, coworker, or colleague (e.g., mentions working at Bonbloc AI, mentions meeting yesterday, asks "do you remember me?", refers to past conversations or shared offline experiences):
     - You MUST clearly and explicitly mention that you are just the AI Digital Twin of Deepan Kulandaisami, and NOT the actual Deepan Kulandaisami.
     - State clearly that you cannot remember real-world interactions, offline discussions, or personal past conversations other than the data fed into your knowledge base.
     - Warmly welcome them, acknowledge the shared company or context (e.g. Bonbloc AI), and invite them to discuss technical projects, backend architecture, or connect with the real Deepan directly via email (deepksami@gmail.com) or the contact form below.
4. Non-Disclosure Agreement (NDA) & Project Inquiries:
   - Client and proprietary enterprise projects at Bonbloc AI are protected under strict Non-Disclosure Agreements (NDA). Therefore, never disclose proprietary client code or internal client project names.
   - When asked about projects or live demos, direct them enthusiastically to my featured personal systems, especially those with live production deployments on Render: NexusGraph (multi-agent orchestration, live at https://nexusgraph-multiagent-orchestrator.onrender.com), OmniVoice (streaming voice AI, live at https://omnivoice-streaming-agent.onrender.com/), DocuMind (agentic multimodal RAG, live at https://documind-agentic-rag-xuz4.onrender.com/), QueryGenie (self-healing text-to-SQL, live at https://querygenie-nl-sql-studio.onrender.com/), ProposalCraft (agentic document generation, live at https://proposalcraft-agent.onrender.com/), and CricPredict (ML cricket analytics). Provide the live links directly so visitors can try them out immediately. If visitors ask about load times or why an app took a moment to open, explain warmly that because these systems run on Render's free tier, the instances enter sleep mode when idle and take approximately 30–50 seconds to spin up on the first request (cold start), after which they run smoothly.
5. Core Personal Details to Remember & Use:
   - Current Role & Company: I work as an Associate Software Developer (AI Full Stack) at Bonbloc AI (Apr 2025 – Present).
   - Preferred Location: Bangalore, Karnataka (open to on-site, hybrid, or remote roles in/around Bangalore).
   - Compensation / Package: Starting from 10 LPA.
   - Passion for Mathematics: I am deeply passionate about mathematics, algorithms, and computational modeling (I completed a minor in Mathematical & Computational Sciences from NITK Surathkal alongside my B.Tech in EEE). I enjoy applying linear algebra, probability, and optimization to machine learning, vector search, and simulation models.
   - Python & Data Stack: I actively use Python, FastAPI, Pandas, and NumPy for ETL pipelines, tabular data manipulation, data cleaning, and ML feature engineering.
6. Grounding:
   - Base all answers on the supplied portfolio context. Never hallucinate experience or technologies I haven't worked with.
7. Conversational Engagement:
   - Conclude your response conversationally with an engaging, relevant follow-up question to keep the dialogue going.
8. Contextual Continuity & Memory:
   - When the user gives a short response or direct answer (e.g. "yes", "no", "tell me more", "exactly"), interpret it directly in the context of what you just asked or stated in the previous message. Do NOT restart your general introduction if you are already in a specific discussion.
"""

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in", "is", "it",
    "its", "of", "on", "that", "the", "to", "was", "were", "will", "with", "what", "who", "how",
    "tell", "me", "about", "your", "his", "can", "you", "do", "does", "did", "deepan"
}

OVERVIEW_KEYWORDS = {
    "who", "yourself", "profile", "bio", "intro", "introduction", "overview",
    "summary", "background", "deepan", "experience", "skills"
}


def tokenize(text: str) -> List[str]:
    return [w for w in re.findall(r"\w+", text.lower()) if len(w) > 1]


class BM25Retriever:
    def __init__(self, documents: List[dict], k1: float = 1.5, b: float = 0.75):
        self.documents = documents
        self.k1 = k1
        self.b = b
        # Boost document source/title by duplicating it
        self.doc_tokens = [
            tokenize(f"{d['source']} {d['source']} {d['text']}")
            for d in documents
        ]
        self.doc_lens = [len(t) for t in self.doc_tokens]
        self.avg_dl = sum(self.doc_lens) / max(len(self.doc_lens), 1)
        self.doc_freqs = Counter()
        self.term_freqs = []
        for tokens in self.doc_tokens:
            tf = Counter(tokens)
            self.term_freqs.append(tf)
            for term in tf:
                self.doc_freqs[term] += 1
        self.n_docs = len(documents)

    def retrieve(self, query: str, k: int = 5) -> List[dict]:
        if not self.documents:
            return []

        tokens = tokenize(query)
        content_tokens = [t for t in tokens if t not in STOPWORDS]
        is_overview = bool(set(tokens) & OVERVIEW_KEYWORDS) and not content_tokens

        # For broad overview questions like "Who is Deepan?", prioritize profile & core experience
        if is_overview:
            overview_order = [
                "Profile & Introduction",
                "Current Role & Professional Experience",
                "Career Preferences, Location & Compensation",
                "Passion for Mathematics",
                "Enterprise Multi-Agent Platform",
                "Onelign AI Studio",
            ]
            results = [d for d in self.documents if d["source"] in overview_order]
            # append other docs if needed up to k
            for d in self.documents:
                if d not in results:
                    results.append(d)
                if len(results) >= k:
                    break
            return [{**d, "score": 1.0} for d in results[:k]]

        q_tokens = content_tokens if content_tokens else tokens
        scores = []
        for i, tf in enumerate(self.term_freqs):
            dl = self.doc_lens[i]
            score = 0.0
            for term in q_tokens:
                if term in tf:
                    df = self.doc_freqs[term]
                    idf = max(0.1, math.log(1.0 + (self.n_docs - df + 0.5) / (df + 0.5)))
                    f = tf[term]
                    score += idf * (f * (self.k1 + 1.0)) / (
                        f + self.k1 * (1.0 - self.b + self.b * (dl / self.avg_dl))
                    )
            scores.append(score)

        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        results = [{**self.documents[i], "score": float(scores[i])} for i in ranked if scores[i] > 0]

        # If fewer than k matches found with score > 0, fill with top foundational docs
        if len(results) < k:
            seen = {r["source"] for r in results}
            for doc in self.documents:
                if doc["source"] not in seen:
                    results.append({**doc, "score": 0.0})
                    seen.add(doc["source"])
                if len(results) >= k:
                    break

        return results[:k]


def is_valid_key(val: Optional[str]) -> bool:
    if not val:
        return False
    val = val.strip()
    return bool(val and not val.startswith("your_") and not val.endswith("_here"))


class RAGEngine:
    def __init__(self):
        self.documents: List[dict] = []
        self.retriever: Optional[BM25Retriever] = None
        self.client: Optional[AsyncOpenAI] = None
        self.model: str = "llama-3.3-70b-versatile"
        self.provider: Optional[str] = None
        self._setup_client()

    def _setup_client(self):
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if is_valid_key(groq_key):
            self.provider = "groq"
            self.client = AsyncOpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
            )
            self.model = os.getenv("GROQ_CHAT_MODEL", "qwen/qwen3.8-27b")
            logger.info(f"Configured Groq provider with model {self.model}")
        elif is_valid_key(openai_key):
            self.provider = "openai"
            self.client = AsyncOpenAI(api_key=openai_key)
            self.model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
            logger.info(f"Configured OpenAI provider with model {self.model}")
        else:
            self.provider = None
            self.client = None
            logger.warning("No valid GROQ_API_KEY or OPENAI_API_KEY found in environment.")

    def _load_knowledge(self):
        if not DATA_FILE.exists():
            return
        try:
            mtime = DATA_FILE.stat().st_mtime
            if not self.documents or getattr(self, "_last_mtime", None) != mtime:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                self.retriever = BM25Retriever(self.documents)
                self._last_mtime = mtime
                logger.info(f"Loaded {len(self.documents)} knowledge chunks from {DATA_FILE}")
        except Exception as e:
            logger.error(f"Error loading knowledge: {e}")

    async def initialize(self):
        self._setup_client()
        self._load_knowledge()
        provider_status = f"Provider: {self.provider} ({self.model})" if self.provider else "Provider: None (Key needed)"
        print(f"RAG initialized with {len(self.documents)} knowledge chunks. {provider_status}")

    async def retrieve(self, query: str, k: int = 5) -> List[dict]:
        self._load_knowledge()
        if not self.retriever:
            return []
        return self.retriever.retrieve(query, k=k)

    async def answer(self, query: str, history: Optional[List[dict]] = None):
        # Re-check key in case user created or updated .env while server was running
        if not self.client:
            self._setup_client()

        if not self.client:
            return {
                "answer": (
                    "The portfolio assistant is not configured with an API key yet.\n\n"
                    "Please add your GROQ_API_KEY in the .env file to enable 'Ask Deepan'."
                ),
                "sources": [],
            }

        # Process and sanitize conversation history
        sanitized_history: List[dict] = []
        if history and isinstance(history, list):
            for turn in history:
                if isinstance(turn, dict) and "role" in turn and "content" in turn:
                    r = "user" if turn.get("role") == "user" else "assistant"
                    c = str(turn.get("content", "")).strip()
                    if c:
                        sanitized_history.append({"role": r, "content": c})

        # Contextual query expansion for retrieval:
        # If user asks a short follow-up (e.g., "yes", "how?", "tell me more"),
        # combine it with the last user query to retrieve relevant portfolio chunks
        retrieval_query = query
        if len(query.split()) <= 4 and sanitized_history:
            last_user_turn = next(
                (m["content"] for m in reversed(sanitized_history) if m["role"] == "user"),
                ""
            )
            if last_user_turn:
                retrieval_query = f"{last_user_turn} {query}".strip()

        docs = await self.retrieve(retrieval_query, k=5)
        if not docs and retrieval_query != query:
            docs = await self.retrieve(query, k=5)
        if not docs:
            return {
                "answer": "I don't have enough portfolio information to answer that reliably.",
                "sources": [],
            }

        context = "\n\n---\n\n".join(
            f"Source: {d['source']}\n{d['text']}" for d in docs
        )

        system_instruction = f"""{SYSTEM_PROMPT}

Portfolio Context:
{context}"""

        messages = [{"role": "system", "content": system_instruction}]

        # Append recent conversation history (last 6 turns for conversational context)
        if sanitized_history:
            messages.extend(sanitized_history[-6:])

        # Append current user question
        messages.append({"role": "user", "content": query})

        candidate_models = [self.model]
        if self.provider == "groq":
            for fb in ["qwen/qwen3.8-27b", "groq/compound-mini"]:
                if fb not in candidate_models:
                    candidate_models.append(fb)

        response = None
        last_error = None

        for candidate in candidate_models:
            try:
                response = await self.client.chat.completions.create(
                    model=candidate,
                    temperature=0.2,
                    messages=messages,
                )
                self.model = candidate  # stick with working model
                break
            except Exception as e:
                last_error = e
                err_text = str(e)
                if "model_not_found" in err_text or "404" in err_text:
                    logger.warning(f"Model {candidate} not found, trying fallback...")
                    continue
                else:
                    raise e

        if response is None:
            if last_error:
                raise last_error
            return {"answer": "No response could be generated.", "sources": []}

        try:
            answer = response.choices[0].message.content.strip()

            sources = []
            for d in docs:
                if d.get("score", 0) > 0 and d["source"] not in sources:
                    sources.append(d["source"])
            if not sources:
                sources = [d["source"] for d in docs[:3]]

            return {"answer": answer, "sources": sources[:4]}
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Error calling {self.provider} API: {err_msg}")
            if "AuthenticationError" in type(e).__name__ or "401" in err_msg or "invalid_api_key" in err_msg:
                return {
                    "answer": (
                        f"Authentication failed with {self.provider.capitalize() if self.provider else 'LLM'} API. "
                        "Please verify that your GROQ_API_KEY in the .env file is correct."
                    ),
                    "sources": [],
                }
            return {
                "answer": f"Unable to generate an answer right now ({self.provider} error: {err_msg}).",
                "sources": [],
            }
