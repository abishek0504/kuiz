import type { ExerciseRecord } from "../db/schema";
import { mistakeCount } from "./mistakeAnalytics";
import { normalizeKorean } from "./normalize";
import type { ReviewState } from "./scheduler";

function isDue(card: ReviewState, now: Date): boolean {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

function reviewBucket(card: ReviewState | undefined, now: Date): number {
  if (!card || card.reps === 0) return 2;
  if (isDue(card, now)) return 0;
  if (card.lapses > 0 || card.lastGrade === "again" || card.lastGrade === "hard") return 1;
  return 3;
}

function reviewScore(card: ReviewState | undefined, now: Date): number {
  if (!card) return 0;
  const dueAgeMinutes = Math.max(0, (now.getTime() - new Date(card.dueAt).getTime()) / 60_000);
  const lapseWeight = card.lapses * 120;
  const difficultyWeight = card.difficulty * 8;
  const retrievabilityWeight = (1 - card.retrievability) * 80;
  const recentMissWeight = card.lastGrade === "again" ? 80 : card.lastGrade === "hard" ? 35 : 0;
  const mistakeWeight = mistakeCount(card, []) * 45;
  return dueAgeMinutes + lapseWeight + difficultyWeight + retrievabilityWeight + recentMissWeight + mistakeWeight;
}

export function planSessionExercises(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): ExerciseRecord[] {
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));

  return [...exercises].sort((left, right) => {
    const leftReview = reviewById.get(left.id);
    const rightReview = reviewById.get(right.id);
    const leftBucket = reviewBucket(leftReview, now);
    const rightBucket = reviewBucket(rightReview, now);

    if (leftBucket !== rightBucket) return leftBucket - rightBucket;

    const scoreDelta = reviewScore(rightReview, now) - reviewScore(leftReview, now);
    if (scoreDelta !== 0) return scoreDelta;

    return left.id.localeCompare(right.id);
  });
}

const balancedTypeOrder: ExerciseRecord["type"][] = [
  "dialogue",
  "reading",
  "listening",
  "mcq",
  "minimalPair",
  "fillBlank",
  "sentenceBuilder",
  "correction",
  "roleplay",
  "ordering",
  "dictation",
  "conjugation",
];

export function isProductionExercise(exercise: ExerciseRecord): boolean {
  return ["sentenceBuilder", "correction", "conjugation", "dictation", "roleplay", "ordering"].includes(exercise.type);
}

export function isInputExercise(exercise: ExerciseRecord): boolean {
  return ["dialogue", "reading", "listening", "mcq"].includes(exercise.type);
}

export function isListeningExercise(exercise: ExerciseRecord): boolean {
  return exercise.type === "listening" || exercise.type === "dictation";
}

export function planBalancedSessionExercises(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): ExerciseRecord[] {
  const sorted = planSessionExercises(exercises, reviewStates, now);
  const byType = new Map<ExerciseRecord["type"], ExerciseRecord[]>();
  for (const exercise of sorted) {
    byType.set(exercise.type, [...(byType.get(exercise.type) ?? []), exercise]);
  }

  const planned: ExerciseRecord[] = [];
  while (planned.length < sorted.length) {
    let moved = false;
    for (const type of balancedTypeOrder) {
      const bucket = byType.get(type);
      const next = bucket?.shift();
      if (next) {
        planned.push(next);
        moved = true;
      }
    }
    if (!moved) break;
  }

  return planned;
}

function answerKey(exercise: ExerciseRecord): string {
  if (exercise.type === "mcq" || exercise.type === "minimalPair") {
    return normalizeKorean(exercise.choices.find((choice) => choice.isCorrect)?.text ?? exercise.prompt.stem);
  }
  if (exercise.type === "correction") return normalizeKorean(exercise.corrected);
  return normalizeKorean(exercise.modelAnswer);
}

function takeNext(
  source: ExerciseRecord[],
  planned: ExerciseRecord[],
  usedIds: Set<string>,
  usedAnswerKeys = new Set<string>(),
) {
  const next = source.find((exercise) => !usedIds.has(exercise.id) && !usedAnswerKeys.has(answerKey(exercise)));
  if (!next) return;
  planned.push(next);
  usedIds.add(next.id);
  usedAnswerKeys.add(answerKey(next));
}

export function planRecommendedSessionExercises(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): ExerciseRecord[] {
  const sorted = planSessionExercises(exercises, reviewStates, now);
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));
  const dueOrWeak = sorted.filter((exercise) => {
    const reviewState = reviewById.get(exercise.id);
    return Boolean(
      reviewState &&
        reviewState.reps > 0 &&
        (new Date(reviewState.dueAt).getTime() <= now.getTime() ||
          reviewState.lapses > 0 ||
          reviewState.lastGrade === "again" ||
          reviewState.lastGrade === "hard"),
    );
  });
  const input = sorted.filter(isInputExercise);
  const form = sorted.filter((exercise) => exercise.type === "fillBlank" || exercise.type === "minimalPair");
  const production = sorted.filter(isProductionExercise);

  const planned: ExerciseRecord[] = [];
  const usedIds = new Set<string>();
  const usedAnswerKeys = new Set<string>();
  for (const bucket of [input, input, form, form, production, production, production, dueOrWeak, dueOrWeak, sorted]) {
    takeNext(bucket, planned, usedIds, usedAnswerKeys);
  }
  for (const exercise of sorted) {
    if (planned.length >= 10) break;
    if (!usedIds.has(exercise.id)) takeNext([exercise], planned, usedIds, usedAnswerKeys);
  }
  return planned;
}

export function sessionSummary(exercises: ExerciseRecord[], reviewStates: ReviewState[], now = new Date()) {
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));
  let due = 0;
  let weak = 0;
  let fresh = 0;

  for (const exercise of exercises) {
    const reviewState = reviewById.get(exercise.id);
    if (!reviewState || reviewState.reps === 0) {
      fresh += 1;
    } else if (isDue(reviewState, now)) {
      due += 1;
    } else if (reviewState.lapses > 0 || reviewState.lastGrade === "again" || reviewState.lastGrade === "hard") {
      weak += 1;
    }
  }

  return { due, weak, fresh, total: exercises.length };
}
