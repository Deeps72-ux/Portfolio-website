
# Deepan AI Portfolio

A full-stack software engineering portfolio built with HTML, CSS, JavaScript and FastAPI, with a RAG-powered "Ask Deepan" assistant.

## Architecture

Browser
→ FastAPI
→ embedding retrieval
→ relevant portfolio context
→ LLM
→ grounded answer

## Stack

- HTML / CSS / Vanilla JavaScript
- Python / FastAPI
- Fast BM25 contextual retrieval (NumPy)
- Groq LLM (`llama-3.3-70b-versatile`) / OpenAI API
- Render

## Local setup

Python 3.11+ recommended.

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

Create `.env` from `.env.example` and add your `GROQ_API_KEY` (from https://console.groq.com).

Run:

```bash
uvicorn app.main:app --reload
```

Open:

http://127.0.0.1:8000

## Render deployment

1. Push this repository to GitHub.
2. Create a new Web Service in Render.
3. Connect the GitHub repository.
4. Build command:

```text
pip install -r requirements.txt
```

5. Start command:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Add environment variable:

```text
GROQ_API_KEY = your_groq_api_key
```

The included `render.yaml` can also be used for automatic Render Blueprint deployment.

## Important

Professional proprietary source code is not included because it is private company work. The portfolio describes the work at a high level without exposing proprietary source code or credentials.

