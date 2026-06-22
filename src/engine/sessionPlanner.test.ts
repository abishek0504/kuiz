import { describe, expect, test } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import type { ReviewState } from "./scheduler";
import {
  isListeningExercise,
  planBalancedSessionExercises,
  planRecommendedSessionExercises,
  planSessionExercises,
  sessionSummary,
} from "./sessionPlanner";

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

  if (type === "listening") {
    return {
      ...base,
      type,
      question: id,
      acceptedAnswers: { strict: [id], relaxed: [], regex: [] },
      modelAnswer: id,
    };
  }

  if (type === "dictation") {
    return {
      ...base,
      type,
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

  test("prioritizes logged mistakes within the same review bucket", () => {
    const planned = planSessionExercises(
      [exercise("stable"), exercise("missed")],
      [
        state("stable", { dueAt: "2026-06-28T12:00:00.000Z", lastGrade: "good" }),
        state("missed", {
          dueAt: "2026-06-28T12:00:00.000Z",
          lastGrade: "good",
          mistakeTags: { particles: 2 },
        }),
      ],
      now,
    );

    expect(planned.map((item) => item.id)).toEqual(["missed", "stable"]);
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

  test("recommended sessions avoid repeating the same Korean answer across task types", () => {
    const blank = { ...exercise("blank", "fillBlank"), modelAnswer: "저는 도서관에서 책을 읽어요." } as ExerciseRecord;
    const build = { ...exercise("build", "sentenceBuilder"), modelAnswer: "저는 도서관에서 책을 읽어요." } as ExerciseRecord;
    const repair = { ...exercise("repair", "correction"), corrected: "저는 도서관에서 책을 읽어요." } as ExerciseRecord;
    const other = { ...exercise("other", "sentenceBuilder"), modelAnswer: "내일 세 시에 친구를 만나요." } as ExerciseRecord;

    const planned = planRecommendedSessionExercises([blank, build, repair, other], [], now);
    const repeated = planned.filter((item) => item.id === "blank" || item.id === "build" || item.id === "repair");

    expect(repeated).toHaveLength(1);
  });

  test("listening classification only includes actual listening and dictation tasks", () => {
    const blankWithAudio = {
      ...exercise("blank-with-audio", "fillBlank"),
      prompt: { stem: "blank", audioText: "정답을 말해요." },
    } as ExerciseRecord;

    expect(isListeningExercise(blankWithAudio)).toBe(false);
    expect(isListeningExercise(exercise("listen", "listening"))).toBe(true);
    expect(isListeningExercise(exercise("dictate", "dictation"))).toBe(true);
  });
});
