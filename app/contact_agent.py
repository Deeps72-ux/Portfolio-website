import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

from app.mailer import dispatch_contact_inquiry

load_dotenv()
logger = logging.getLogger("contact_agent")

CONTACT_SYSTEM_PROMPT = """You are Deepan Kulandaisami's dedicated AI Contact Concierge & Intake Specialist on his software engineering portfolio.
Your job is to greet visitors warmly, learn about their inquiry (e.g. job opportunities, freelance/consulting projects, networking, or speaking), and gather their contact details so Deepan can get back to them directly.

Key Objectives:
1. Greet the visitor politely and be helpful, concise, and professional.
2. Ask for and capture these key details over the conversation:
   - Full Name
   - Email address (essential so Deepan can reply)
   - Company, Organization, or Role (e.g. Recruiter at X, Founder at Y, fellow engineer)
   - Reason for contacting / Message / Project details
3. If the visitor shares info in a single message (e.g. "Hi, I am Jane from Acme (jane@acme.com), we want to hire Deepan"), extract all of them immediately.
4. Deepan's quick career context (if visitors ask):
   - Current role: Associate Software Developer at Bonbloc AI
   - Preferred roles: Software Engineer / Backend Developer / AI Engineer / Full-Stack
   - Preferred location: Bangalore, Karnataka (open to hybrid, onsite, remote)
   - Package / Compensation preference: Starting from 10 LPA
   - Tech stack: Python, FastAPI, Django, LangGraph, RAG pipelines, PostgreSQL, React, TypeScript
5. Tone: Warm, efficient, respectful, and brief (2-3 sentences per turn). Do not write essays.
6. When both Name and Email are known, confirm with the visitor that you have their details and are ready to dispatch the message straight to Deepan's Gmail inbox.

CRITICAL OUTPUT FORMAT:
You MUST ALWAYS respond with a valid JSON object only (no markdown code blocks, no backticks, just raw JSON) matching this exact schema:
{
  "reply": "Your conversational response to the visitor",
  "extracted": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "company": "extracted company/role or null",
    "message": "extracted message/intent summary or null"
  },
  "ready_to_send": boolean (true ONLY if name, email, and a message/intent are all collected and visitor is ready to dispatch)
}
"""

EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")

def is_valid_key(key: Optional[str]) -> bool:
    if not key or key.strip() == "":
        return False
    lower = key.lower()
    return not ("your_" in lower or "placeholder" in lower or "gsk_your" in lower)

class ContactAgent:
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.provider: Optional[str] = None
        self.model: str = "llama-3.3-70b-versatile"
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
            logger.info(f"ContactAgent configured with Groq model {self.model}")
        elif is_valid_key(openai_key):
            self.provider = "openai"
            self.client = AsyncOpenAI(api_key=openai_key)
            self.model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
            logger.info(f"ContactAgent configured with OpenAI model {self.model}")
        else:
            self.provider = None
            self.client = None
            logger.warning("ContactAgent: No valid GROQ_API_KEY or OPENAI_API_KEY found.")

    def _extract_regex_email(self, text: str) -> Optional[str]:
        match = EMAIL_REGEX.search(text)
        return match.group(0) if match else None

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        current_lead: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.client:
            self._setup_client()

        lead = {
            "name": (current_lead or {}).get("name") or None,
            "email": (current_lead or {}).get("email") or None,
            "company": (current_lead or {}).get("company") or None,
            "message": (current_lead or {}).get("message") or None,
        }

        # Quick regex check for email in current input
        found_email = self._extract_regex_email(message)
        if found_email:
            lead["email"] = found_email

        if not self.client:
            # Fallback if no LLM key is configured
            if found_email and not lead.get("name"):
                reply = "Thanks for providing your email! May I also know your name and what you'd like to connect regarding?"
            elif lead.get("name") and lead.get("email"):
                reply = f"Thank you {lead['name']}! I've noted down your email ({lead['email']}). Feel free to add any details or hit 'Send Message' below to notify Deepan."
            else:
                reply = "Hello! I'm Deepan's contact assistant. Please share your name, email address, and what you'd like to collaborate or connect on, and I'll forward it right to his Gmail!"

            if not lead.get("message") and len(message) > 10:
                lead["message"] = message

            return {
                "reply": reply,
                "lead": lead,
                "ready_to_send": bool(lead.get("email") and (lead.get("name") or lead.get("message"))),
                "dispatched": False,
            }

        # Build context for LLM
        messages = [
            {"role": "system", "content": CONTACT_SYSTEM_PROMPT},
            {
                "role": "system",
                "content": f"CURRENT STATE OF COLLECTED FIELDS SO FAR: {json.dumps(lead)}. Do not ask again for fields already collected unless the visitor wants to update them."
            }
        ]

        if history:
            for turn in history[-8:]:
                r = turn.get("role")
                c = turn.get("content", "")
                if r in ("user", "assistant") and c:
                    messages.append({"role": r, "content": c})

        messages.append({"role": "user", "content": message})

        candidate_models = [self.model]
        if self.provider == "groq":
            for fb in ["qwen/qwen3.8-27b", "groq/compound-mini"]:
                if fb not in candidate_models:
                    candidate_models.append(fb)

        raw_response = None
        for candidate in candidate_models:
            try:
                response = await self.client.chat.completions.create(
                    model=candidate,
                    temperature=0.3,
                    messages=messages,
                    response_format={"type": "json_object"} if self.provider == "openai" or "qwen" in candidate or "groq" in candidate else None
                )
                raw_response = response.choices[0].message.content
                self.model = candidate
                break
            except Exception as e:
                logger.warning(f"ContactAgent model {candidate} error: {e}")
                continue

        reply_text = ""
        ready_to_send = False

        if raw_response:
            try:
                clean_json = raw_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                clean_json = clean_json.strip()

                parsed = json.loads(clean_json)
                reply_text = parsed.get("reply", "")
                extracted = parsed.get("extracted", {})

                for k in ["name", "email", "company", "message"]:
                    v = extracted.get(k)
                    if v and str(v).strip() and str(v).lower() != "null":
                        lead[k] = str(v).strip()

                ready_to_send = bool(parsed.get("ready_to_send", False))
            except Exception as e:
                logger.warning(f"Failed to parse LLM JSON response: {e}. Raw was: {raw_response}")
                reply_text = raw_response

        if not reply_text:
            reply_text = "I've noted that! Please share your email or any additional details so Deepan can follow up with you."

        # Guarantee email from regex if LLM missed it
        if found_email:
            lead["email"] = found_email

        # If user message looks like the core inquiry, store it if empty
        if not lead.get("message") and len(message) > 15 and not found_email:
            lead["message"] = message

        # Auto-detect readiness if name + email + (message or company) exist
        if lead.get("email") and lead.get("name") and (lead.get("message") or lead.get("company")):
            ready_to_send = True

        return {
            "reply": reply_text,
            "lead": lead,
            "ready_to_send": ready_to_send,
            "dispatched": False,
        }

    async def submit_inquiry(
        self,
        lead: Dict[str, Any],
        transcript: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        return await dispatch_contact_inquiry(lead, transcript)
