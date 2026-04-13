# Lexis AI — Contract Intelligence Platform
### College Project · AI-Powered · 100% Free to Run

---

## What this does

Upload any legal contract and get:
- **Clause extraction** — identifies and classifies every clause type
- **Loophole detection** — flags vague language and missing protections
- **Obligation extraction** — maps who must do what by when
- **Risk scoring** — 1–10 score with full issue breakdown
- **AI lawyer chat** — ask anything about your contract in plain English

---

## Project structure

```
lexis-ai/
│
├── frontend/                        ← Everything the user sees
│   ├── index.html                   ← Full single-page app (landing + dashboard + upload + analysis + chat + settings)
│   └── src/
│       ├── styles/
│       │   └── main.css             ← Complete dark theme CSS
│       └── components/
│           ├── demo-data.js         ← Realistic demo contract + pre-built analysis result
│           ├── ai-providers.js      ← All AI API calls: Gemini, Groq, Claude, Demo
│           ├── analysis-engine.js   ← Progress animation + UI population + export
│           └── app.js               ← Navigation, settings, chat, dashboard logic
│
├── backend/                         ← Python API server (optional for frontend-only use)
│   ├── main.py                      ← FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── routers/
│   │   ├── analysis.py              ← POST /api/analyze
│   │   ├── chat.py                  ← POST /api/chat
│   │   ├── contracts.py             ← GET/POST/DELETE /api/contracts
│   │   └── upload.py                ← POST /api/upload (PDF/DOCX/TXT parsing)
│   └── models/
│       └── contract.py              ← SQLAlchemy model (for when you add PostgreSQL)
│
├── docker-compose.yml               ← One command: frontend + backend + database
├── .gitignore
└── README.md
```

---

## Option A — Run with zero setup (Demo mode, no API key)

This works instantly with no accounts, no keys, no installation.

1. Download and unzip the project
2. Open `frontend/index.html` in any browser (Chrome, Firefox, Edge)
3. Click **"Open platform"**
4. Click **"Load demo contract"** on the Upload page
5. Click **"Analyze contract with AI"**
6. Everything runs locally — no internet needed for Demo mode

**What Demo mode does:**
- Shows a realistic pre-built analysis of a Supplier Agreement
- Full risk report, clause breakdown, obligations table, issues, recommendations
- AI chat responds to common questions about the contract
- Perfect for showing the full UI and flow in a college demo

---

## Option B — Run with a real free AI (Gemini — recommended)

Google Gemini gives 1 million tokens/day free. No credit card needed.

### Step 1 — Get a free Gemini API key

1. Go to **https://aistudio.google.com**
2. Sign in with any Google account
3. Click **"Get API key"** in the top bar
4. Click **"Create API key"**
5. Copy the key (starts with `AIza...`)

### Step 2 — Set it in the app

1. Open `frontend/index.html` in a browser
2. Click **"Open platform"**
3. Click **"AI settings"** in the left sidebar (or the ⚙ button in the top nav)
4. Select **"Google Gemini Flash"**
5. Paste your key in the box
6. Click **"Save"**
7. The key is saved in your browser — you won't need to enter it again

### Step 3 — Analyze a real contract

1. Go to **Upload contract**
2. Paste any contract text into the text box (even a short paragraph works)
3. Click **"Analyze contract with AI"**
4. The real Gemini AI will analyze it and populate the full report

---

## Option C — Run with Groq (fastest, also free)

1. Go to **https://console.groq.com**
2. Create a free account
3. Go to API Keys → Create new key
4. Copy the key (starts with `gsk_...`)
5. In the app: Settings → Select "Groq (Llama 3)" → Paste key → Save

---

## Option D — Run with Anthropic Claude (best quality)

1. Go to **https://console.anthropic.com**
2. Create a new account (you get free trial credits automatically — no card needed initially)
3. Go to API Keys → Create key
4. Copy the key (starts with `sk-ant-...`)
5. In the app: Settings → Select "Anthropic Claude" → Paste key → Save

---

## Option E — Run the Python backend (full stack)

The backend enables PDF/DOCX file uploads and server-side API calls.

### Prerequisites
- Python 3.10 or higher
- pip

### Setup

```bash
# 1. Go to the backend folder
cd backend

# 2. Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Open .env and set: ANTHROPIC_API_KEY=sk-ant-your-key-here

# 5. Start the server
uvicorn main:app --reload --port 8000
```

Server runs at: **http://localhost:8000**
API docs (Swagger UI): **http://localhost:8000/docs**

### Open the frontend
Open `frontend/index.html` in a browser — it will automatically talk to the backend for PDF/DOCX uploads.

---

## Option F — Docker (everything in one command)

Requires Docker Desktop installed.

```bash
# 1. Copy and fill in your API key
cp backend/.env.example .env
# Edit .env: ANTHROPIC_API_KEY=sk-ant-your-key

# 2. Start everything
docker-compose up --build
```

- Frontend: http://localhost:5500
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Database: PostgreSQL on port 5432

---

## API endpoints (backend)

| Method   | Endpoint                  | What it does                                      |
|----------|---------------------------|---------------------------------------------------|
| `GET`    | `/`                       | Health check                                      |
| `GET`    | `/health`                 | Check if API key is set                           |
| `POST`   | `/api/analyze`            | Analyze contract text, returns full AI result     |
| `POST`   | `/api/chat`               | AI lawyer chat with contract context              |
| `POST`   | `/api/upload`             | Upload PDF/DOCX/TXT file, returns extracted text  |
| `GET`    | `/api/contracts`          | List all saved contracts (this session)           |
| `GET`    | `/api/contracts/{id}`     | Get a single contract by ID                       |
| `POST`   | `/api/contracts`          | Save a contract record                            |
| `DELETE` | `/api/contracts/{id}`     | Delete a contract                                 |

### Example API call

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "The Supplier shall deliver goods within a reasonable time. Either party may terminate with 7 days notice."}'
```

---

## Tech stack

| Layer          | Technology                                         |
|----------------|----------------------------------------------------|
| Frontend       | Vanilla HTML, CSS, JavaScript (no build step)      |
| AI (Gemini)    | Google Gemini 1.5 Flash via REST API               |
| AI (Groq)      | Llama 3.1 via Groq API (OpenAI-compatible)         |
| AI (Claude)    | Anthropic Claude Haiku via REST API                |
| Backend        | Python 3.12, FastAPI, Uvicorn                      |
| File parsing   | pdfplumber (PDF), python-docx (DOCX)               |
| Database model | SQLAlchemy + PostgreSQL (ready, not wired by default)|
| Infrastructure | Docker, Docker Compose, nginx                      |

---

## How each file connects

```
index.html
  └── loads main.css          (all visual styles)
  └── loads demo-data.js      (DEMO_CONTRACT_TEXT + DEMO_RESULT constants)
  └── loads ai-providers.js   (AI object: .analyze() and .chat() for all providers)
  └── loads analysis-engine.js (Engine object: progress animation + UI population)
  └── loads app.js            (goApp, goSub, startAnalysis, sendMsg, setProvider, etc.)
```

All JavaScript is plain vanilla — no frameworks, no build tools, no npm.
Open `index.html` in a browser and it works.

---

## Common questions

**Q: Does it work without any API key?**
Yes. Select Demo mode in Settings (it's the default). Full UI works with realistic pre-built data.

**Q: Does the key get sent to anyone?**
No. The key goes directly from your browser to the AI provider (Google/Groq/Anthropic). It is stored only in your browser's localStorage. It never touches any other server.

**Q: Can I use this for a real contract?**
For educational and learning purposes yes. This project is not legal advice. Always consult a qualified lawyer before signing any contract.

**Q: My PDF isn't being parsed.**
PDF/DOCX parsing requires the Python backend. For frontend-only mode, copy and paste the contract text into the text box instead.

**Q: The AI returned an error.**
Try Demo mode first to confirm the UI works. Then check your API key is correct and the provider is selected in Settings.

---

## College project notes

This project demonstrates:
- **Full-stack web development** — HTML/CSS/JS frontend + Python/FastAPI backend
- **REST API design** — clean endpoints, request/response models with Pydantic
- **AI/LLM integration** — multiple providers, prompt engineering, JSON parsing
- **Software architecture** — separation of concerns across 8 modular files
- **UI/UX design** — complete dark-theme design system, multi-page SPA navigation
- **Real-world problem** — contract analysis is a genuine legal tech use case

---

*Built with Lexis AI · For educational use only · Not legal advice*
