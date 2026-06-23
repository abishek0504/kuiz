# Kuiz Cursor Handoff

This file is the source of truth for the next implementation pass. It is intentionally explicit so Cursor does not need to infer product intent from old screenshots, old HTML exports, or chat history.

## Repository

- Local path: `C:\Users\abish\Documents\GitHub\kuiz` (canonical); legacy Codex copy at `C:\Users\abish\Documents\Codex\2026-06-19\new-chat`
- Remote: `https://github.com/abishek0504/kuiz`
- Main branch: `main`
- Live Pages URL: `https://abishek0504.github.io/kuiz/`
- Cache-busted live URL pattern: `https://abishek0504.github.io/kuiz/?v=<short-commit-sha>`
- Framework: React 18 + Vite + TypeScript
- Storage: IndexedDB through Dexie
- Content schema: `kuiz-pack@1`
- Service worker cache after this handoff: `kuiz-app-v8`

## Current Product State

Kuiz is now a mobile-first, local-first Korean practice app, not a raw flashcard app. It has:

- A starter content pack with 524 entries and 505 exercises.
- Learner-facing focus lanes: `All`, `Vocab`, `Numbers · time`, `Grammar`, `Particles`, `Connectors`, `Mixed`.
- Quiz controls: **Focus** (topic), **Session** (`Recommended` / `Practice` / `Review`), **Format** (`MCQ`, `Blank`, `Listen`, etc.). Listening and sentence production are format filters only — not duplicate session modes.
- Session intent selector: recommended, practice, review, sentence, listening.
- Separate question-type selector: all types, multiple choice, fill blank, build, fix, dialogue, reading, listening.
- Dedicated Vocab Cards type and a narrowed vocab focus so vocabulary practice stays word/phrase-meaning oriented.
- Korean-only audio controls. Pre-answer audio is hidden for non-listening tasks so audio does not reveal ordinary answers.
- Flexible answer checking for typed Korean where particles mark roles and the final predicate remains fixed. Time/place/object chunks can move before the verb when they keep their particles.
- Persistent quiz state across bottom-tab navigation.
- Mini-session progression through unseen exercises. Completing a 10-item set now builds the next unseen batch instead of looping the same first 10.
- `Try similar one` now prefers generated sentence variants for supported sentence-like tasks, then falls back to similar unseen/out-of-session exercises.
- Generated variants are runtime-only and persist in the active quiz session state; they do not write generated content into IndexedDB content packs.
- Feedback includes a collapsed `Show translation` option when English support exists.
- Mini-session completion shows an explicit summary panel with Continue next 10, Review missed, and Change focus/type.
- Import preview, quality gates, duplicate detection, and transactional merge for JSON lesson updates.
- Local persistence for review state, mistake tags, production/reception accuracy, settings, and backups.
- PWA app shell for offline use after first load.

## Do Not Undo

Do not revert or weaken these files without replacing the behavior with something better:

- `src/features/quiz/QuizScreen.tsx`
  - Owns focus/type filtering, quiz state persistence, mini-session planning, similar-question movement, typed answer persistence, feedback rendering, and audio visibility.
  - The local-storage key is intentionally `kuiz.quizSession.v5` to invalidate older looping session plans and older pre-variant session state.
  - `seenExerciseIds` is intentionally persisted so completed sessions advance through the filtered pool.
  - Text input writes immediately to persisted state so tab switching does not lose in-progress typed answers.
- `e2e/quiz-mcq.spec.ts`
  - Covers MCQ answer/Next, bottom-tab persistence, fresh mini-session batches, and `Try similar one`.
- `public/sw.js`
  - Cache is intentionally `kuiz-app-v8`.
  - Navigation is network-first so mobile Safari is less likely to stay stuck on a stale bundle.
- `src/pwa/serviceWorker.test.ts`
  - Must match the service worker cache name.
- `playwright.config.ts`
  - CI retries and reduced workers are intentional because GitHub-hosted browser E2E was flaky under full parallelism.
- `docs/FINAL_REPORT.md`
  - Keep this honest. Do not claim native-speaker verification unless it actually happens.
- `docs/LEARNING_DESIGN.md`
  - Treat this as the product contract for learning design.

## User Complaints Already Addressed

These were directly fixed in the current code:

- Buttons should not be pre-highlighted incorrectly.
- The mobile header should stay compact.
- Audio should not reveal ordinary non-listening answers.
- Focus selection and question type selection are separate.
- Multiple-choice-only practice is available through the type selector.
- Korean typed answer checking should accept natural time/place word-order swaps when particles preserve the roles and the verb remains at the end.
- Switching bottom tabs should not restart the quiz or clear typed input.
- Finishing a mini-session should not restart the same 10 cards.
- `Try similar one` should not just show the exact same exercise again.
- Vocab focus should not show broad grammar or scenario tasks just because they contain vocab tags.
- Multi-blank particle answers such as `부터 까지` should be accepted when the prompt asks for blank-only particles.

## Important User Correction

Do not create fake "combination grammar rules" such as "place + time + object + verb ending" as if they are one grammar point.

Correct model:

- `에서` is its own rule: action location.
- `에` is its own rule: time/destination/existence depending on context.
- `을/를` is its own rule: object.
- `아/어요` is its own rule: polite present ending.
- A full sentence that uses several of these together is sentence practice, mixed practice, or scenario practice, not a new combined grammar rule.

If the UI shows a sentence task, label it as sentence production or mixed practice. If the rule library shows grammar/particle content, keep each rule separate.

## Required Verification Commands

Run these before every commit that changes product behavior:

```bash
npm audit
npm run validate:pack
npm run test:run
npm run build
npm run e2e
git diff --check
```

Expected current results after this handoff:

- `npm audit`: 0 vulnerabilities.
- `npm run validate:pack`: starter pack validates with 505 exercises.
- `npm run test:run`: 22 test files, 91 tests passing.
- `npm run build`: succeeds, with the known Vite chunk-size warning.
- `npm run e2e`: 46 Playwright runs (23 specs × desktop Chromium + iPhone viewport).

If local command shims are missing because `node_modules` was interrupted, reinstall dependencies first:

```bash
npm install
```

## Current Known Limitation

The current implementation now includes a first-pass variant engine. It prevents exact session looping by selecting fresh exercises from the existing content pool and can generate live variants for recognized beginner sentence families. For example, if the learner practices "I read a book at the library at 3 o'clock," follow-up practice can vary time, place, object, person, and verb within valid Korean constraints:

- `저는 세 시에 도서관에서 책을 읽어요.`
- `저는 네 시에 카페에서 친구를 만나요.`
- `동생은 아침에 학교에서 숙제를 해요.`

- The variant engine now uses combinatorial slot banks in `src/engine/variantSlots.ts` for time ranges, place-time-object sentences, directions, and routine connectors. Further scenario families (cafe, library, gift exchange, etc.) can extend the same module.
- Session completion UI is implemented in `src/features/quiz/SessionCompletePanel.tsx`.
- Vocab filtering lives in `src/engine/vocabPractice.ts` with runtime vocab cards for flashcard density.
- Native-speaker verification of generated variants and expanded content has not been performed.

## Next Implementation Pass (remaining)

### 1. Expand the Variant Engine — partially done

Implemented: `src/engine/variantSlots.ts`, combinatorial banks, 20+ unique variants per family, tests in `variantSlots.test.ts` and `variants.test.ts`.

Remaining:

```ts
type KoreanSlot =
  | { role: "subject"; korean: string; english: string; particle?: "은" | "는" | "이" | "가" }
  | { role: "time"; korean: string; english: string; particle: "에" }
  | { role: "place"; korean: string; english: string; particle: "에서" | "에" }
  | { role: "object"; korean: string; english: string; particle: "을" | "를" }
  | { role: "recipient"; korean: string; english: string; particle: "에게" | "한테" }
  | { role: "source"; korean: string; english: string; particle: "에서" | "에게서" | "한테서" }
  | { role: "predicate"; korean: string; english: string; tense: "present" | "past" | "future" };

type KoreanSentenceVariant = {
  korean: string;
  english: string;
  slots: KoreanSlot[];
  acceptedOrders?: Array<Array<KoreanSlot["role"]>>;
  tags: string[];
};
```

Rules:

- Do not separate a particle from its noun.
- Verb/predicate stays sentence-final for beginner production checks.
- Time and place may swap when both are particle-marked.
- Object can move before/after time/place only if the resulting Korean remains natural for the specific sentence.
- Do not generate sentences where the English prompt and Korean answer diverge.
- Do not create romanization.
- Do not produce bracket templates like `[장소]에서 [시간]에`.

Tests:

- Generates at least 20 unique variants from a scenario template without duplicate normalized Korean.
- Preserves required particles for each role.
- Accepts time/place swaps in answer checking.
- Rejects variants where predicate is not final.
- Rejects variants with missing or mismatched particle roles.

### 2. Deepen Variant Coverage in `Try similar one`

Current behavior already uses generated variants first and keeps existing-exercise fallback. Improve coverage and metadata.

Implementation target:

- In `QuizScreen.tsx`, when current exercise is `sentenceBuilder`, `fillBlank`, `correction`, `roleplay`, `ordering`, `dictation`, or `listening`, keep checking whether it can generate a sibling exercise in memory and show it immediately.
- Do not persist generated variants as new content-pack exercises unless a separate import/editing workflow is added.
- Generated exercise IDs should be temporary and stable for the current session, for example `variant:<base-id>:<hash>`.
- Generated variants must still be counted as seen for the active session.

Tests:

- `Try similar one` for an eligible sentence task changes the Korean target, not only the exercise ID.
- Generated variant keeps the same grammar focus but changes at least one meaningful slot.
- Generated variant never repeats the exact same prompt/model answer pair.

### 3. Add Explicit Session Completion UI — done

Implemented in `SessionCompletePanel.tsx`, `sessionStats.ts`, quiz session key `kuiz.quizSession.v5`, and `e2e/session-complete.spec.ts`.

### 3 legacy. Session Completion UI spec (archived)

When the learner finishes item 10:

- Show `Session complete`.
- Show summary:
  - answered count
  - correct count
  - misses added to review
  - strongest lane
  - weakest lane
- Buttons:
  - `Continue next 10`
  - `Review missed`
  - `Change focus/type`

Rules:

- `Continue next 10` uses unseen exercises for the same focus/type/session intent.
- `Review missed` filters to recent incorrect items or weak review states.
- `Change focus/type` returns to the selector area without losing progress.

Tests:

- Completing a session shows the completion panel.
- Continue starts a fresh unseen batch.
- Review missed shows recent misses when available.
- No automatic wrap to first card.

### 4. Improve Content QA Around Rules vs Sentences

Audit:

- `content-packs/starter.core.v1.json`
- `scripts/expand-starter-pack.mjs`
- Any rule-library rendering code under `src/features`

Fix:

- Rule entries must be single forms/functions.
- Sentence tasks may combine multiple forms, but should be labeled as mixed/sentence/scenario practice.
- Remove or rewrite headings like "place and time together" if they imply a combined grammar rule.
- Add separate entries for `에서`, `에`, `을/를`, and endings where needed.

Quality gate:

- Add a check in `src/importExport/quality.ts` that flags grammar/particle titles containing misleading combination phrasing unless the item is explicitly a sentence/scenario exercise.

Tests:

- Starter pack does not classify mixed sentence production as grammar rule entries.
- Import quality rejects fake bracket-template rule descriptions.
- Import quality rejects a grammar rule whose explanation is only a sentence recipe.

### 5. Strengthen Typed Korean Answer Checking

Current answer checking accepts particle-marked word-order swaps before the final predicate. Extend it carefully.

Files to inspect first:

- `src/engine/answerCheck.ts`
- `src/engine/normalize.ts`
- `src/engine/sentenceBreakdown.ts`
- Existing answer-check tests.

Required behavior:

- Accept equivalent spacing around particles.
- Accept time/place order swaps.
- Accept full-sentence response when a fill blank asks for only the blank phrase and the phrase is present.
- Do not accept wrong particles.
- Do not accept changed tense/aspect.
- Do not accept changed negation.
- Do not accept changed final predicate.
- Do not accept English/romanized answers for Korean production tasks.

Tests:

- `저는 세 시에 도서관에서 책을 읽어요` equals `저는 도서관에서 세 시에 책을 읽어요`.
- `저는 도서관에 세 시에서 책을 읽어요` is rejected.
- `읽었어요` is rejected when the target is `읽어요`.
- `안 읽어요` is rejected when the target is affirmative.
- Full sentence with correct blank phrase is accepted for non-sentence fill blank.

### 6. Expand Scenario Practice Without Repetition

Add scenario banks for:

- cafe order
- library study
- gift exchange
- schedule/interview
- directions/transport
- daily routine
- hobbies/likes
- permission/necessity

Each scenario should contain:

- 1 reading or dialogue input
- 1 noticing task
- 1 MCQ with plausible same-granularity distractors
- 1 typed production task
- 1 correction task
- 1 fluency review item

Each scenario should include reusable variant slots:

- people
- places
- times
- objects
- verbs
- connectors
- particle focus

Do not manually clone the same sentence dozens of times with only IDs changed. Either write genuinely different examples or use the variant engine.

### 7. Improve Distractor Intelligence

Inspect:

- `src/engine/distractors.ts`
- `src/importExport/quality.ts`
- Existing distractor tests.

Rules:

- MCQ has exactly 4 choices.
- Exactly 1 correct answer.
- Source JSON correct answer is not first.
- Choices are same granularity.
- Full-sentence prompt gets full-sentence choices.
- Particle prompt gets particle-sized choices.
- Number/time choices stay in same number system unless the learning target is explicitly system contrast.
- Wrong choices have a concrete `why`, not "wrong" or "not correct."

Add tests:

- full sentence MCQ rejects one-word distractors.
- particle MCQ rejects sentence-length distractors.
- number MCQ rejects `1`, `2`, `3` filler.
- generic sentence distractors cannot repeat across many items.
- generated distractors include misconception labels.

### 8. Improve Mobile and iPad QA

Use Playwright screenshots for:

- `docs/screenshots/home-iphone.png`
- `docs/screenshots/home-desktop.png`
- `docs/screenshots/quiz-focus-iphone.png`
- `docs/screenshots/quiz-feedback-breakdown-iphone.png`
- `docs/screenshots/dialogue-task-iphone.png`
- `docs/screenshots/listening-task-iphone.png`
- `docs/screenshots/progress-diagnostics-iphone.png`
- `docs/screenshots/library-import-desktop.png`
- Add iPad screenshots:
  - `docs/screenshots/home-ipad.png`
  - `docs/screenshots/quiz-session-complete-ipad.png`
  - `docs/screenshots/variant-practice-ipad.png`

Manual inspection checklist:

- no raw internal tags
- no romanization in learner-facing quiz content
- no clipped chips
- no huge feedback panel taking the whole iPhone viewport
- bottom nav respects safe area
- header stays compact
- type selector is reachable on iPhone
- iPad layout is not sparse or awkward
- audio buttons only appear before answer for listening/dictation

### 9. Keep Documentation Recruiter-Ready

Update after the next implementation pass:

- `README.md`
  - Add expanded variant coverage and session completion UI.
  - Keep screenshot table current.
  - Keep setup/deploy commands simple.
- `docs/FINAL_REPORT.md`
  - Update exact test counts.
  - List new implementation.
  - List known limitations honestly.
- `docs/LEARNING_DESIGN.md`
  - Add the rule-vs-sentence distinction.
  - Add variant-generation constraints.

Do not overclaim:

- Say "ready for native-speaker QA" unless a native speaker has reviewed it.
- Do not claim speech recognition or speaking assessment exists.
- Do not claim generated variants are native-natural unless reviewed.

## Suggested Commit Plan

Use small commits:

1. `Expand Korean sentence variants`
2. `Deepen generated similar practice`
3. `Add explicit quiz session completion`
4. `Separate grammar rules from mixed sentence practice`
5. `Expand scenario practice coverage`
6. `Strengthen distractor and import quality gates`
7. `Update mobile QA screenshots and reports`

Run the full quality gate before each push if possible. At minimum, run targeted unit tests before intermediate commits and the full gate before the final push.

## Final Acceptance Checklist For Cursor

Before handing back:

- The app builds with `npm run build`.
- Unit tests pass with coverage.
- Playwright E2E passes locally.
- GitHub Actions CI passes after push.
- GitHub Pages deploy passes after push.
- Live Pages URL works with `?v=<short-sha>`.
- iPhone live site does not show stale raw-tag UI.
- Finishing a mini-session does not replay the same 10.
- `Try similar one` changes meaningful sentence content when variant metadata exists.
- Type selector allows multiple-choice-only practice.
- Fill-blank instructions make clear whether to type the blank or full sentence.
- Audio does not give away non-listening answers.
- Korean word-order flexibility is accepted where particles preserve roles.
- Progress and mistakes still persist locally.
- Importing equivalent lesson JSON updates/skips instead of duplicating.
