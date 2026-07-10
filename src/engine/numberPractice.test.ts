import { describe, expect, it } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";
import { compactLegacyNumberDrills, isExhaustiveLegacyNumberDrill } from "./numberPractice";

function drill(value: number): ExerciseRecord {
  return {
    id: `legacy-mcq-num-sino-${value}`,
    packId: "starter",
    searchText: "",
    dedupeKey: `exercise:number:${value}`,
    type: "mcq",
    choiceKind: "vocab",
    tags: ["numbers"],
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: `What does ${value} mean?` },
    choices: [
      { id: "a", text: "wrong", isCorrect: false },
      { id: "b", text: String(value), isCorrect: true },
    ],
  };
}

function review(cardId: string): ReviewState {
  return {
    cardId,
    stability: 1,
    difficulty: 5,
    retrievability: 0.5,
    dueAt: "2026-07-09T00:00:00.000Z",
    reps: 2,
    lapses: 1,
    lastGrade: "hard",
  };
}

describe("contextual number practice", () => {
  it("keeps a representative recognition sample rather than all 0-99 cards", () => {
    const source = Array.from({ length: 100 }, (_, value) => drill(value));
    const compacted = compactLegacyNumberDrills(source, [], new Date("2026-07-10T00:00:00.000Z"));
    expect(compacted).toHaveLength(17);
    expect(compacted.some((exercise) => exercise.id.endsWith("-99"))).toBe(true);
    expect(compacted.some((exercise) => exercise.id.endsWith("-73"))).toBe(false);
  });

  it("retains a weak or due drill even when it is outside the sample", () => {
    const exercise = drill(73);
    expect(compactLegacyNumberDrills([exercise], [review(exercise.id)])).toEqual([exercise]);
    expect(isExhaustiveLegacyNumberDrill(exercise)).toBe(true);
  });
});
