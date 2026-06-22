import type { ExerciseRecord } from "../db/schema";
import {
  practiceCategories,
  tagsForPracticeCategory,
  type PracticeCategory,
  type PracticeCategoryId,
} from "./practiceCategories";
import { mistakeCount } from "./mistakeAnalytics";
import type { ReviewState } from "./scheduler";
import { isProductionExercise } from "./sessionPlanner";

export type CategoryInsight = {
  category: PracticeCategory;
  total: number;
  due: number;
  weak: number;
  fresh: number;
  reviewed: number;
  production: number;
  mistakes: number;
  productionAccuracy?: number;
  receptionAccuracy?: number;
  categoryPressure: number;
  score: number;
};

export type PracticeRecommendation = {
  categoryId: PracticeCategoryId;
  title: string;
  reason: string;
  insight: CategoryInsight;
};

function exerciseMatchesCategory(exercise: ExerciseRecord, categoryId: PracticeCategoryId): boolean {
  const tags = tagsForPracticeCategory(categoryId);
  return tags.length === 0 || exercise.tags.some((tag) => tags.includes(tag));
}

function isDue(reviewState: ReviewState | undefined, now: Date): boolean {
  return Boolean(reviewState && reviewState.reps > 0 && new Date(reviewState.dueAt).getTime() <= now.getTime());
}

function isWeak(reviewState: ReviewState | undefined): boolean {
  return Boolean(
    reviewState &&
      reviewState.reps > 0 &&
      (reviewState.lapses > 0 || reviewState.lastGrade === "again" || reviewState.lastGrade === "hard"),
  );
}

export function categoryInsights(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): CategoryInsight[] {
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));

  return practiceCategories.map((category) => {
    const matching = exercises.filter((exercise) => exerciseMatchesCategory(exercise, category.id));
    let due = 0;
    let weak = 0;
    let fresh = 0;
    let reviewed = 0;
    let production = 0;
    let mistakes = 0;
    let productionAccuracyTotal = 0;
    let productionAccuracyCount = 0;
    let receptionAccuracyTotal = 0;
    let receptionAccuracyCount = 0;
    const categoryTags = tagsForPracticeCategory(category.id);

    for (const exercise of matching) {
      const reviewState = reviewById.get(exercise.id);
      if (!reviewState || reviewState.reps === 0) fresh += 1;
      if (reviewState && reviewState.reps > 0) reviewed += 1;
      if (isDue(reviewState, now)) due += 1;
      if (isWeak(reviewState)) weak += 1;
      if (isProductionExercise(exercise)) production += 1;
      mistakes += mistakeCount(reviewState, category.id === "all" ? [] : categoryTags);
      if (reviewState?.productionAccuracy !== undefined) {
        productionAccuracyTotal += reviewState.productionAccuracy;
        productionAccuracyCount += 1;
      }
      if (reviewState?.receptionAccuracy !== undefined) {
        receptionAccuracyTotal += reviewState.receptionAccuracy;
        receptionAccuracyCount += 1;
      }
    }

    const productionAccuracy =
      productionAccuracyCount > 0 ? Math.round((productionAccuracyTotal / productionAccuracyCount) * 100) / 100 : undefined;
    const receptionAccuracy =
      receptionAccuracyCount > 0 ? Math.round((receptionAccuracyTotal / receptionAccuracyCount) * 100) / 100 : undefined;
    const lowProductionPressure = productionAccuracy === undefined ? 0 : Math.max(0, Math.round((0.82 - productionAccuracy) * 10));
    const lowReceptionPressure = receptionAccuracy === undefined ? 0 : Math.max(0, Math.round((0.86 - receptionAccuracy) * 8));
    const categoryPressure =
      due * 8 + weak * 10 + mistakes * 5 + Math.min(fresh, 8) + lowProductionPressure + lowReceptionPressure;

    return {
      category,
      total: matching.length,
      due,
      weak,
      fresh,
      reviewed,
      production,
      mistakes,
      productionAccuracy,
      receptionAccuracy,
      categoryPressure,
      score: categoryPressure + Math.min(production, 6),
    };
  });
}

function accuracyPhrase(label: string, value: number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return `${label} ${Math.round(value * 100)}%`;
}

function evidenceReason(insight: CategoryInsight): string {
  return [
    `${insight.due} due reviews`,
    `${insight.weak} weak items`,
    `${insight.mistakes} logged misses`,
    accuracyPhrase("production", insight.productionAccuracy),
    accuracyPhrase("reception", insight.receptionAccuracy),
  ]
    .filter(Boolean)
    .join(", ");
}

export function recommendedPractice(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): PracticeRecommendation {
  const insights = categoryInsights(exercises, reviewStates, now);
  const fullDeck = insights.find((insight) => insight.category.id === "all") ?? insights[0];
  const reviewedCount = reviewStates.filter((state) => state.reps > 0).length;

  if (reviewedCount === 0) {
    return {
      categoryId: "all",
      title: "Build a balanced Korean baseline",
      reason: "Start broad so Kuiz can collect a signal before narrowing your review.",
      insight: fullDeck,
    };
  }

  const candidates = insights
    .filter((insight) => insight.category.id !== "all" && insight.total > 0)
    .sort((left, right) => {
      const pressureDelta = right.due + right.weak * 2 - (left.due + left.weak * 2);
      if (pressureDelta !== 0) return pressureDelta;
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;
      return left.category.id.localeCompare(right.category.id);
    });
  const best = candidates[0] ?? fullDeck;

  if (
    best.due > 0 ||
    best.weak > 0 ||
    best.mistakes > 0 ||
    (best.productionAccuracy !== undefined && best.productionAccuracy < 0.82) ||
    (best.receptionAccuracy !== undefined && best.receptionAccuracy < 0.86)
  ) {
    return {
      categoryId: best.category.id,
      title: `Practice ${best.category.label} with targeted review`,
      reason: `${evidenceReason(best)}.`,
      insight: best,
    };
  }

  const mixed = insights.find((insight) => insight.category.id === "mixed" && insight.total > 0);
  if (mixed) {
    return {
      categoryId: "mixed",
      title: "Build mixed Korean sentences",
      reason: `${mixed.production} production tasks are ready; ${evidenceReason(mixed)}.`,
      insight: mixed,
    };
  }

  return {
    categoryId: "all",
    title: "Interleave the full Korean deck",
    reason: "Keep the deck interleaved so particles, grammar, vocab, and production stay connected.",
    insight: fullDeck,
  };
}
