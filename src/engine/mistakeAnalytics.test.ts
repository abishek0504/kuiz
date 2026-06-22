import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import { applyAnswerAnalytics, diagnosticTags, mistakeCount } from "./mistakeAnalytics";
import { initialReviewState } from "./scheduler";

function exercise(type: ExerciseRecord["type"], tags: string[]): ExerciseRecord {
  const base = {
    id: `exercise-${type}`,
    packId: "test",
    searchText: "test",
    dedupeKey: `exercise:${type}`,
    tags,
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: "test" },
  };

  if (type === "sentenceBuilder") {
    return {
      ...base,
      type,
      tokens: ["저는"],
      targetMeaning: "I",
      acceptedAnswers: { strict: ["저는"], relaxed: [], regex: [] },
      modelAnswer: "저는",
    };
  }

  return {
    ...base,
    type: "mcq",
    choiceKind: "particle",
    choices: [
      { id: "a", text: "에", isCorrect: false, why: "Destination particle does not mark this action place." },
      { id: "b", text: "에서", isCorrect: true, why: "Correct." },
      { id: "c", text: "으로", isCorrect: false, why: "Direction does not fit this sentence." },
      { id: "d", text: "까지", isCorrect: false, why: "Endpoint does not fit this sentence." },
    ],
  };
}

describe("mistake analytics", () => {
  test("records diagnostic tags and the latest misconception on misses", () => {
    const state = applyAnswerAnalytics(
      initialReviewState("exercise-mcq"),
      exercise("mcq", ["mcq", "particles", "e", "scenario"]),
      false,
      "Use 에서 for action location.",
    );

    expect(diagnosticTags(exercise("mcq", ["mcq", "particles", "e", "scenario"]))).toEqual(["particles", "e"]);
    expect(state.mistakeTags).toEqual({ particles: 1, e: 1 });
    expect(state.lastMistakeReason).toBe("Use 에서 for action location.");
    expect(state.receptionAccuracy).toBe(0);
    expect(mistakeCount(state, ["particles"])).toBe(1);
  });

  test("keeps rolling production accuracy for typed tasks", () => {
    const first = applyAnswerAnalytics(initialReviewState("exercise-build"), exercise("sentenceBuilder", ["mixed"]), true);
    const second = applyAnswerAnalytics(first, exercise("sentenceBuilder", ["mixed"]), false);

    expect(first.productionAccuracy).toBe(1);
    expect(second.productionAccuracy).toBe(0.8);
    expect(second.mistakeTags).toEqual({ mixed: 1 });
  });
});
