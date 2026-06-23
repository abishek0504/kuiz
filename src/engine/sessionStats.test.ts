import { describe, expect, it } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import { emptyBatchStats, recordBatchAnswer, recordBatchSkip, strongestAndWeakestLanes } from "./sessionStats";

function exercise(tags: string[]): ExerciseRecord {
  return {
    id: "test",
    packId: "starter",
    searchText: "",
    dedupeKey: "exercise:test",
    type: "mcq",
    choiceKind: "particle",
    tags,
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: "test" },
    choices: [],
  } as ExerciseRecord;
}

describe("sessionStats", () => {
  it("tracks answered and incorrect ids", () => {
    let stats = emptyBatchStats();
    stats = recordBatchAnswer(stats, exercise(["particles"]), false);
    stats = recordBatchAnswer(stats, exercise(["vocab"]), true);
    expect(stats.answered).toBe(2);
    expect(stats.correct).toBe(1);
    expect(stats.incorrectIds).toEqual(["test"]);
  });

  it("queues skipped exercises for missed review", () => {
    const stats = recordBatchSkip(emptyBatchStats(), exercise(["vocab"]));
    expect(stats.incorrectIds).toEqual(["test"]);
    expect(stats.answered).toBe(0);
  });

  it("finds strongest and weakest lanes", () => {
    let stats = emptyBatchStats();
    stats = recordBatchAnswer(stats, exercise(["particles", "place"]), true);
    stats = recordBatchAnswer(stats, exercise(["particles", "place"]), true);
    stats = recordBatchAnswer(stats, exercise(["vocab"]), false);
    const lanes = strongestAndWeakestLanes(stats);
    expect(lanes.strongest).toBeTruthy();
    expect(lanes.weakest).toBeTruthy();
  });
});
