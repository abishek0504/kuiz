import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";
import { planBalancedSessionExercises, planSessionExercises, sessionSummary } from "./sessionPlanner";

function exercise(id: string, type: ExerciseRecord["type"] = "fillBlank"): ExerciseRecord {
  const base = {
    id,
    packId: "test",
    searchText: id,
    dedupeKey: `exercise:${id}`,
    tags: ["mixed"],
    sourceRefIds: [],
    inferred: false,
    prompt: { stem: id },
  };

  if (type === "mcq") {
    return {
      ...base,
      type,
      choiceKind: "full-sentence-meaning",
      choices: [
        { id: "a", text: "Wrong sentence.", isCorrect: false },
        { id: "b", text: "Correct sentence.", isCorrect: true },
        { id: "c", text: "Near sentence.", isCorrect: false },
        { id: "d", text: "Other sentence.", isCorrect: false },
      ],
    };
  }

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

  if (type === "correction") {
    return {
      ...base,
      type,
      incorrect: `${id} wrong`,
      corrected: id,
      acceptedAnswers: { strict: [id], relaxed: [], regex: [] },
    };
  }

  if (type === "conjugation") {
    return {
      ...base,
      type,
      dictionaryForm: id,
      targetFormLabel: "아요/어요",
      acceptedAnswers: { strict: [id], relaxed: [], regex: [] },
      modelAnswer: id,
    };
  }

  return {
    ...base,
    type: "fillBlank",
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

  test("treats unseen initial review states as fresh, not due", () => {
    expect(
      sessionSummary(
        [exercise("new-with-state")],
        [state("new-with-state", { reps: 0, dueAt: "2026-06-20T12:00:00.000Z" })],
        now,
      ),
    ).toEqual({ due: 0, weak: 0, fresh: 1, total: 1 });
  });

  test("balanced sessions interleave recognition, blanks, production, repair, and conjugation", () => {
    const planned = planBalancedSessionExercises(
      [
        exercise("mcq-1", "mcq"),
        exercise("mcq-2", "mcq"),
        exercise("blank-1", "fillBlank"),
        exercise("build-1", "sentenceBuilder"),
        exercise("repair-1", "correction"),
        exercise("conjugate-1", "conjugation"),
      ],
      [],
      now,
    );

    expect(planned.slice(0, 5).map((item) => item.type)).toEqual([
      "mcq",
      "fillBlank",
      "sentenceBuilder",
      "correction",
      "conjugation",
    ]);
  });
});
