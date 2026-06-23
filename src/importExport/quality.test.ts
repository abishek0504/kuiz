import { describe, expect, it } from "vitest";
import { validateContentQuality } from "./quality";

function basePack(overrides: Record<string, unknown> = {}) {
  return {
    schema: "kuiz-pack@1",
    pack: {
      packId: "test.pack",
      version: "1.0.0",
      title: "Test",
      locale: "en-CA",
      createdAt: "2026-01-01",
      appMinVersion: "1.0.0",
      includes: ["particles"],
    },
    sourceRefs: [],
    vocab: [],
    particles: [{ id: "p1", dedupeKey: "particle:e", form: "에", meaning: "to", usage: "time", examples: [] }],
    grammar: [],
    distractorGroups: [],
    exercises: [],
    ...overrides,
  } as never;
}

describe("validateContentQuality", () => {
  it("requires blank-only accepted answers for multi-blank fill items", () => {
    const errors = validateContentQuality(
      basePack({
        exercises: [
          {
            id: "fill-1",
            dedupeKey: "exercise:fill:1",
            type: "fillBlank",
            tags: ["particles"],
            sourceRefIds: [],
            inferred: false,
            prompt: { stem: "아침___ 저녁___ 일해요." },
            answerPresentation: "phrase",
            acceptedAnswers: { strict: ["아침부터 저녁까지 일해요."], relaxed: [], regex: [] },
            modelAnswer: "부터 저녁까지",
          },
        ],
      }),
    );
    expect(errors.some((error) => error.includes("blank-only"))).toBe(true);
  });

  it("accepts multi-blank fill items with blank-only answers", () => {
    const errors = validateContentQuality(
      basePack({
        exercises: [
          {
            id: "fill-2",
            dedupeKey: "exercise:fill:2",
            type: "fillBlank",
            tags: ["particles"],
            sourceRefIds: [],
            inferred: false,
            prompt: { stem: "아침___ 저녁___ 일해요." },
            answerPresentation: "phrase",
            acceptedAnswers: { strict: ["부터 까지", "아침부터 저녁까지 일해요."], relaxed: [], regex: [] },
            modelAnswer: "부터 저녁까지",
          },
        ],
      }),
    );
    expect(errors.filter((error) => error.includes("blank-only"))).toHaveLength(0);
  });

  it("rejects grammar meaning MCQs tagged as vocab", () => {
    const errors = validateContentQuality(
      basePack({
        exercises: [
          {
            id: "mcq-grammar",
            dedupeKey: "exercise:mcq:grammar",
            type: "mcq",
            choiceKind: "phrase-meaning",
            tags: ["vocab", "grammar"],
            sourceRefIds: [],
            inferred: false,
            prompt: { stem: "What does 공부하고 있어요 mean?" },
            choices: [
              { id: "a", text: "A", isCorrect: false, why: "wrong tense" },
              { id: "b", text: "B", isCorrect: false, why: "wrong meaning" },
              { id: "c", text: "C", isCorrect: false, why: "wrong form" },
              { id: "d", text: "I am studying.", isCorrect: true, why: "progressive" },
            ],
          },
        ],
      }),
    );
    expect(errors.some((error) => error.includes("grammar meaning MCQs"))).toBe(true);
  });
});
