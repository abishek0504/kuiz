import type { ContentPack, Exercise, MCQExercise } from "../schemas/contentPack";

function hasHangul(text: string): boolean {
  return /[가-힣]/u.test(text);
}

function hasLatin(text: string): boolean {
  return /[A-Za-z]/u.test(text);
}

function sentenceLike(text: string): boolean {
  const trimmed = text.trim();
  return /[.!?]$/u.test(trimmed) || /\s/u.test(trimmed) || /[가-힣].*(요|다|까|죠|네)[.!?]?$/u.test(trimmed);
}

function isParticleLike(text: string): boolean {
  return !/\s/u.test(text.trim()) && text.trim().length <= 8;
}

function modelAnswerFor(exercise: Exercise): string {
  if ("modelAnswer" in exercise) return exercise.modelAnswer;
  if ("corrected" in exercise) return exercise.corrected;
  if (exercise.type === "mcq") return exercise.choices.find((choice) => choice.isCorrect)?.text ?? "";
  return "";
}

function validateMcq(exercise: MCQExercise, errors: string[]) {
  const label = `exercises.${exercise.id}`;
  const texts = exercise.choices.map((choice) => choice.text.trim());
  const uniqueTexts = new Set(texts.map((text) => text.toLocaleLowerCase()));

  if (exercise.choices.length !== 4) {
    errors.push(`${label}: multiple choice exercises must have exactly 4 choices.`);
  }
  if (exercise.choices[0]?.isCorrect) {
    errors.push(`${label}: source choices must not put the correct answer first.`);
  }
  if (uniqueTexts.size !== texts.length) {
    errors.push(`${label}: choices must not repeat the same visible answer.`);
  }
  if (texts.some((text) => /^[0-9]+$/u.test(text))) {
    errors.push(`${label}: choices must not use bare numeric filler like 1, 2, or 3.`);
  }

  for (const choice of exercise.choices) {
    if (!choice.isCorrect && !choice.why?.trim()) {
      errors.push(`${label}: every distractor needs a misconception note in "why".`);
    }
  }

  if (exercise.choiceKind === "particle" && !texts.every(isParticleLike)) {
    errors.push(`${label}: particle choices must all be short particle-form options.`);
  }

  if (exercise.choiceKind === "full-sentence-meaning") {
    if (!texts.every(sentenceLike)) {
      errors.push(`${label}: full-sentence MCQs must use full-sentence choices.`);
    }
    if (texts.some((text) => !hasHangul(text) && !/\s/u.test(text) && text.length < 8)) {
      errors.push(`${label}: full-sentence MCQs must not use one-word English choices.`);
    }
  }
}

export function validateContentQuality(pack: ContentPack): string[] {
  const errors: string[] = [];
  const entries = [...pack.vocab, ...pack.particles, ...pack.grammar];
  const dedupeKeys = [...entries, ...pack.exercises].map((item) => item.dedupeKey);
  const seenKeys = new Set<string>();

  for (const key of dedupeKeys) {
    if (seenKeys.has(key)) errors.push(`dedupeKey ${key}: duplicate within incoming pack.`);
    seenKeys.add(key);
  }

  const audioTexts = [
    ...pack.exercises.map((exercise) => exercise.prompt.audioText),
    ...entries.flatMap((entry) => entry.examples.map((example) => example.audioText)),
  ].filter((text): text is string => Boolean(text));

  for (const audioText of audioTexts) {
    if (!hasHangul(audioText) || hasLatin(audioText)) {
      errors.push(`audioText "${audioText}": audio must be Korean-only Hangul text.`);
    }
  }

  for (const entry of pack.grammar) {
    if (/\[[^\]]+\]/u.test(`${entry.title} ${entry.pattern}`)) {
      errors.push(`grammar.${entry.id}: use real Korean examples instead of bracket placeholders.`);
    }
  }

  for (const exercise of pack.exercises) {
    if (exercise.type === "mcq") validateMcq(exercise, errors);
    if (/\[[^\]]+\]/u.test(`${exercise.prompt.stem} ${exercise.prompt.stemKo ?? ""} ${modelAnswerFor(exercise)}`)) {
      errors.push(`exercises.${exercise.id}: use concrete Korean sentences instead of bracket placeholders.`);
    }
  }

  const hasFormFocusedContent =
    pack.particles.length > 0 ||
    pack.grammar.length > 0 ||
    pack.pack.includes.some((tag) => ["particles", "particle", "grammar", "connectors"].includes(tag));
  const hasProductionTask = pack.exercises.some((exercise) => exercise.type !== "mcq");
  if (hasFormFocusedContent && !hasProductionTask) {
    errors.push("pack: grammar, particle, and connector lessons must include at least one production or repair task.");
  }

  return errors;
}
