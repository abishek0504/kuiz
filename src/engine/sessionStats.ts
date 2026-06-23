import type { ExerciseRecord } from "../db/schema";
import { labelForTag, practiceCategories } from "./practiceCategories";

export type SessionBatchStats = {
  answered: number;
  correct: number;
  incorrectIds: string[];
  tagCorrect: Record<string, number>;
  tagTotal: Record<string, number>;
};

export const emptyBatchStats = (): SessionBatchStats => ({
  answered: 0,
  correct: 0,
  incorrectIds: [],
  tagCorrect: {},
  tagTotal: {},
});

const technicalTags = new Set([
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
  "card",
  "variant",
]);

function learningTags(exercise: Pick<ExerciseRecord, "tags">): string[] {
  return exercise.tags.filter((tag) => !technicalTags.has(tag)).slice(0, 3);
}

export function recordBatchSkip(stats: SessionBatchStats, exercise: ExerciseRecord): SessionBatchStats {
  if (stats.incorrectIds.includes(exercise.id)) return stats;
  return {
    ...stats,
    incorrectIds: [...stats.incorrectIds, exercise.id],
  };
}

export function recordBatchAnswer(stats: SessionBatchStats, exercise: ExerciseRecord, correct: boolean): SessionBatchStats {
  const next: SessionBatchStats = {
    ...stats,
    answered: stats.answered + 1,
    correct: stats.correct + (correct ? 1 : 0),
    incorrectIds: correct ? stats.incorrectIds : [...stats.incorrectIds, exercise.id],
    tagCorrect: { ...stats.tagCorrect },
    tagTotal: { ...stats.tagTotal },
  };

  for (const tag of learningTags(exercise)) {
    next.tagTotal[tag] = (next.tagTotal[tag] ?? 0) + 1;
    if (correct) next.tagCorrect[tag] = (next.tagCorrect[tag] ?? 0) + 1;
  }

  return next;
}

export function laneAccuracy(stats: SessionBatchStats, categoryTags: string[]): number | undefined {
  const totals = categoryTags
    .map((tag) => ({ correct: stats.tagCorrect[tag] ?? 0, total: stats.tagTotal[tag] ?? 0 }))
    .filter((item) => item.total > 0);
  if (totals.length === 0) return undefined;
  const correct = totals.reduce((sum, item) => sum + item.correct, 0);
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  return total > 0 ? correct / total : undefined;
}

export function strongestAndWeakestLanes(stats: SessionBatchStats): { strongest?: string; weakest?: string } {
  const scored = practiceCategories
    .filter((category) => category.id !== "all")
    .map((category) => ({
      label: category.label,
      accuracy: laneAccuracy(stats, category.tags),
    }))
    .filter((item): item is { label: string; accuracy: number } => item.accuracy !== undefined)
    .sort((left, right) => right.accuracy - left.accuracy);

  if (scored.length === 0) return {};
  return {
    strongest: scored[0]?.label,
    weakest: scored[scored.length - 1]?.label,
  };
}

export function missedReviewSummary(stats: SessionBatchStats): string {
  const uniqueMisses = new Set(stats.incorrectIds).size;
  return uniqueMisses > 0 ? `${uniqueMisses} added to review` : "No new misses this batch";
}

export function formatTagSummary(stats: SessionBatchStats): string {
  const topTags = Object.entries(stats.tagTotal)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([tag]) => labelForTag(tag));
  return topTags.join(" · ");
}
