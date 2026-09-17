import asyncio
from datetime import datetime
import json
import logging
import os
from pathlib import Path
import smtplib
from email.message import EmailMessage
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger("mailer")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LEADS_FILE = DATA_DIR / "leads.json"

DEFAULT_NOTIFICATION_EMAIL = "deepksami@gmail.com"

def save_lead_to_file(lead_data: Dict[str, Any], transcript: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    lead_entry = {
        "id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "name": lead_data.get("name") or "Anonymous Visitor",
        "email": lead_data.get("email") or "",
        "company": lead_data.get("company") or "",
        "message": lead_data.get("message") or "",
        "transcript": transcript or [],
        "email_sent": False,
        "email_error": None,
    }

    leads = []
    if LEADS_FILE.exists():
        try:
            with open(LEADS_FILE, "r", encoding="utf-8") as f:
                leads = json.load(f)
                if not isinstance(leads, list):
                    leads = []
        except Exception as e:
            logger.warning(f"Failed to read existing leads: {e}")
            leads = []

    leads.append(lead_entry)

    try:
        with open(LEADS_FILE, "w", encoding="utf-8") as f:
            json.dump(leads, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved lead {lead_entry['id']} to {LEADS_FILE}")
    except Exception as e:
        logger.error(f"Failed to write lead to {LEADS_FILE}: {e}")

    return lead_entry

def _format_email_content(lead: Dict[str, Any], transcript: Optional[List[Dict[str, Any]]] = None):
    name = lead.get("name") or "Visitor"
    email = lead.get("email") or "Not provided"
    company = lead.get("company") or "Not specified"
    message = lead.get("message") or "No specific message entered."
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    plain_text = f"New Inquiry from Deepan AI Portfolio\n\nName: {name}\nEmail: {email}\nCompany / Role: {company}\nDate & Time: {timestamp}\n\nMessage:\n{message}\n"

    if transcript:
        plain_text += "\n--- Chat Transcript with Contact Agent ---\n"
        for msg in transcript:
            role = "Visitor" if msg.get("role") == "user" else "Contact Agent"
            c_txt = msg.get("content", "")
            plain_text += f"{role}: {c_txt}\n"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #222; margin: 0; padding: 20px; background-color: #f4f6f8; }}
    .container {{ max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e1e4e8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0; color: #94a3b8; font-size: 13px; }}
    .content {{ padding: 24px; }}
    .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }}
    .field {{ margin-bottom: 12px; font-size: 14px; }}
    .field:last-child {{ margin-bottom: 0; }}
    .label {{ font-weight: 600; color: #475569; display: inline-block; width: 120px; }}
    .val {{ color: #0f172a; font-weight: 500; }}
    .message-box {{ background: #ffffff; border-left: 4px solid #3b82f6; padding: 14px; margin-top: 10px; border-radius: 4px; font-style: normal; color: #1e293b; }}
    .transcript {{ margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 18px; }}
    .transcript h3 {{ font-size: 14px; text-transform: uppercase; color: #64748b; margin-top: 0; letter-spacing: 0.5px; }}
    .bubble {{ padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; max-width: 85%; }}
    .bubble.user {{ background: #e0f2fe; color: #0369a1; margin-left: auto; text-align: right; }}
    .bubble.agent {{ background: #f1f5f9; color: #334155; }}
    .footer {{ text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Deepan AI Portfolio Inquiry</h1>
      <p>New message gathered by your Contact Concierge Agent</p>
    </div>
    <div class="content">
      <div class="card">
        <div class="field"><span class="label">Visitor Name:</span> <span class="val">{name}</span></div>
        <div class="field"><span class="label">Email Address:</span> <span class="val"><a href="mailto:{email}">{email}</a></span></div>
        <div class="field"><span class="label">Company / Role:</span> <span class="val">{company}</span></div>
        <div class="field"><span class="label">Received at:</span> <span class="val">{timestamp}</span></div>
      </div>

      <div class="field"><span class="label" style="width:auto;">Visitor Message / Requirement:</span></div>
      <div class="message-box">{message}</div>
"""

    if transcript:
        html_content += """
      <div class="transcript">
        <h3>Conversation Transcript</h3>
"""
        for msg in transcript:
            role = msg.get("role", "user")
            cls = "user" if role == "user" else "agent"
            sender = "Visitor" if role == "user" else "Contact Concierge"
            text = msg.get("content", "")
            html_content += f'<div class="bubble {cls}"><strong>{sender}:</strong> {text}</div>\n'
        html_content += "      </div>"

    html_content += f"""
    </div>
    <div class="footer">
      Delivered automatically to {DEFAULT_NOTIFICATION_EMAIL} via Deepan AI Portfolio Contact Agent
    </div>
  </div>
</body>
</html>
"""
    return plain_text, html_content

def _send_email_sync(lead: Dict[str, Any], transcript: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_EMAIL") or os.getenv("GMAIL_USER") or DEFAULT_NOTIFICATION_EMAIL
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    recipient = os.getenv("NOTIFICATION_EMAIL", DEFAULT_NOTIFICATION_EMAIL)

    if not smtp_password or smtp_password.strip() == "" or "your_" in smtp_password.lower():
        msg = f"SMTP_PASSWORD is not configured in .env. Lead was safely saved to {LEADS_FILE}."
        logger.warning(msg)
        return {"sent": False, "reason": "smtp_not_configured", "message": msg}

    clean_password = smtp_password.replace(" ", "")
    name = lead.get("name") or "Visitor"
    company_suffix = f" ({lead.get('company')})" if lead.get("company") else ""
    subject = f"[Portfolio Lead] From {name}{company_suffix}"

    plain_body, html_body = _format_email_content(lead, transcript)

    em = EmailMessage()
    em["Subject"] = subject
    em["From"] = f'"Deepan AI Concierge" <{smtp_user}>'
    em["To"] = recipient
    if lead.get("email"):
        em["Reply-To"] = f'"{name}" <{lead["email"]}>'
    em.set_content(plain_body)
    em.add_alternative(html_body, subtype="html")

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                server.login(smtp_user, clean_password)
                server.send_message(em)
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, clean_password)
                server.send_message(em)

        logger.info(f"Successfully emailed lead from {name} to {recipient}")
        return {"sent": True, "recipient": recipient}
    except Exception as e:
        logger.error(f"Failed to send SMTP email: {e}")
        return {"sent": False, "reason": "smtp_error", "error": str(e)}

async def dispatch_contact_inquiry(lead: Dict[str, Any], transcript: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    lead_entry = save_lead_to_file(lead, transcript)
    email_result = await asyncio.to_thread(_send_email_sync, lead, transcript)

    lead_entry["email_sent"] = email_result.get("sent", False)
    if not lead_entry["email_sent"]:
        lead_entry["email_error"] = email_result.get("error") or email_result.get("reason")

    return {
        "saved": True,
        "lead_id": lead_entry["id"],
        "email_status": email_result,
        "summary": {
            "name": lead.get("name"),
            "email": lead.get("email"),
            "company": lead.get("company"),
            "message": lead.get("message"),
        }
    }
