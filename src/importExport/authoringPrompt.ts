import type { AuthoringSnapshot } from "../schemas/snapshot";

export const authoringPromptVersion = "kuiz-authoring@2";

export function buildAuthoringPrompt(snapshot: AuthoringSnapshot): string {
  return `${authoringPromptVersion}

You are producing one import-ready JSON content-pack update for Kuiz, an offline Korean study app.

OUTPUT CONTRACT
- Return one JSON object only. No Markdown, code fence, preface, commentary, or trailing text.
- The object must validate against schema "kuiz-pack@1".
- Use Canadian English for explanations and natural polite Korean unless the source teaches another register.
- Do not invent a lesson title, rule, correction, or vocabulary item when the source is unclear. Mark reasonable teaching inferences with "inferred": true.

SOURCE REVIEW, INCLUDING VISUAL NOTES
- Inspect every supplied page or image visually. Do not rely only on extracted PDF text or OCR.
- Include handwritten additions, corrections, arrows, crossed-out forms, colour annotations, worked answers, captions, word banks, answer keys, and content implied by contrasts between examples.
- A handwritten correction overrides an uncorrected worksheet blank. Preserve the corrected Korean, not the learner's earlier error.
- Use page numbers or precise image labels in sourceRefs.locator. Separate printed, handwritten, and inferred sources when that distinction matters.
- Build a private coverage checklist before writing JSON: vocabulary, rules, formation, irregulars, contrasts, register/naturalness, example sentences, corrections, speaking prompts, pronunciation, numbers/counters, dates/times, and answer-key evidence. Do not include the checklist in the response.

TOP-LEVEL SHAPE
{
  "schema": "kuiz-pack@1",
  "pack": {
    "packId": "user.lesson.<stable-topic>.v1",
    "version": "1.0.0",
    "title": "Human readable title",
    "locale": "en-CA",
    "createdAt": "YYYY-MM-DD",
    "appMinVersion": "1.0.0",
    "includes": ["vocab", "grammar", "particles"]
  },
  "sourceRefs": [
    { "sourceId": "lesson-pages-1-4", "label": "Lesson notes", "locator": "PDF pages 1-4", "inferred": false }
  ],
  "vocab": [],
  "particles": [],
  "grammar": [],
  "distractorGroups": [],
  "exercises": []
}

UPDATE BEHAVIOUR
- CURRENT_SNAPSHOT.installedPacks lists installed pack IDs and versions. Continue the same pack only when the new material genuinely revises it: reuse packId, keep stable item dedupeKeys, and increment the semantic version.
- Otherwise create a new stable packId. Never use a date or random suffix as the only topic identity.
- Deduplicate against CURRENT_SNAPSHOT.dedupeKeys. Do not recreate an installed item under a slightly different key.
- Every entry and exercise needs a stable id, stable dedupeKey, tags, sourceRefIds, and inferred.
- sourceRefIds must point to sourceRefs in this pack.

ENTRY CONTRACTS
- vocab: { "id", "dedupeKey", "kind":"vocab", "ko", "en", "pos":"noun|verb|adjective|adverb|expression", "tags", "sourceRefIds", "inferred", "examples":[{"ko","en","audioText","note"}], "notes"? }
- particle: { "id", "dedupeKey", "kind":"particle", "form", "forms", "meaning", "usage", "contrastsWith", "tags", "sourceRefIds", "inferred", "examples", "notes"? }
- grammar: { "id", "dedupeKey", "kind":"grammar", "title", "pattern", "meaning", "formation", "tags", "sourceRefIds", "inferred", "examples", "pitfalls", "notes"? }
- Use Korean-only audioText. Romanization is permitted only in vocab.romanization as optional display support.
- Keep particles, verb endings, pronunciation rules, and sentence frames as separate teaching entries. A sentence containing place + time + object + verb is mixed practice, not one grammar rule.
- Record irregular formation and 받침 rules explicitly when the notes teach them.

EXERCISE BASE
Every exercise needs { "id", "dedupeKey", "type", "tags", "sourceRefIds", "inferred", "prompt":{"stem", "stemKo"?, "stemEn"?, "audioText"?, "context"?} }.
Optional learning metadata: "skill":"reception|production|interaction|mediation|languageFocus|fluency", "level":"A0|A1|A2|TOPIK1|TOPIK2", "scenario", "register":"casual|polite|formal|neutral", "communicativeGoal", "rubric", "explanation", "naturalnessNote", "particleNote".

VALID TYPE DETAILS
- mcq: add "choiceKind":"particle|full-sentence-meaning|phrase-meaning|grammar-form|naturalness|connector|vocab" and exactly four choices [{"id":"a","text":"...","isCorrect":false,"why":"specific misconception"}]. Exactly one is correct.
- fillBlank: add "answerPresentation":"particle|word|phrase|sentence", "acceptedAnswers", and "modelAnswer".
- sentenceBuilder: add "tokens", "targetMeaning", "acceptedAnswers", and "modelAnswer".
- correction: add "incorrect", "corrected", and "acceptedAnswers".
- conjugation: add "dictionaryForm", "targetFormLabel", "acceptedAnswers", and "modelAnswer".
- dialogue: add 2-5 "turns" [{"speaker","ko","en"?,"audioText"?}], "question", "acceptedAnswers", and "modelAnswer".
- reading: add "passage":{"title"?,"ko","en"?}, "question", "acceptedAnswers", and "modelAnswer".
- listening: put hidden Korean in prompt.audioText and add "question", "acceptedAnswers", and "modelAnswer".
- dictation: put hidden Korean in prompt.audioText and add "acceptedAnswers" and "modelAnswer".
- roleplay: describe the situation in prompt.context and add "acceptedAnswers" and "modelAnswer".
- ordering: add "chunks", "acceptedAnswers", and "modelAnswer".
- minimalPair: add "contrast", "choiceKind":"particle|grammar-form|naturalness|connector", and exactly four misconception-labelled choices.
- acceptedAnswers is always {"strict":[...],"relaxed":[...],"regex":[],"notes"?:"..."}.

QUESTION INTELLIGENCE AND DIFFICULTY
- Questions must test meaning, form, use, and production. Do not turn the lesson into a list of obvious translation cards.
- For each new grammar, particle, connector, number-system rule, or pronunciation contrast, include input, noticing, controlled production, correction/repair, and contextual fluency practice when the source supports it.
- Mix closely related choices. Distractors must reflect plausible learner errors from the notes, such as 에 vs 에서, 은/는 vs 이/가 vs 을/를, native vs Sino numbers, contracted vs uncontracted counter forms, tense, 받침, irregular formation, register, or a near meaning.
- Never use unrelated answer choices merely to reach four options. Every wrong MCQ choice needs a specific why field.
- Source order must not put the correct MCQ choice first. The app will shuffle again at display time.
- Full-sentence prompts require full-sentence choices. A whole Korean sentence must not have one-word English answer choices.
- Do not create 100 nearly identical questions by counting from 1 to 100. Sample number recognition, then use prices, ages, people, objects, phone numbers, dates, hours, and minutes in context.
- Avoid repeated stems and repeated model answers across modalities unless the repetition deliberately changes the skill, such as listening followed later by production.
- Each scenario cluster should contain meaning input, form contrast, production, repair, and a short review, with varied subjects, places, times, objects, and actions that remain semantically compatible.
- Do not combine arbitrary objects and predicates. 책을 읽어요, 커피를 마셔요, 숙제를 해요, and 친구를 만나요 are compatible. 책을 마셔요 is not.
- For each new vocab item, rely on a vocabulary exercise only when it tests that word or phrase directly. Do not label a grammar question as vocab.
- Include natural alternate answers only when meaning, tense, negation, register, particle roles, and the final predicate remain correct.
- Multi-blank fillBlank acceptedAnswers must include the blank-only sequence. Example: 아침___ 저녁___ 일해요 accepts "부터 까지" and may also accept the full sentence.
- Provide stemEn, targetMeaning, passage.en, or turn.en when available so feedback can reveal a translation after answering.
- Do not use placeholder brackets such as [place] or [verb]. Use concrete Korean.

FINAL SILENT AUDIT
Before responding, verify: valid JSON; unique ids and dedupeKeys; exact required fields; four homogeneous MCQ choices; correct choice not first; Korean-only audioText; no bare numeric filler; no one-word answers to sentence-meaning questions; no MCQ-only grammar cluster; no placeholder brackets; no incompatible object-predicate pair; no missing handwritten correction; no missed answer-key nuance; no duplicate installed content; and no missing blank-only accepted answer.

CURRENT_SNAPSHOT:
${JSON.stringify(snapshot)}

NEW_LESSON_MATERIAL:
Attach or paste the new lesson PDF, screenshots, handwritten notes, worksheet, answer key, or transcript after this prompt.`;
}
