# Project Prompts & Development Log

## Phase 1: Repo Structure & Clean Internal Data Shaping
- **Goal**: Set up repository architecture, load and validate `curriculum.json` and `candidates.json`, and transform raw candidate signals and missions into clean, enriched internal data shapes for interview personalization.
- **Actions Taken**:
  - Initialized Git repository and created modular directory layout (`src/types/`, `src/loaders/`, `src/session/`, `src/interview/`, `src/routes/`, `data/`, `scripts/`).
  - Implemented strong TypeScript interfaces for curriculum modules/days and candidate profiles/missions/signals.
  - Built `CurriculumLoader` to parse curriculum and map days to modules, tools, and objectives.
  - Built `CandidateLoader` with `shapeCandidate()` to categorize missions into struggles (`attempts >= 3` or `failed`), masteries (`passed_first_try`), and gaps (`skipped`), and enrich each mission with its corresponding curriculum context.
  - Created `scripts/testLoaders.ts` to test and print shaped data models (verified on `CAND-016` Isabella Rossi and `CAND-003` Emily Chen).
- **Status**: Committed (`feat(phase-1): repo structure and clean internal data shaping for curriculum and candidates`).

## Phase 2: POST /api/interview Contract Implementation with Stub Reply
- **Goal**: Implement the single required HTTP endpoint `POST /api/interview` strictly conforming to `technical-spec.md` contract shapes (Start Interview, Conversation Turn, and End Interview with Feedback), maintaining in-memory session state across requests.
- **Actions Taken**:
  - Built `SessionStore` (`src/session/sessionStore.ts`) with in-memory map keyed by `sessionId`, storing candidate profile, message history, covered curriculum days, and completion status.
  - Implemented Express endpoint `POST /api/interview` in `src/routes/interviewRouter.ts` handling start/turn/end flows.
  - Created Express server in `src/server.ts` with CORS and JSON body parser.
  - Built automated contract test in `scripts/testPhase2Contract.ts` verifying exact schema shapes, status codes, and multi-turn state persistence.
- **Status**: Committed (`feat(phase-2): implement POST /api/interview contract with in-memory session persistence`).

## Phase 3: Real Interview Logic (Gemini API & Signal-Based Personalization)
- **Goal**: Implement dynamic question generation and context-aware follow-up engine using `@google/genai`, candidate signals (attempts, passed, skipped, commitDays), and cohort curriculum tracking (minimum 8 questions, at least 4 distinct days).
- **Actions Taken**:
  - Built `InterviewEngine` in `src/interview/interviewEngine.ts` integrating `@google/genai` (with `gemini-2.5-flash`) and context-aware multi-turn routing.
  - Implemented signal-based strategy: candidates with struggles/failures receive targeted root-cause debugging questions and probing on skipped topics; high performers receive high-depth architectural scaling and trade-off challenges.
  - Integrated dynamic day-coverage tracking across turns to guarantee at least 4 distinct days across 8+ questions.
  - Connected `InterviewEngine` into `src/routes/interviewRouter.ts`.
  - Built `scripts/testPhase3Personalization.ts` to run full interviews for Isabella Rossi (`CAND-016`) and Emily Chen (`CAND-003`), demonstrating visibly distinct, personalized question sequences and contextual follow-ups.
- **Status**: Committed (`feat(phase-3): real interview logic with Gemini API and signal personalization`).

## Phase 4: Feedback & Scorecard Generation on `done: true` Turn
- **Goal**: Implement the structured feedback and scorecard generator returning `{ summary, strengths, gaps, next }` upon interview completion, synthesizing candidate cohort signals and conversation transcript.
- **Actions Taken**:
  - Created `FeedbackGenerator` in `src/interview/feedbackGenerator.ts` using Gemini structured output with candidate cohort signals and full interview transcript.
  - Refined fallback generation to explicitly detail candidate-specific struggle missions, retry counts, and skipped topics.
  - Wired `FeedbackGenerator` into `src/routes/interviewRouter.ts` on final turns when `done: true`.
  - Created `scripts/testPhase4Feedback.ts` validating byte-for-byte schema compliance (`summary: string`, `strengths: string[]`, `gaps: string[]`, `next: string[]`) for both Isabella Rossi (`CAND-016`) and Emily Chen (`CAND-003`).
- **Status**: Committed (`feat(phase-4): structured feedback and scorecard generation on interview completion`).

## Phase 5: Frontend Chat UI & Scorecard View
- **Goal**: Build a clean, minimal 2-screen frontend (React + Tailwind CSS style) with no marketing, no sign-in, and no extra navigation.
- **Actions Taken**:
  - Scaffolded React-TS frontend using Vite in `frontend/` directory.
  - Created `ChatScreen.tsx` with real-time multi-turn conversation stream, candidate selector, typing indicators, and seamless `POST /api/interview` communication.
  - Created `ScorecardScreen.tsx` rendering executive summary, strengths checklist, targeted technical gaps, actionable next steps, cohort metrics, and category progress bars.
  - Configured `App.tsx` for seamless two-screen state management toggled by the backend `done: true` response.
  - Made API base URL configurable via `VITE_API_URL` environment variable, defaulting to `http://localhost:3000`.
- **Status**: Committed (`feat(phase-5): clean 2-screen frontend (chat interview & scorecard view) with configurable backend URL`).

## Phase 6: Edge Cases Handling
- **Goal**: Harden interview flow against one-word answers, uncertainty ("I don't know" / "not sure"), and off-topic responses without breaking the multi-turn session.
- **Actions Taken**:
  - Added input classification in `InterviewEngine` (`detectEdgeCase()`) identifying one-word/brief answers, uncertainty statements, and off-topic queries.
  - Built custom guidance prompts and fallbacks:
    - *One-word answers*: Prompts candidate for concrete technical specifics, tradeoffs, and design choices.
    - *Uncertainty ("I don't know")*: Validates intellectual honesty constructively, offers conceptual guidance, and smoothly pivots to another curriculum objective.
    - *Off-topic responses*: Gently and professionally redirects candidate back to their technical cohort work.
  - Created automated test suite `scripts/testPhase6EdgeCases.ts` verifying complete interview execution through continuous edge cases without failure.
- **Status**: Completed and verified. Awaiting user confirmation before committing and proceeding to Phase 7.
