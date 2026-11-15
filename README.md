# 🌾 KrishiSaathi

**Soil Health Card insights for farmers, in their own language, even offline.**

KrishiSaathi turns a government Soil Health Card into a clear, per-acre fertilizer plan and answers farmers' questions by text and voice in **English, Telugu and Hindi**. The core analysis runs inside the app using ICAR-based rules, so it keeps working in villages with poor or no internet.

> 🥈 2nd place at our hackathon. Built as a **prototype** aimed at Farmer Producer Organisations (FPOs) who serve many farmers at once.

---

## The problem

Over 230 million Soil Health Cards have been issued in India, but most farmers can't read the numbers, don't know what to do with them, and the card is in a format that is hard to act on. Advice that does reach them often needs internet and a language they don't speak.

## What KrishiSaathi does

| Feature | What it gives the farmer / FPO |
|---|---|
| **Soil card analysis** | Upload a Soil Health Card (or enter values) and get each nutrient rated Low / Medium / High |
| **Fertilizer calculator** | Per-acre quantities of Urea, DAP and MOP (with bag counts) for the chosen crop |
| **Crop recommendations** | Crops suited to the soil values |
| **AI assistant** | Ask questions by text or voice; replies in the selected language, with spoken audio |
| **Offline mode** | Rules engine and common answers run in the browser after one online visit |
| **Multi-language UI** | English, Telugu, Hindi across the whole site; other languages shown as "Coming soon" |
| **Shareable report** | Plain-text report suitable for sending over WhatsApp |

---

## How it works

```
 Soil Health Card ──► Extract values ──► ICAR rating rules ──► Fertilizer plan (per acre)
                                              │
                                              └──► Assistant explains it in your language
```

**1. Ratings.** Each nutrient is compared against ICAR-based thresholds (for example, available nitrogen < 280 kg/ha is Low, up to 560 is Medium, above is High).

**2. Per-acre fertilizer plan.** The calculation is plain code, not AI:

1. Start with the crop's recommended dose (kg/ha) for N, P and K
2. Adjust by soil rating: Low → +25%, Medium → ×1.0, High → ×0.70 (very high potassium → ×0.50)
3. Convert hectare → acre (× 0.404686)
4. Convert nutrient → fertilizer: DAP = P ÷ 0.46 (its 18% nitrogen is credited), Urea = remaining N ÷ 0.46, MOP = K ÷ 0.60
5. Express as bags (Urea 45 kg, DAP/MOP 50 kg)

This is a simplified, STCR-inspired approach, **not** the full STCR method.

**3. The AI assistant.** Gemini 2.5 Flash answers free-form questions. Gibberish and greetings are caught by an input-quality check first, and a rule-based fallback answers if the AI is unavailable. Treat chat answers as guidance; the calculator is the source of truth for doses.

**4. Offline.** `src/engine/icarEngine.js` and `src/engine/offlineAnswers.js` run in the browser. A service worker (vite-plugin-pwa) caches the app shell. After one online visit, ratings, fertilizer plans and common questions work with no internet.

| Works offline | Needs internet |
|---|---|
| Soil ratings and fertilizer plan | Gemini AI answers |
| Offline question answering | Server voice (Telugu/Hindi/English audio) |
| UI in all supported languages | Card photo scanning / OCR |
| | Sending reports over WhatsApp |

---

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Recharts, react-i18next, vite-plugin-pwa
- **Backend:** FastAPI (Python), SQLite by default (optional Supabase), JWT auth with bcrypt
- **AI & voice:** Google Gemini 2.5 Flash, gTTS for Telugu/Hindi/English speech
- **Hosting:** Vercel (frontend), Render (backend)

## Project structure

```
krishisaathi/
├── src/
│   ├── pages/          # Landing, Dashboard, Soil Analysis, Fertilizer, Crops, Assistant, Settings…
│   ├── components/     # Shared UI
│   ├── engine/         # icarEngine.js, offlineAnswers.js  (runs in the browser)
│   ├── i18n/           # languages.js + en / te / hi translations
│   ├── context/        # Auth + language state
│   └── services/api.js # Backend client (uses VITE_API_URL)
├── backend/
│   ├── main.py         # FastAPI app, CORS, health check
│   ├── routers/        # auth, farmers, soil_reports, recommendations, chat
│   ├── agronomy/       # fertilizer_engine.py (crop doses, calculations)
│   ├── extractor.py    # Soil Health Card text extraction
│   └── tests/
├── tests/engine.test.js
├── vercel.json         # SPA routing
└── requirements.txt
```

---

## Getting started

### Prerequisites
- Node.js 20+
- Python 3.10+
- A [Gemini API key](https://aistudio.google.com/) (optional; the app falls back to rule-based answers without it)

### 1. Frontend

```bash
npm install
npm run dev          # http://localhost:5173
```

### 2. Backend

```bash
pip install -r requirements.txt
cp .env.example .env     # then fill in values
uvicorn backend.main:app --reload --port 8000   # run from the repo root
```

### 3. Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_API_URL` | Frontend | Backend base URL, must end in `/api` (read at **build** time) |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins; must exactly match your frontend URL, no trailing slash |
| `JWT_SECRET` | Backend | Secret for signing login tokens. Use a long random value in production |
| `GEMINI_API_KEY` | Backend | Enables AI assistant answers |
| `SUPABASE_URL`, `SUPABASE_KEY` | Backend | Optional hosted database; SQLite is used if unset |

### 4. Tests

```bash
npm test             # rule engine tests
npm run lint
```

---

## Deployment

**Backend (Render):** create a Web Service from the repo, build command `pip install -r requirements.txt`, start command `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`, and set the environment variables above. Health check: `/api/health`. Render does not auto-deploy by default, so use **Manual Deploy → Deploy latest commit** after pushing.

**Frontend (Vercel):** import the repo, framework preset Vite, set `VITE_API_URL=https://<your-backend>.onrender.com/api`. Changing an env var needs a **redeploy**. `vercel.json` handles page refreshes on routes like `/login`.

---

## Known limitations (honest status)

- **Prototype, not a product.** Sample/demo data is labeled as such.
- **Card photos and scans:** OCR uses a Windows-only library, so on Linux hosting only digital-text PDFs are read. Photos need a Linux-compatible OCR step.
- **ICAR rules are hardcoded** in three places (`icarEngine.js`, `extractor.py`, `fertilizer_engine.py`). A single versioned rules file with automatic device sync is planned, not built.
- **Free-tier hosting:** the Render backend sleeps when idle and its SQLite data can reset; a persistent database and keep-alive are needed for real use.
- **Chat numbers** are not yet validated against the calculator's output.
- **Languages:** English, Telugu, Hindi. Marathi and others are planned.
- Recommendations are decision support. Farmers should confirm doses with local agriculture officers.

## Roadmap

- [ ] Single versioned ICAR rules file + `/api/rules` and background sync to devices
- [ ] Linux-compatible OCR for card photos
- [ ] Validate assistant numbers against the fertilizer engine
- [ ] Persistent database and always-on backend
- [ ] More languages (Marathi, Tamil, Punjabi…)
- [ ] Pilot with 2–3 FPOs and agronomist review of the rules

## Team

Built by Mohan Kandula and Mohammad Rubina Sultana.

## Disclaimer

KrishiSaathi provides general guidance based on soil test values. It is not a substitute for advice from a qualified agronomist or your local agriculture department.      
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
