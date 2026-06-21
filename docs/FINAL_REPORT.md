# Kuiz Final Report

## Implemented

- Built a complete React + Vite + TypeScript app from scratch; old HTML versions were used only as content and behavior references.
- Renamed and branded the app as Kuiz.
- Added a validated `kuiz-pack@1` seed pack from the lesson PDF and supporting lesson references:
  - 1 starter pack
  - 374 entries
  - 304 exercises
  - 41 particle entries
  - 310 vocabulary entries
  - 23 grammar entries
- Covered particles, vocab, numbers, native/Sino number practice, time/date expressions, routine language, progressive grammar, purpose/necessity patterns, corrections, conjugations, and sentence production.
- Implemented quiz modes for multiple choice, fill blank, sentence builder, corrections, and conjugation practice.
- Separated `Skip` and `Next` behavior: `Skip` is available before grading; `Next` appears only after answering or showing the answer.
- Fixed mobile chip selected state so buttons do not stay incorrectly pre-highlighted.
- Replaced raw Study Focus tags with learner-facing Korean category lanes: 전체, 어휘, 숫자·시간, 문법, 조사, 연결어, 혼합.
- Split `전체` from `혼합`: 전체 clears filters for the full deck; 혼합 targets integrated sentence building, correction, and multi-category sentence practice.
- Mapped quiz and pack metadata tags through Korean display labels so internal slugs like `sino-numbers` are not shown to learners.
- Added deterministic multiple-choice ordering so stored content can no longer make the correct answer appear first on every question.
- Revised number MCQs so distractors are plausible same-system nearby numbers instead of obvious 1/2/3 filler choices.
- Rewrote full-sentence Korean MCQs so answer choices are full-sentence alternatives rather than fragments like "am studying."
- Reworked placeholder-heavy grammar references into readable Korean example patterns with particle roles explained.
- Added `docs/LEARNING_DESIGN.md` to ground future product work in CEFR, ACTFL, retrieval-practice research, and Nation's four-strands model.
- Kept full particle mode enabled by default with strict particle checking.
- Added Korean-only speech synthesis filtering and `ko-KR` speech defaults.
- Added JSON import/update workflow with schema validation, duplicate detection, create/update/skip/conflict preview, rollback snapshots, and transactional merge.
- Added `Copy ChatGPT update prompt` so future lessons can be converted into valid `kuiz-pack@1` JSON.
- Added local-first persistence for settings, review state, mistakes/lapses, import history, and backups via IndexedDB.
- Added production PWA basics: web manifest, icon, and service worker for offline app-shell use after first load.
- Generated Netlify-ready production output in `dist/` with `npm run build`.

## Tested

- `npm audit`: 0 vulnerabilities.
- `npm run validate:pack`: starter pack parses and validates.
- `npm run test:run`: 10 test files, 27 tests passing.
- `npm run build`: production build succeeds.
- `npm run e2e`: 12 Playwright tests passing across desktop Chromium and iPhone viewport.

Coverage includes:

- Quiz flow: answer, feedback, Next button, Skip behavior.
- Multiple choice UI state and non-sticky pre-highlight behavior.
- Import validation and duplicate-detection preview.
- Particle strictness and full-particle defaults.
- Distractor homogeneity.
- Korean Study Focus category labels with no raw `sino-numbers` or `native-numbers` text on Home.
- Separate mixed lane visible on Home.
- Deterministic MCQ choice ordering with the correct answer not locked to the first position.
- Content-pack acceptance checks:
  - no duplicate dedupe keys
  - sentence MCQs do not mix one-word choices with sentence choices
  - particle MCQs use particle-sized choices
  - audio text fields are Korean-only
  - starter pack covers lesson-PDF scope
  - number MCQs avoid low-number filler distractors
  - grammar references avoid bracket-placeholder templates
  - full-sentence Korean MCQ prompts use full-sentence choices
- Mobile layout checks for iPhone viewport.

## Verification Screenshots

- Desktop Home focus categories: `docs/screenshots/home-desktop.png`
- iPhone Home focus categories: `docs/screenshots/home-iphone.png`
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

- The bundled starter content makes the first production JavaScript chunk larger than Vite's default warning threshold. The built file is about 135 KB gzipped; future optimization can lazy-load `content-packs/starter.core.v1.json`.
- The service worker caches the app shell and same-origin assets after first load. It does not yet provide a dedicated in-app offline status indicator.
- Browser speech quality depends on the user's installed Korean voices.
