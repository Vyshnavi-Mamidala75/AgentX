# AgentX: Personalized AI Interview Agent

A personalized, multi-turn technical interview agent designed for candidates completing a 31-day AI engineering cohort. AgentX analyzes the candidate's real cohort signals (missions passed, retried, failed, and skipped, commit consistency, and first-try success rate) to conduct an adaptive technical interview and generate a structured scorecard at completion.

---

## Architecture Overview

AgentX strictly follows a modular architecture:

```
AgentX/
├── data/
│   ├── curriculum.json         # 31-day curriculum (8 modules, tools, objectives)
│   └── candidates.json         # Candidate profiles, missions, attempts, signals
├── src/
│   ├── types/
│   │   ├── curriculum.ts       # Strong TypeScript interfaces for curriculum
│   │   ├── candidate.ts        # Performance profiling & mission classification
│   │   └── interview.ts        # Exact API contracts from technical-spec.md
│   ├── loaders/
│   │   ├── curriculumLoader.ts # Modular day and module lookup engine
│   │   └── candidateLoader.ts  # Signal enrichment (struggles, mastery, gaps)
│   ├── session/
│   │   └── sessionStore.ts     # In-memory session persistence keyed by sessionId
│   ├── interview/
│   │   ├── interviewEngine.ts  # Gemini-powered adaptive questioning & edge cases
│   │   └── feedbackGenerator.ts# Structured scorecard & feedback generator
│   ├── routes/
│   │   └── interviewRouter.ts  # Exposes single endpoint: POST /api/interview
│   └── server.ts               # Express server hosting API & static frontend
├── frontend/                   # 2-Screen React + TypeScript + Tailwind-style UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatScreen.tsx       # Screen 1: Minimal multi-turn chat interview
│   │   │   └── ScorecardScreen.tsx  # Screen 2: Final scorecard & evaluation view
│   │   ├── App.tsx                  # Clean 2-screen orchestrator
│   │   └── candidates.ts            # Candidate dataset selector
│   └── vite.config.ts          # Configurable proxy with VITE_API_URL
├── scripts/                    # End-to-end verification suites
│   ├── testLoaders.ts          # Phase 1: Data shaping verification
│   ├── testPhase2Contract.ts   # Phase 2: Byte-for-byte API contract tests
│   ├── testPhase3Personalization.ts # Phase 3: Signal-based questioning comparison
│   ├── testPhase4Feedback.ts   # Phase 4: Structured scorecard validation
│   └── testPhase6EdgeCases.ts  # Phase 6: One-word, "don't know", off-topic tests
├── PROMPTS.md                  # Detailed phase-by-phase development log
└── package.json
```

---

## API Specification (`technical-spec.md`)

The service exposes exactly **one** endpoint:

```http
POST /api/interview
```

### 1. Start Interview (First Request)
```json
POST /api/interview
{
  "sessionId": "abc-123",
  "candidate": { ... }
}
```
**Response:**
```json
{
  "reply": "Welcome, Isabella Rossi! ...",
  "done": false
}
```

### 2. Conversation Turn (Subsequent Requests)
```json
POST /api/interview
{
  "sessionId": "abc-123",
  "message": "I used sentence-transformers with cosine similarity..."
}
```
**Response:**
```json
{
  "reply": "Building on what you noted about ...",
  "done": false
}
```

### 3. End Interview & Scorecard (Final Turn)
```json
{
  "reply": "Thank you. That concludes our technical interview.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": [ "..." ],
    "gaps": [ "..." ],
    "next": [ "..." ]
  }
}
```

---

## Key Features

1. **Signal-Aware Personalization**:
   - Candidates who struggled on missions (e.g. `CAND-016 Isabella Rossi` with 4 retries on Embeddings, 5 on Prompts, 4 on Multi-Agent) receive targeted debugging, root-cause, and conceptual challenge questions.
   - High-performing candidates (e.g. `CAND-003 Emily Chen` with 96.8% first-try passes) receive advanced concurrency, scaling, and architectural trade-off probes.
2. **Day Coverage & Question Guarantees**:
   - Ensures a minimum of **8 questions** covering at least **4 distinct curriculum days**.
3. **Context-Aware Follow-Ups**:
   - Follow-up questions explicitly critique and build upon the candidate's prior responses rather than following a static script.
4. **Edge-Case Resilience**:
   - Gracefully handles one-word answers, uncertainty ("I don't know" / "no idea"), and off-topic diversions without breaking the multi-turn session.
5. **Two-Screen Frontend**:
   - **Screen 1**: Clean, distraction-free chat screen (no sign-in, no marketing, no nav bars).
   - **Screen 2**: Structured scorecard screen with summary, strengths, gaps, next steps, and category mastery bars.

---

## Getting Started

### 1. Installation
```bash
npm install
npm --prefix frontend install
```

### 2. Environment Configuration
Copy the template and add your Gemini API key:
```bash
cp .env.example .env
```
Inside `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Running Locally
- **Development Mode** (Backend + Frontend hot-reload):
  ```bash
  # Terminal 1: Backend
  npm run dev

  # Terminal 2: Frontend
  npm run dev:frontend
  ```
- **Production Build & Unified Run**:
  ```bash
  npm run build
  npm start
  ```
  Visit `http://localhost:3000` in your browser.

---

## Test Suites

Run any phase verification suite independently:

```bash
# Phase 1: Data shaping & loader verification
npm run test:loaders

# Phase 2: Byte-for-byte API contract validation
npm run test:contract

# Phase 3: Signal personalization comparison (CAND-016 vs CAND-003)
npm run test:phase3

# Phase 4: Scorecard and structured feedback validation
npm run test:phase4

# Phase 6: Edge case robustness (one-word, "don't know", off-topic)
npm run test:phase6
```

---

## Deployment (Render / Cloud Platforms)

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Your Google Gemini API Key
  - `PORT`: `3000` (or injected by platform)
  - `NODE_ENV`: `production`
