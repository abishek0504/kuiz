import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";

const ignoredTags = new Set([
  "mcq",
  "fillBlank",
  "sentenceBuilder",
  "sentence-builder",
  "correction",
  "conjugation",
  "dialogue",
  "reading",
  "listening",
  "dictation",
  "roleplay",
  "ordering",
  "minimalPair",
  "scenario",
  "card",
]);

const productionTypes: ReadonlySet<ExerciseRecord["type"]> = new Set([
  "sentenceBuilder",
  "correction",
  "conjugation",
  "dictation",
  "roleplay",
  "ordering",
]);

function rollingAccuracy(current: number | undefined, correct: boolean): number {
  const nextSample = correct ? 1 : 0;
  if (current === undefined) return nextSample;
  return Math.round((current * 0.8 + nextSample * 0.2) * 1000) / 1000;
}

export function diagnosticTags(exercise: Pick<ExerciseRecord, "tags" | "type">): string[] {
  const tags = exercise.tags.filter((tag) => !ignoredTags.has(tag)).slice(0, 5);
  return tags.length > 0 ? tags : [exercise.type];
}

export function mistakeCount(state: ReviewState | undefined, tags: string[]): number {
  if (!state?.mistakeTags) return 0;
  if (tags.length === 0) {
    return Object.values(state.mistakeTags).reduce((sum, count) => sum + count, 0);
  }
  return tags.reduce((sum, tag) => sum + (state.mistakeTags?.[tag] ?? 0), 0);
}

export function applyAnswerAnalytics(
  state: ReviewState,
  exercise: ExerciseRecord,
  correct: boolean,
  reason?: string,
): ReviewState {
  const next: ReviewState = { ...state };
  const production = productionTypes.has(exercise.type);

  if (production) {
    next.productionAccuracy = rollingAccuracy(next.productionAccuracy, correct);
  } else {
    next.receptionAccuracy = rollingAccuracy(next.receptionAccuracy, correct);
  }

  if (!correct) {
    const mistakeTags = { ...(next.mistakeTags ?? {}) };
    for (const tag of diagnosticTags(exercise)) {
      mistakeTags[tag] = (mistakeTags[tag] ?? 0) + 1;
    }
    next.mistakeTags = mistakeTags;
    next.lastMistakeReason = reason?.trim() || "Answer missed the target form or meaning.";
  }

  return next;
}
