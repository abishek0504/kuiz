import type { AuthoringSnapshot } from "../schemas/snapshot";

export function buildAuthoringPrompt(snapshot: AuthoringSnapshot): string {
  return `You are creating a JSON content-pack update for Kuiz, a Korean study app.

Return JSON only. Do not return markdown, prose, comments, or code fences.

The JSON must follow schema "kuiz-pack@1" and use this top-level shape:

{
  "schema": "kuiz-pack@1",
  "pack": {
    "packId": "user.lesson.<short-topic>.v1",
    "version": "1.0.0",
    "title": "Human readable title",
    "locale": "en-CA",
    "createdAt": "YYYY-MM-DD",
    "appMinVersion": "1.0.0",
    "includes": ["particles", "vocab", "grammar"]
  },
  "sourceRefs": [
    { "sourceId": "lesson-notes", "label": "Lesson notes", "inferred": false }
  ],
  "vocab": [],
  "particles": [],
  "grammar": [],
  "distractorGroups": [],
  "exercises": []
}

Rules:
- Deduplicate against CURRENT_SNAPSHOT.dedupeKeys.
- Every vocab, particle, grammar item, and exercise must have a stable "dedupeKey".
- Use content types, tags, and reusable grammar concepts. Do not label everything by lesson/day.
- Include sourceRefIds on every generated item.
- Use Korean-only "audioText" wherever audio is useful.
- Do not use romanization except an optional display-only vocab "romanization" field.
- Mark "inferred": true when something is reasonably inferred but not explicitly visible.
- Prefer scenario practice over trivial translation drills.
- Still create real vocabulary-card practice when the lesson introduces words. Vocab practice should be word/phrase <-> meaning, not grammar or scenario tasks merely tagged "vocab".
- Keep grammar and particles as separate rule/function entries. Do not invent combined grammar rules such as "place + time + object + verb ending"; that is sentence practice, not a grammar rule.
- If a sentence uses multiple forms, tag the exercise as mixed/sentence/scenario, but create separate grammar or particle entries for each rule that is actually being taught.
- Every exercise may include optional "skill", "level", "scenario", "register", "communicativeGoal", and "rubric".
- Valid skills: "reception", "production", "interaction", "mediation", "languageFocus", "fluency".
- Valid levels: "A0", "A1", "A2", "TOPIK1", "TOPIK2".
- Valid registers: "casual", "polite", "formal", "neutral".
- MCQ options must be homogeneous: particle options with particles, sentence meanings with sentence meanings, grammar forms with grammar forms.
- MCQs must use exactly four choices, and the first choice must not be the correct answer.
- Every incorrect MCQ choice needs a "why" field that names the learner misconception.
- Never use bare numeric filler choices such as "1", "2", or "3".
- Full-sentence MCQs must use full-sentence choices, never one-word translation choices.
- Fill blanks, corrections, conjugations, and sentence builders need acceptedAnswers and model answers.
- New exercise types are allowed: "dialogue", "reading", "listening", "dictation", "roleplay", "ordering", and "minimalPair".
- dialogue: include 2-5 turns as [{ "speaker": "A", "ko": "...", "en": "...", "audioText": "..." }], plus "question", acceptedAnswers, and modelAnswer.
- reading: include passage { "title": "...", "ko": "...", "en": "..." }, plus "question", acceptedAnswers, and modelAnswer.
- listening: put the Korean sentence in prompt.audioText, include "question", acceptedAnswers, and modelAnswer.
- dictation: put Korean-only prompt.audioText, acceptedAnswers, and modelAnswer.
- roleplay: describe the scenario in prompt.context, include acceptedAnswers and modelAnswer.
- ordering: include "chunks", acceptedAnswers, and modelAnswer.
- minimalPair: include "contrast", "choiceKind", and four choices with one correct answer and misconception notes.
- For each scenario cluster, include at least one input task, one noticing task, one production task, one repair task, and one quick fluency/review task.
- Keep full particles in model answers by default.
- When lesson material includes grammar, particles, or connectors, include at least one production or repair task. Do not output MCQs only.
- Include numbers, time/date expressions, vocab, particles, grammar, corrections, conjugations, and sentence production when present in the lesson material.
- Use concrete Korean examples. Do not invent placeholder templates like "[place]에서 [time]에 ...".
- For fillBlank items with multiple blanks, acceptedAnswers must include the blank-only answer. Example: prompt "아침___ 저녁___ 일해요." must accept "부터 까지" and may also accept the full sentence "아침부터 저녁까지 일해요."
- For sentenceBuilder, ordering, correction, dictation, and roleplay items, include natural alternate acceptedAnswers only when the particles preserve the same roles and the final predicate remains correct.
- Include stemEn, targetMeaning, passage.en, or dialogue turn en fields when available so Kuiz can show a collapsed translation after the answer.
- For each new grammar or particle point, include: one explanation entry, one misconception-based MCQ, one production task, one correction/repair task, and one naturalness or register note when relevant.
- For each new vocab item, include the vocab entry plus at least one phrase-meaning or vocab MCQ. Do not make the learner infer the word only through a long mixed sentence.
- Before returning JSON, audit it for these failures: raw romanization in audioText, correct answer first, numeric filler choices, one-word choices for sentence prompts, MCQ-only grammar packs, duplicate dedupeKeys, placeholder brackets, fake combination rules, and missing blank-only accepted answers.

CURRENT_SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

NEW_LESSON_MATERIAL:
Paste the lesson notes, screenshots, worksheet text, PDF excerpts, or transcript here.
`;
}
