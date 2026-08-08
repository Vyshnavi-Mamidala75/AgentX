# Project Prompts & Development Log

## Phase 1: Repo Structure & Clean Internal Data Shaping
- **Goal**: Set up repository architecture, load and validate `curriculum.json` and `candidates.json`, and transform raw candidate signals and missions into clean, enriched internal data shapes for interview personalization.
- **Actions Taken**:
  - Initialized Git repository and created modular directory layout (`src/types/`, `src/loaders/`, `src/session/`, `src/interview/`, `src/routes/`, `data/`, `scripts/`).
  - Implemented strong TypeScript interfaces for curriculum modules/days and candidate profiles/missions/signals.
  - Built `CurriculumLoader` to parse curriculum and map days to modules, tools, and objectives.
  - Built `CandidateLoader` with `shapeCandidate()` to categorize missions into struggles (`attempts >= 3` or `failed`), masteries (`passed_first_try`), and gaps (`skipped`), and enrich each mission with its corresponding curriculum context.
  - Created `scripts/testLoaders.ts` to test and print shaped data models (verified on `CAND-016` Isabella Rossi and `CAND-003` Emily Chen).
- **Status**: Completed. Awaiting user confirmation before committing and proceeding to Phase 2.
