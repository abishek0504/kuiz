import { describe, expect, it } from "vitest";
import type { ExerciseRecord } from "../db/schema";
import { feedbackModelAnswer, getTranslation } from "./quizFeedback";

function mcq(partial: Partial<ExerciseRecord>): ExerciseRecord {
  return {
    id: "mcq-1",
    dedupeKey: "exercise:test",
    type: "mcq",
    choiceKind: "vocab",
    tags: ["vocab"],
    sourceRefIds: [],
    inferred: false,
    packId: "starter",
    searchText: "",
    prompt: { stem: 'Choose the Korean for "friend".', stemEn: "friend" },
    choices: [
      { id: "a", text: "친구", isCorrect: true },
      { id: "b", text: "학교", isCorrect: false },
      { id: "c", text: "책", isCorrect: false },
      { id: "d", text: "집", isCorrect: false },
    ],
    ...partial,
  } as ExerciseRecord;
}

describe("quizFeedback", () => {
  it("returns quoted English for word translation MCQs", () => {
    expect(getTranslation(mcq({}))).toBe("friend");
  });

  it("returns grammar meaning from the correct English choice", () => {
    const exercise = mcq({
      choiceKind: "phrase-meaning",
      prompt: { stem: "What does 공부하고 있어요 mean?" },
      choices: [
        { id: "a", text: "I am studying.", isCorrect: true },
        { id: "b", text: "I studied.", isCorrect: false },
        { id: "c", text: "I study.", isCorrect: false },
        { id: "d", text: "I want to study.", isCorrect: false },
      ],
    });
    expect(getTranslation(exercise)).toBe("I am studying.");
  });

  it("collapses multi-blank particle feedback to the blank sequence", () => {
    const exercise = {
      id: "fill",
      dedupeKey: "exercise:fill",
      type: "fillBlank",
      tags: [],
      sourceRefIds: [],
      inferred: false,
      packId: "starter",
      searchText: "",
      prompt: { stem: "아침___ 저녁___ 일해요." },
      answerPresentation: "phrase",
      acceptedAnswers: { strict: [], relaxed: [], regex: [] },
      modelAnswer: "부터 저녁까지",
    } as ExerciseRecord;
    expect(feedbackModelAnswer(exercise)).toBe("부터 까지");
  });
});
