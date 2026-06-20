export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type ReviewState = {
  cardId: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  dueAt: string;
  lastReviewedAt?: string;
  reps: number;
  lapses: number;
  lastGrade?: ReviewGrade;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(start: string, end: Date): number {
  return (end.getTime() - new Date(start).getTime()) / 86_400_000;
}

function addDays(start: Date, days: number): Date {
  return new Date(start.getTime() + days * 86_400_000);
}

function addMinutes(start: Date, minutes: number): Date {
  return new Date(start.getTime() + minutes * 60_000);
}

export function initialReviewState(cardId: string, now = new Date()): ReviewState {
  return {
    cardId,
    stability: 1,
    difficulty: 5,
    retrievability: 1,
    dueAt: now.toISOString(),
    reps: 0,
    lapses: 0,
  };
}

export function targetIntervalDays(stability: number, desiredRetention = 0.9): number {
  return Math.max(1, Math.round((stability * Math.log(desiredRetention)) / Math.log(0.9)));
}

export function intervalDays(card: ReviewState, now = new Date()): number {
  return Math.max(0, (new Date(card.dueAt).getTime() - now.getTime()) / 86_400_000);
}

export function review(card: ReviewState, grade: ReviewGrade, now = new Date()): ReviewState {
  const next: ReviewState = { ...card };
  const elapsedDays = next.lastReviewedAt ? Math.max(0, daysBetween(next.lastReviewedAt, now)) : 0;
  const retrievability = Math.pow(0.9, elapsedDays / Math.max(next.stability, 0.1));

  next.retrievability = retrievability;
  next.reps += 1;

  if (grade === "again") {
    next.lapses += 1;
    next.difficulty = clamp(next.difficulty + 0.08, 1, 10);
    next.stability = Math.max(0.3, next.stability * 0.25);
    next.dueAt = addMinutes(now, 10).toISOString();
  } else {
    const easeFactor = grade === "hard" ? 1.15 : grade === "good" ? 2.1 : 2.85;
    const diffFactor = (11 - next.difficulty) / 10;
    const recallBoost = 1 + (1 - retrievability);

    next.stability = Math.max(1, next.stability * easeFactor * diffFactor * recallBoost);

    if (grade === "hard") next.difficulty = clamp(next.difficulty + 0.03, 1, 10);
    if (grade === "good") next.difficulty = clamp(next.difficulty - 0.02, 1, 10);
    if (grade === "easy") next.difficulty = clamp(next.difficulty - 0.05, 1, 10);

    const baseInterval = targetIntervalDays(next.stability, 0.9);
    const interval =
      grade === "hard"
        ? Math.max(1, Math.round(baseInterval * 0.7))
        : grade === "good"
          ? baseInterval
          : Math.round(baseInterval * 1.3);

    next.dueAt = addDays(now, interval).toISOString();
  }

  next.lastReviewedAt = now.toISOString();
  next.lastGrade = grade;
  return next;
}
