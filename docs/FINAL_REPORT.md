# Kuiz Final Report

## Implemented

- Built a complete React + Vite + TypeScript app from scratch; old HTML versions were used only as content and behavior references.
- Renamed and branded the app as Kuiz.
- Added a validated `kuiz-pack@1` seed pack from the lesson PDF and supporting lesson references:
  - 1 starter pack
  - 374 entries
  - 310 exercises
  - 41 particle entries
  - 310 vocabulary entries
  - 23 grammar entries
- Covered particles, vocab, numbers, native/Sino number practice, time/date expressions, routine language, progressive grammar, purpose/necessity patterns, corrections, conjugations, and sentence production.
- Implemented quiz modes for multiple choice, fill blank, sentence builder, corrections, and conjugation practice.
- Added a guided Practice Path on Home so sessions move from meaning input, to form noticing, to integrated production, then fluency review.
- Added adaptive Smart order in Quiz so due reviews and weak items are prioritized before new/future-stable material.
- Separated `Skip` and `Next` behavior: `Skip` is available before grading; `Next` appears only after answering or showing the answer.
- Fixed mobile chip selected state so buttons do not stay incorrectly pre-highlighted.
- Replaced raw Study Focus tags with learner-facing Korean category lanes: 전체, 어휘, 숫자·시간, 문법, 조사, 연결어, 혼합.
- Split `전체` from `혼합`: 전체 clears filters for the full deck; 혼합 targets integrated sentence building, correction, and multi-category sentence practice.
- Mapped quiz and pack metadata tags through Korean display labels so internal slugs like `sino-numbers` are not shown to learners.
- Added learner-facing Korean focus categories directly to the Quiz screen, with horizontal mobile scrolling instead of a raw tag cloud.
- Reordered the starter pack MCQ source data so the correct answer is not stored as the first visible choice.
- Added deterministic multiple-choice ordering in the UI so imported content is also protected from answer-position leakage.
- Revised number MCQs so distractors are plausible same-system nearby numbers instead of obvious 1/2/3 filler choices.
- Rewrote full-sentence Korean MCQs so answer choices are full-sentence alternatives rather than fragments like "am studying."
- Rewrote remaining legacy sentence MCQs that reused generic fallback choices like "I like dogs," "I like cats," and "I go to the cafe."
- Added scenario-style mixed exercises for integrated sentence building, particle repair, connector repair, time ranges, purpose, and source/recipient distinctions.
- Reworked placeholder-heavy grammar references into readable Korean example patterns with particle roles explained.
- Added `docs/LEARNING_DESIGN.md` to ground future product work in CEFR, ACTFL, retrieval-practice research, and Nation's four-strands model.
- Kept full particle mode enabled by default with strict particle checking.
- Added Korean-only speech synthesis filtering and `ko-KR` speech defaults.
- Added JSON import/update workflow with schema validation, quality validation, duplicate detection, create/update/skip/conflict preview, rollback snapshots, and transactional merge.
- Added import quality checks for Korean-only audio, non-revealing MCQ source order, no bare numeric filler, same-granularity sentence choices, misconception notes on distractors, bracket-template rejection, and production/repair tasks for grammar or particle lessons.
- Added `Copy ChatGPT update prompt` so future lessons can be converted into valid `kuiz-pack@1` JSON, with the prompt now reflecting the same quality gates as the parser.
- Added local-first persistence for settings, review state, mistakes/lapses, import history, and backups via IndexedDB.
- Added production PWA basics: web manifest, icon, and a network-first navigation service worker for offline app-shell use after first load without trapping phones on stale UI.
- Generated Netlify-ready production output in `dist/` with `npm run build`.

## Tested

- `npm audit`: 0 vulnerabilities.
- `npm run validate:pack`: starter pack parses and validates.
- `npm run test:run`: 13 test files, 37 tests passing.
- `npm run build`: production build succeeds.
- `npm run e2e`: 16 Playwright tests passing across desktop Chromium and iPhone viewport.

Coverage includes:

- Quiz flow: answer, feedback, Next button, Skip behavior.
- Multiple choice UI state and non-sticky pre-highlight behavior.
- Import validation and duplicate-detection preview.
- Particle strictness and full-particle defaults.
- Distractor homogeneity.
- Korean Study Focus category labels with no raw `sino-numbers` or `native-numbers` text on Home.
- Korean Quiz focus category labels with no raw `sino-numbers` or `native-numbers` text in Quiz.
- Separate mixed lane visible on Home.
- Practice Path opens mixed production in Sentence builder.
- Adaptive Smart order summary is visible in Quiz.
- Deterministic MCQ choice ordering with the correct answer not locked to the first position.
- Starter MCQ source data does not put the correct answer first.
- Import parser rejects low-quality lesson JSON before preview/merge.
- Service worker update behavior prefers the network for page navigations and falls back to cache offline.
- Content-pack acceptance checks:
  - no duplicate dedupe keys
  - sentence MCQs do not mix one-word choices with sentence choices
  - particle MCQs use particle-sized choices
  - audio text fields are Korean-only
  - starter pack covers lesson-PDF scope
  - number MCQs avoid low-number filler distractors
  - grammar references avoid bracket-placeholder templates
  - full-sentence Korean MCQ prompts use full-sentence choices
  - full-sentence MCQs do not reuse generic fallback distractors
  - starter pack includes mixed scenario production and repair
- Mobile layout checks for iPhone viewport.

## Verification Screenshots

- Desktop Home focus categories: `docs/screenshots/home-desktop.png`
- iPhone Home focus categories: `docs/screenshots/home-iphone.png`
- Desktop Quiz focus categories: `docs/screenshots/quiz-focus-desktop.png`
- iPhone Quiz focus categories: `docs/screenshots/quiz-focus-iphone.png`
- iPhone quiz: `docs/screenshots/kuiz-mobile.png`
- iPad focus editing reference: `docs/screenshots/kuiz-ipad.png`
- Desktop JSON import: `docs/screenshots/kuiz-library.png`

## Deployment

Local:

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm audit
npm run validate:pack
npm run test:run
npm run build
npm run e2e
```

Netlify:

```text
Build command: npm run build
Publish directory: dist
```

GitHub Pages is configured in `.github/workflows/deploy-pages.yml` and builds with `VITE_BASE=/kuiz/`.

## Known Limitations

- The bundled starter content makes the first production JavaScript chunk larger than Vite's default warning threshold. The built file is about 146 KB gzipped; future optimization can lazy-load `content-packs/starter.core.v1.json`.
- The service worker caches the app shell and same-origin assets after first load. Navigations now check the network first, but the app does not yet provide a dedicated in-app offline status indicator.
- Browser speech quality depends on the user's installed Korean voices.
