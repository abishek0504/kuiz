# Kuiz Final Report

## Implemented

- Built a complete React + Vite + TypeScript app from scratch; old HTML versions were used only as content and behavior references.
- Renamed and branded the app as Kuiz.
- Added a validated `kuiz-pack@1` seed pack from the lesson PDF and supporting lesson references:
  - 1 starter pack
  - 524 entries
  - 505 exercises
  - 51 particle entries
  - 420 vocabulary entries
  - 51 grammar entries
- Covered particles, vocab, numbers, native/Sino number practice, time/date expressions, routine language, progressive grammar, purpose/necessity patterns, corrections, conjugations, sentence production, dialogue, reading, listening, dictation, ordering, roleplay, and minimal-pair practice.
- Extended `kuiz-pack@1` in a backward-compatible way with optional skill, level, scenario, register, communicativeGoal, and rubric metadata.
- Added new exercise types: `dialogue`, `reading`, `listening`, `dictation`, `roleplay`, `ordering`, and `minimalPair`.
- Replaced low-level visible Quiz modes with learner-facing session intents: recommended, practice, review, sentence, and listening.
- Added a separate question-type selector for all types, vocab cards, multiple choice, fill blank, build, fix, dialogue, reading, and listening, so focus category and quiz format are no longer conflated.
- Added a dedicated Vocab Cards type and narrowed the vocab focus so it prioritizes word/phrase meaning practice instead of mixed grammar tasks that only happen to contain vocab tags.
- Added `Recommended` as the default Quiz session mode so learners move across scenario input, form noticing, production, repair, due review, and fluency instead of staying in MCQs by default.
- Added a guided Practice Path on Home so sessions move from meaning input, to form noticing, to integrated production, then fluency review.
- Added a Recommended next card on Home that starts broad for new learners and later targets categories with due or weak review pressure.
- Added Progress focus diagnostics that rank learner-facing categories by due reviews, weak answers, fresh items, logged misses, and production/reception accuracy.
- Added adaptive Smart order in Quiz so due reviews, weak items, and logged mistakes are prioritized before new/future-stable material.
- Added Korean sentence-role breakdowns in quiz feedback for common particles, time/place markers, source/recipient markers, connectors, objects, and predicates.
- Added misconception feedback with a `What changed?` line and a `Try similar one` path after answering.
- Added answer guidance for typed tasks so fill blanks, builders, corrections, dictation, dialogue, and reading tasks tell the learner what shape of answer is expected.
- Added collapsed `Show translation` feedback when English support is available from target meanings, prompt translations, dialogue translations, reading translations, or generated variants.
- Improved Korean answer checking so strict mode still preserves particles, but accepts particle-spacing variants and natural particle-marked word-order swaps before the final verb, such as time/place order changes.
- Improved multi-blank particle checking so blank-only answers such as `부터 까지` are accepted for prompts like `아침___ 저녁___ 일해요.`.
- Added full-sentence acceptance for non-sentence fill blanks when the full response contains the correct blank phrase.
- Fixed session advancement so `Next` and `Skip` move to the next planned item instead of bouncing between the first two planned exercises.
- Persisted active Quiz state across bottom-tab navigation, including mode, question type, active item, typed input, selected choice, feedback, and planned session order.
- Fixed mini-session completion so finishing the 10th question builds a fresh batch from unseen exercises instead of wrapping back to the same first question.
- Updated `Try similar one` to prefer genuinely similar unseen/out-of-session exercises, then replace the current item in the active plan when needed.
- Added an in-memory sentence variant engine for common beginner patterns, including time ranges, place-time-object sentences, directions, and routine connectors. Variants change meaningful slots while preserving particles and final predicates, and they do not pollute the installed content pack.
- Reduced within-session repetition by avoiding duplicate normalized Korean model answers across task types in recommended planning.
- Updated Smart order summaries so unseen initial cards are counted as new/fresh work, not overdue reviews.
- Separated `Skip` and `Next` behavior: `Skip` is available before grading; `Next` appears only after answering or showing the answer.
- Fixed mobile chip selected state so buttons do not stay incorrectly pre-highlighted.
- Replaced raw Study Focus tags with learner-facing Korean category lanes: 전체, 어휘, 숫자·시간, 문법, 조사, 연결어, 혼합.
- Split `전체` from `혼합`: 전체 clears filters for the full deck; 혼합 targets integrated sentence building, correction, and multi-category sentence practice.
- Mapped quiz and pack metadata tags through Korean display labels so internal slugs like `sino-numbers` are not shown to learners.
- Added learner-facing Korean focus categories directly to the Quiz screen, with horizontal mobile scrolling instead of a raw tag cloud.
- Reordered the starter pack MCQ source data so the correct answer is not stored as the first visible choice.
- Added deterministic multiple-choice ordering in the UI so imported content is also protected from answer-position leakage.
- Hid pre-answer audio controls for non-listening tasks so audio no longer gives away ordinary MCQ, fill-blank, builder, correction, ordering, or roleplay answers.
- Revised number MCQs so distractors are plausible same-system nearby numbers instead of obvious 1/2/3 filler choices.
- Rewrote full-sentence Korean MCQs so answer choices are full-sentence alternatives rather than fragments like "am studying."
- Rewrote remaining legacy sentence MCQs that reused generic fallback choices like "I like dogs," "I like cats," and "I go to the cafe."
- Added scenario-style mixed exercises for integrated sentence building, particle repair, connector repair, time ranges, purpose, and source/recipient distinctions.
- Reworked placeholder-heavy grammar references into readable Korean example patterns with particle roles explained.
- Added `docs/LEARNING_DESIGN.md` to ground future product work in CEFR, ACTFL, retrieval-practice research, and Nation's four-strands model.
- Kept full particle mode enabled by default with strict particle checking.
- Added Korean-only speech synthesis filtering and `ko-KR` speech defaults.
- Added JSON import/update workflow with schema validation, quality validation, duplicate detection, create/update/skip/conflict preview, rollback snapshots, and transactional merge.
- Added import quality checks for Korean-only audio, non-revealing MCQ source order, no bare numeric filler, same-granularity sentence choices, misconception notes on distractors, repeated generic sentence distractors, bracket-template rejection, replacement-marker rejection, and production/repair tasks for grammar or particle lessons.
- Strengthened duplicate detection with semantic matching over normalized Korean text, exercise type, prompt, and model/correct answer so revised lesson packs update instead of duplicating.
- Expanded import preview with type counts, major-lane counts, update/skip/conflict samples, and copyable validation errors.
- Added `Copy ChatGPT update prompt` so future lessons can be converted into valid `kuiz-pack@1` JSON, with the prompt now reflecting the same quality gates as the parser.
- Strengthened the authoring prompt and import quality gate to reject fake combined grammar rules such as treating place + time + object + ending as one rule; those belong in mixed sentence practice while particles and endings remain separate rules.
- Added a reproducible starter-pack expansion script at `scripts/expand-starter-pack.mjs`.
- Optimized first-run starter seeding so empty databases install the large static pack directly without import snapshots or unnecessary initial review-state rows.
- Added local-first persistence for settings, review state, mistake tags, last mistake reasons, production/reception accuracy, import history, and backups via IndexedDB.
- Added production PWA basics: web manifest, icon, and a network-first navigation service worker for offline app-shell use after first load without trapping phones on stale UI.
- Added a compact in-app offline indicator when the browser loses network access.
- Bumped the app-shell cache to `kuiz-app-v7` and added service-worker skip-waiting/reload handling so newly deployed builds replace stale mobile tabs more aggressively.
- Generated Netlify-ready production output in `dist/` with `npm run build`.

## Tested

- `npm audit`: 0 vulnerabilities.
- `npm run validate:pack`: starter pack parses and validates with 505 exercises.
- `npm run test:run`: 17 test files, 65 tests passing.
- `npm run build`: production build succeeds.
- `npm run e2e`: 38 Playwright tests passing across desktop Chromium and iPhone viewport.

Coverage includes:

- Quiz flow: answer, feedback, Next button, Skip behavior.
- Question-type selector for direct multiple-choice practice.
- Vocab Cards type and vocab focus show word/translation practice rather than broad grammar tasks.
- Quiz session state persists after switching bottom tabs on desktop and iPhone viewport.
- Completing a 10-item mini-session advances to a fresh batch instead of restarting the same 10.
- `Try similar one` moves to a different exercise and generated variants change meaningful Korean sentence content for supported sentence-like patterns.
- Multi-blank particle items accept blank-only answers such as `부터 까지`.
- Feedback can reveal a translation after showing or answering when translation support exists.
- Multiple choice UI state and non-sticky pre-highlight behavior.
- Non-listening task audio controls do not reveal the answer before grading.
- Import validation and duplicate-detection preview.
- Particle strictness and full-particle defaults.
- Flexible Korean word order for particle-marked time/place/object chunks while keeping the final verb fixed.
- Full-sentence responses for fill blanks when the expected blank phrase is present.
- Distractor homogeneity.
- Korean Study Focus category labels with no raw `sino-numbers` or `native-numbers` text on Home.
- Korean Quiz focus category labels with no raw `sino-numbers` or `native-numbers` text in Quiz.
- Regression checks against raw focus-button labels such as `particles`, `vocab`, `ayo`, `bakke`, `buteo`, and `an`.
- Sentence breakdown feedback visible after answering or showing a Korean sentence task.
- Dialogue tasks render and can be answered.
- Listening/dictation flow exposes Korean-only audio practice.
- Separate mixed lane visible on Home.
- Practice Path opens mixed balanced production.
- Recommended mode is selected by default and starts with scenario input on desktop and iPhone viewports.
- Home exposes a Recommended next practice card with direct start behavior.
- Progress exposes focus diagnostics by category.
- Adaptive Smart order summary is visible in Quiz.
- Recommendation engine starts new learners with the full balanced deck and targets weak/due learner-facing categories after review history exists.
- Session planner interleaves recognition, blanks, production, repair, and conjugation when those task types are available.
- Recommended session planner avoids repeating the same normalized Korean answer across task types.
- Deterministic MCQ choice ordering with the correct answer not locked to the first position.
- Starter MCQ source data does not put the correct answer first.
- Import parser rejects low-quality lesson JSON before preview/merge.
- Import parser rejects fake combined grammar rules that should be separate grammar/particle entries plus mixed sentence practice.
- Starter pack text has a guard against replacement-marker question marks in lesson titles, prompts, explanations, and feedback.
- Service worker update behavior prefers the network for page navigations, falls back to cache offline, and activates fresh workers without waiting on stale tabs.
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
  - starter pack includes at least 20 dialogue tasks
  - starter pack includes at least 20 reading/listening tasks
  - starter pack includes at least 20 dictation/ordering tasks
- Mobile layout checks for iPhone viewport.

## Verification Screenshots

- Desktop Home focus categories: `docs/screenshots/home-desktop.png`
- iPhone Home focus categories: `docs/screenshots/home-iphone.png`
- Desktop Quiz focus categories: `docs/screenshots/quiz-focus-desktop.png`
- iPhone Quiz focus categories: `docs/screenshots/quiz-focus-iphone.png`
- iPhone quiz feedback sentence breakdown: `docs/screenshots/quiz-feedback-breakdown-iphone.png`
- Desktop Progress diagnostics: `docs/screenshots/progress-diagnostics-desktop.png`
- iPhone Progress diagnostics: `docs/screenshots/progress-diagnostics-iphone.png`
- iPhone dialogue task: `docs/screenshots/dialogue-task-iphone.png`
- iPhone listening task: `docs/screenshots/listening-task-iphone.png`
- Desktop import preview: `docs/screenshots/library-import-desktop.png`
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

- The bundled starter content and variant logic make the first production JavaScript chunk larger than Vite's default warning threshold. The built file is about 179 KB gzipped; future optimization can lazy-load `content-packs/starter.core.v1.json`.
- The variant engine currently covers high-value beginner sentence families, not every possible Korean sentence pattern.
- The expanded Korean content is designed for native-speaker review, but it has not been native-speaker verified.
- Browser speech quality depends on the user's installed Korean voices.
