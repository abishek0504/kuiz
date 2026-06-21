import type { ExerciseRecord } from "../db/schema";
import {
  practiceCategories,
  tagsForPracticeCategory,
  type PracticeCategory,
  type PracticeCategoryId,
} from "./practiceCategories";
import type { ReviewState } from "./scheduler";

export type CategoryInsight = {
  category: PracticeCategory;
  total: number;
  due: number;
  weak: number;
  fresh: number;
  reviewed: number;
  production: number;
  score: number;
};

export type PracticeRecommendation = {
  categoryId: PracticeCategoryId;
  title: string;
  reason: string;
  insight: CategoryInsight;
};

function isProductionExercise(exercise: ExerciseRecord): boolean {
  return exercise.type === "sentenceBuilder" || exercise.type === "correction" || exercise.type === "conjugation";
}

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

    for (const exercise of matching) {
      const reviewState = reviewById.get(exercise.id);
      if (!reviewState || reviewState.reps === 0) fresh += 1;
      if (reviewState && reviewState.reps > 0) reviewed += 1;
      if (isDue(reviewState, now)) due += 1;
      if (isWeak(reviewState)) weak += 1;
      if (isProductionExercise(exercise)) production += 1;
    }

    return {
      category,
      total: matching.length,
      due,
      weak,
      fresh,
      reviewed,
      production,
      score: due * 8 + weak * 10 + Math.min(fresh, 8) + Math.min(production, 6),
    };
  });
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
      title: "Balanced full-deck session",
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

  if (best.due > 0 || best.weak > 0) {
    return {
      categoryId: best.category.id,
      title: `${best.category.label} repair session`,
      reason: `${best.due} due and ${best.weak} weak items need review before adding more new material.`,
      insight: best,
    };
  }

  const mixed = insights.find((insight) => insight.category.id === "mixed" && insight.total > 0);
  if (mixed) {
    return {
      categoryId: "mixed",
      title: "Mixed sentence production",
      reason: "No weak lane stands out, so move from recognition into integrated sentence work.",
      insight: mixed,
    };
  }

  return {
    categoryId: "all",
    title: "Balanced full-deck session",
    reason: "Keep the deck interleaved so particles, grammar, vocab, and production stay connected.",
    insight: fullDeck,
  };
}
