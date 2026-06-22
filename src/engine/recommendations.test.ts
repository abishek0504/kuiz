import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";
import { categoryInsights, recommendedPractice } from "./recommendations";

function exercise(id: string, tags: string[], type: ExerciseRecord["type"] = "mcq"): ExerciseRecord {
  const base = {
    id,
    packId: "test",
    searchText: id,
    dedupeKey: `exercise:${id}`,
    tags,
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: id },
  };

  if (type === "sentenceBuilder") {
    return {
      ...base,
      type,
      tokens: [id],
      targetMeaning: id,
      acceptedAnswers: { strict: [id], relaxed: [], regex: [] },
      modelAnswer: id,
    };
  }

  return {
    ...base,
    type: "mcq",
    choiceKind: "phrase-meaning",
    choices: [
      { id: "a", text: "wrong", isCorrect: false },
      { id: "b", text: "right", isCorrect: true },
      { id: "c", text: "near", isCorrect: false },
      { id: "d", text: "other", isCorrect: false },
    ],
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

describe("practice recommendations", () => {
  const now = new Date("2026-06-21T12:00:00.000Z");

  test("starts new learners with the full balanced deck", () => {
    const recommendation = recommendedPractice(
      [exercise("particles-1", ["particles"]), exercise("mixed-1", ["mixed"], "sentenceBuilder")],
      [],
      now,
    );

    expect(recommendation.categoryId).toBe("all");
    expect(recommendation.title).toMatch(/balanced Korean baseline/);
  });

  test("targets the category with due and weak review pressure", () => {
    const recommendation = recommendedPractice(
      [
        exercise("particles-1", ["particles"]),
        exercise("particles-2", ["particles"]),
        exercise("numbers-1", ["number", "sino-numbers"]),
      ],
      [
        state("particles-1", { dueAt: "2026-06-20T12:00:00.000Z", lapses: 1, lastGrade: "again" }),
        state("particles-2", { dueAt: "2026-06-20T12:00:00.000Z", lastGrade: "hard" }),
        state("numbers-1", { dueAt: "2026-06-28T12:00:00.000Z", lastGrade: "good" }),
      ],
      now,
    );

    expect(recommendation.categoryId).toBe("particles");
    expect(recommendation.reason).toContain("weak");
  });

  test("reports production counts by learner-facing category", () => {
    const insights = categoryInsights(
      [exercise("mixed-1", ["mixed"], "sentenceBuilder"), exercise("numbers-1", ["number"])],
      [],
      now,
    );
    const mixed = insights.find((insight) => insight.category.id === "mixed");

    expect(mixed?.production).toBe(1);
    expect(mixed?.fresh).toBe(1);
  });
});
