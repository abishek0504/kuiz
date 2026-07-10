import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";

const sampledValues = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 50, 99]);
const legacyNumberId = /^legacy-mcq-num-(?:sino|native)-(\d+)$/u;

export function isExhaustiveLegacyNumberDrill(exercise: Pick<ExerciseRecord, "id">): boolean {
  return legacyNumberId.test(exercise.id);
}

export function compactLegacyNumberDrills(
  exercises: ExerciseRecord[],
  reviewStates: ReviewState[],
  now = new Date(),
): ExerciseRecord[] {
  const reviewById = new Map(reviewStates.map((state) => [state.cardId, state]));

  return exercises.filter((exercise) => {
    const match = exercise.id.match(legacyNumberId);
    if (!match) return true;
    if (sampledValues.has(Number(match[1]))) return true;

    const review = reviewById.get(exercise.id);
    if (!review || review.reps === 0) return false;
    return (
      new Date(review.dueAt).getTime() <= now.getTime() ||
      review.lapses > 0 ||
      review.lastGrade === "again" ||
      review.lastGrade === "hard"
    );
  });
}
