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
- Mark "inferred": true when something is reasonably inferred but not explicitly visible.
- Prefer context-rich practice over trivial translation drills.
- MCQ options must be homogeneous: particle options with particles, sentence meanings with sentence meanings, grammar forms with grammar forms.
- Fill blanks, corrections, conjugations, and sentence builders need acceptedAnswers and model answers.
- Keep full particles in model answers by default.
- Include numbers, time/date expressions, vocab, particles, grammar, corrections, conjugations, and sentence production when present in the lesson material.

CURRENT_SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

NEW_LESSON_MATERIAL:
Paste the lesson notes, screenshots, worksheet text, PDF excerpts, or transcript here.
`;
}
