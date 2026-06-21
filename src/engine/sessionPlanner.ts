import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";

function isDue(card: ReviewState, now: Date): boolean {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

function reviewBucket(card: ReviewState | undefined, now: Date): number {
  if (!card) return 2;
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
  return dueAgeMinutes + lapseWeight + difficultyWeight + retrievabilityWeight + recentMissWeight;
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

export function sessionSummary(exercises: ExerciseRecord[], reviewStates: ReviewState[], now = new Date()) {
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));
  let due = 0;
  let weak = 0;
  let fresh = 0;

  for (const exercise of exercises) {
    const reviewState = reviewById.get(exercise.id);
    if (!reviewState) {
      fresh += 1;
    } else if (isDue(reviewState, now)) {
      due += 1;
    } else if (reviewState.lapses > 0 || reviewState.lastGrade === "again" || reviewState.lastGrade === "hard") {
      weak += 1;
    }
  }

  return { due, weak, fresh, total: exercises.length };
}
