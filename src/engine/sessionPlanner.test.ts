import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";
import { planSessionExercises, sessionSummary } from "./sessionPlanner";

function exercise(id: string): ExerciseRecord {
  return {
    id,
    packId: "test",
    searchText: id,
    dedupeKey: `exercise:${id}`,
    type: "fillBlank",
    tags: ["mixed"],
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: id },
    answerPresentation: "sentence",
    acceptedAnswers: { strict: [id], relaxed: [], regex: [] },
    modelAnswer: id,
  };
}

function state(cardId: string, patch: Partial<ReviewState>): ReviewState {
  return {
    cardId,
    stability: 1,
    difficulty: 5,
    retrievability: 0.9,
    dueAt: "2026-06-21T12:00:00.000Z",
    reps: 1,
    lapses: 0,
    ...patch,
  };
}

describe("session planner", () => {
  const now = new Date("2026-06-21T12:00:00.000Z");

  test("prioritizes due, weak, new, then future stable exercises", () => {
    const planned = planSessionExercises(
      [exercise("new"), exercise("future"), exercise("weak"), exercise("due")],
      [
        state("future", { dueAt: "2026-06-28T12:00:00.000Z", lastGrade: "good" }),
        state("weak", { dueAt: "2026-06-23T12:00:00.000Z", lastGrade: "again", lapses: 2 }),
        state("due", { dueAt: "2026-06-20T12:00:00.000Z", lastGrade: "hard", lapses: 1 }),
      ],
      now,
    );

    expect(planned.map((item) => item.id)).toEqual(["due", "weak", "new", "future"]);
  });

  test("summarizes due, weak, and fresh session work", () => {
    expect(
      sessionSummary(
        [exercise("new"), exercise("future"), exercise("weak"), exercise("due")],
        [
          state("future", { dueAt: "2026-06-28T12:00:00.000Z", lastGrade: "good" }),
          state("weak", { dueAt: "2026-06-23T12:00:00.000Z", lastGrade: "hard" }),
          state("due", { dueAt: "2026-06-20T12:00:00.000Z" }),
        ],
        now,
      ),
    ).toEqual({ due: 1, weak: 1, fresh: 1, total: 4 });
  });
});
